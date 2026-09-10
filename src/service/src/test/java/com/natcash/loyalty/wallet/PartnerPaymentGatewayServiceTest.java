package com.natcash.loyalty.wallet;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.HoldStatus;
import com.natcash.loyalty.domain.enums.PartnerType;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.outbox.service.OutboxService;
import com.natcash.loyalty.stream.LoyaltyStreamProducer;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerInquiryRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerInquiryResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentAuthorizeRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentAuthorizeResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentCancelRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentCancelResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentConfirmRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentConfirmResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentDirectRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentDirectResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentRefundRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentRefundResponse;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyAcceptancePolicyEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyPaymentHoldEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyAcceptancePolicyRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyPaymentHoldRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRedemptionRepository;
import com.natcash.loyalty.wallet.service.PartnerPaymentGatewayService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Optional;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PartnerPaymentGatewayServiceTest {

    @Mock
    private AccountService accountService;

    @Mock
    private LoyaltyAccountRepository accountRepository;

    @Mock
    private LoyaltyPartnerRepository partnerRepository;

    @Mock
    private LoyaltyAcceptancePolicyRepository policyRepository;

    @Mock
    private LoyaltyPaymentHoldRepository holdRepository;

    @Mock
    private ClearingTransactionRepository clearingRepository;

    @Mock
    private LoyaltyPointLedgerRepository ledgerRepository;

    @Mock
    private LoyaltyVoucherRedemptionRepository redemptionRepository;

    @Mock
    private DistributedLockHelper lockHelper;

    @Mock
    private LoyaltyStreamProducer streamProducer;

    @Mock
    private OutboxService outboxService;

    private PartnerPaymentGatewayService paymentService;

    private LoyaltyPartnerEntity testPartner;
    private LoyaltyAcceptancePolicyEntity testPolicy;
    private LoyaltyAccountEntity testAccount;

    @BeforeEach
    void setUp() {
        paymentService = new PartnerPaymentGatewayService(
                accountService,
                accountRepository,
                partnerRepository,
                policyRepository,
                holdRepository,
                clearingRepository,
                ledgerRepository,
                redemptionRepository,
                lockHelper,
                streamProducer,
                outboxService
        );

        testPartner = LoyaltyPartnerEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .partnerCode("DELIMART")
                .partnerName("Siêu Thị Delimart")
                .partnerType(PartnerType.RETAIL)
                .apiKey("pk_delimart")
                .secretKey("sk_delimart")
                .webhookUrl("https://api.delimart.ht/webhook")
                .status(CommonStatus.ACTIVE)
                .build();

        testPolicy = LoyaltyAcceptancePolicyEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .partner(testPartner)
                .pointExchangeRate(BigDecimal.ONE)
                .maxBurnPercentage(new BigDecimal("50.00"))
                .minBurnPoints(new BigDecimal("10.00"))
                .maxBurnPointsPerTx(new BigDecimal("5000.00"))
                .commissionRatePercent(new BigDecimal("1.50"))
                .fixedFeePerTx(BigDecimal.ZERO)
                .status(CommonStatus.ACTIVE)
                .build();

        testAccount = LoyaltyAccountEntity.builder()
                .id(100L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("50937123456")
                .currentPoints(new BigDecimal("2000.00"))
                .status(CommonStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("PARTNER-01: Tra cứu số dư và chính sách điểm khả dụng tại đối tác (Inquiry)")
    void testInquiry_Success() {
        when(partnerRepository.findByTenantIdAndPartnerCode("TENANT_DELIMART", "DELIMART"))
                .thenReturn(Optional.of(testPartner));

        ProfileResponse profile = ProfileResponse.builder()
                .externalUserId("50937123456")
                .fullName("Jean Baptiste")
                .currentPoints(new BigDecimal("2000.00"))
                .build();

        when(accountService.getOrCreateProfile(eq("TENANT_DELIMART"), any()))
                .thenReturn(profile);
        when(policyRepository.findByTenantIdAndPartnerId("TENANT_DELIMART", 1L))
                .thenReturn(Optional.of(testPolicy));
        when(redemptionRepository.findByTenantIdAndAccount_ExternalUserIdAndStatusAndExpiresAtAfter(any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        PartnerInquiryRequest req = PartnerInquiryRequest.builder()
                .customerIdentifier("50937123456")
                .billAmount(new BigDecimal("1000.00"))
                .build();

        PartnerInquiryResponse res = paymentService.inquiry("TENANT_DELIMART", "DELIMART", req);

        assertNotNull(res);
        assertEquals("50937123456", res.getExternalUserId());
        assertEquals(new BigDecimal("2000.00"), res.getCurrentPoints());
        assertEquals(new BigDecimal("500.00"), res.getMaxDeductiblePoints()); // 50% của 1000 HTG
        assertEquals(new BigDecimal("500.00"), res.getMaxDeductibleAmount());
    }

    @Test
    @DisplayName("PARTNER-02: Tạm giữ điểm hóa đơn thành công (Authorize Hold)")
    void testAuthorize_Success() {
        when(partnerRepository.findByTenantIdAndPartnerCode("TENANT_DELIMART", "DELIMART"))
                .thenReturn(Optional.of(testPartner));
        when(policyRepository.findByTenantIdAndPartnerId("TENANT_DELIMART", 1L))
                .thenReturn(Optional.of(testPolicy));

        when(lockHelper.executeWithLock(anyString(), anyLong(), anyLong(), any()))
                .thenAnswer(inv -> {
                    Supplier<?> s = inv.getArgument(3);
                    return s.get();
                });

        when(accountService.getAccountForUpdate("TENANT_DELIMART", "50937123456"))
                .thenReturn(testAccount);

        PartnerPaymentAuthorizeRequest req = PartnerPaymentAuthorizeRequest.builder()
                .customerIdentifier("50937123456")
                .partnerOrderId("ORD_999")
                .billAmount(new BigDecimal("600.00"))
                .pointsToBurn(new BigDecimal("200.00"))
                .build();

        PartnerPaymentAuthorizeResponse res = paymentService.authorize("TENANT_DELIMART", "DELIMART", req);

        assertNotNull(res);
        assertNotNull(res.getHoldCode());
        assertTrue(res.getHoldCode().startsWith("HOLD_"));
        assertEquals(HoldStatus.HELD, res.getStatus());
        assertEquals(new BigDecimal("200.00"), res.getPointsHeld());
        assertEquals(new BigDecimal("200.00"), res.getPointDiscountAmount());
        assertEquals(new BigDecimal("400.00"), res.getFinalAmountToPay());

        verify(holdRepository, times(1)).save(any(LoyaltyPaymentHoldEntity.class));
    }

    @Test
    @DisplayName("PARTNER-03: Xác nhận cấn trừ điểm chính thức theo mã Hold (Confirm/Capture)")
    void testConfirm_Success() {
        LoyaltyPaymentHoldEntity hold = LoyaltyPaymentHoldEntity.builder()
                .id(50L)
                .tenantId("TENANT_DELIMART")
                .holdCode("HOLD_123456")
                .partner(testPartner)
                .externalUserId("50937123456")
                .partnerOrderId("ORD_999")
                .billAmount(new BigDecimal("600.00"))
                .pointsHeld(new BigDecimal("200.00"))
                .pointDiscountAmount(new BigDecimal("200.00"))
                .voucherDiscountAmount(BigDecimal.ZERO)
                .status(HoldStatus.HELD)
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .build();

        when(clearingRepository.existsByTenantIdAndTransactionCode("TENANT_DELIMART", "TX_POS_888"))
                .thenReturn(false);
        when(holdRepository.findByTenantIdAndHoldCode("TENANT_DELIMART", "HOLD_123456"))
                .thenReturn(Optional.of(hold));

        when(lockHelper.executeWithLock(anyString(), anyLong(), anyLong(), any()))
                .thenAnswer(inv -> {
                    Supplier<?> s = inv.getArgument(3);
                    return s.get();
                });

        when(accountService.getAccountForUpdate("TENANT_DELIMART", "50937123456"))
                .thenReturn(testAccount);
        when(policyRepository.findByTenantIdAndPartnerId("TENANT_DELIMART", 1L))
                .thenReturn(Optional.of(testPolicy));

        PartnerPaymentConfirmRequest req = PartnerPaymentConfirmRequest.builder()
                .holdCode("HOLD_123456")
                .transactionCode("TX_POS_888")
                .partnerOrderId("ORD_999")
                .build();

        PartnerPaymentConfirmResponse res = paymentService.confirm("TENANT_DELIMART", "DELIMART", req);

        assertNotNull(res);
        assertEquals("TX_POS_888", res.getTransactionCode());
        assertEquals(new BigDecimal("200.00"), res.getPointsBurned());
        assertEquals(new BigDecimal("1800.00"), res.getRemainingPoints()); // 2000 - 200

        verify(accountRepository, times(1)).save(any(LoyaltyAccountEntity.class));
        verify(ledgerRepository, times(1)).save(any());
        verify(clearingRepository, times(1)).save(any(ClearingTransactionEntity.class));
        verify(outboxService, times(1)).recordEvent(eq("TENANT_DELIMART"), eq("PAYMENT_COMPLETED"), any(), anyString());
    }

    @Test
    @DisplayName("PARTNER-04: Hủy phiên giữ điểm thành công (Cancel/Void)")
    void testCancel_Success() {
        LoyaltyPaymentHoldEntity hold = LoyaltyPaymentHoldEntity.builder()
                .id(50L)
                .tenantId("TENANT_DELIMART")
                .holdCode("HOLD_123456")
                .pointsHeld(new BigDecimal("200.00"))
                .status(HoldStatus.HELD)
                .build();

        when(holdRepository.findByTenantIdAndHoldCode("TENANT_DELIMART", "HOLD_123456"))
                .thenReturn(Optional.of(hold));

        PartnerPaymentCancelRequest req = PartnerPaymentCancelRequest.builder()
                .holdCode("HOLD_123456")
                .reason("Khách hủy đơn tại POS")
                .build();

        PartnerPaymentCancelResponse res = paymentService.cancel("TENANT_DELIMART", "DELIMART", req);

        assertNotNull(res);
        assertEquals(HoldStatus.CANCELLED, res.getStatus());
        assertEquals(new BigDecimal("200.00"), res.getPointsReleased());
        verify(holdRepository, times(1)).save(hold);
    }

    @Test
    @DisplayName("PARTNER-05: Thanh toán 1 chạm trực tiếp qua Dynamic QR (Direct Payment)")
    void testDirectPayment_Success() {
        when(clearingRepository.existsByTenantIdAndTransactionCode("TENANT_DELIMART", "TX_DIRECT_001"))
                .thenReturn(false);
        when(partnerRepository.findByTenantIdAndPartnerCode("TENANT_DELIMART", "DELIMART"))
                .thenReturn(Optional.of(testPartner));
        when(policyRepository.findByTenantIdAndPartnerId("TENANT_DELIMART", 1L))
                .thenReturn(Optional.of(testPolicy));

        when(lockHelper.executeWithLock(anyString(), anyLong(), anyLong(), any()))
                .thenAnswer(inv -> {
                    Supplier<?> s = inv.getArgument(3);
                    return s.get();
                });

        when(accountService.getAccountForUpdate("TENANT_DELIMART", "50937123456"))
                .thenReturn(testAccount);

        PartnerPaymentDirectRequest req = PartnerPaymentDirectRequest.builder()
                .qrToken("QR_50937123456_999")
                .transactionCode("TX_DIRECT_001")
                .partnerOrderId("ORD_DIR_001")
                .billAmount(new BigDecimal("500.00"))
                .pointsToBurn(new BigDecimal("100.00"))
                .build();

        PartnerPaymentDirectResponse res = paymentService.directPayment("TENANT_DELIMART", "DELIMART", req);

        assertNotNull(res);
        assertEquals("TX_DIRECT_001", res.getTransactionCode());
        assertEquals(new BigDecimal("100.00"), res.getPointsBurned());
        assertEquals(new BigDecimal("1900.00"), res.getRemainingPoints());
        assertEquals(new BigDecimal("400.00"), res.getFinalAmountToPay());

        verify(clearingRepository, times(1)).save(any(ClearingTransactionEntity.class));
    }

    @Test
    @DisplayName("PARTNER-06: Hoàn trả điểm hóa đơn hủy (Refund)")
    void testRefund_Success() {
        ClearingTransactionEntity origClearing = ClearingTransactionEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .transactionCode("TX_ORIG_001")
                .externalUserId("50937123456")
                .pointsRedeemed(new BigDecimal("300.00"))
                .fiatAmount(new BigDecimal("300.00"))
                .status(ClearingStatus.PENDING)
                .build();

        when(clearingRepository.existsByTenantIdAndTransactionCode("TENANT_DELIMART", "TX_REFUND_001"))
                .thenReturn(false);
        when(clearingRepository.findByTenantIdAndTransactionCode("TENANT_DELIMART", "TX_ORIG_001"))
                .thenReturn(Optional.of(origClearing));
        when(partnerRepository.findByTenantIdAndPartnerCode("TENANT_DELIMART", "DELIMART"))
                .thenReturn(Optional.of(testPartner));

        when(lockHelper.executeWithLock(anyString(), anyLong(), anyLong(), any()))
                .thenAnswer(inv -> {
                    Supplier<?> s = inv.getArgument(3);
                    return s.get();
                });

        when(accountService.getAccountForUpdate("TENANT_DELIMART", "50937123456"))
                .thenReturn(testAccount);

        PartnerPaymentRefundRequest req = PartnerPaymentRefundRequest.builder()
                .originalTransactionCode("TX_ORIG_001")
                .refundTransactionCode("TX_REFUND_001")
                .pointsToRefund(new BigDecimal("300.00"))
                .reason("Khách trả hàng tại quầy")
                .build();

        PartnerPaymentRefundResponse res = paymentService.refund("TENANT_DELIMART", "DELIMART", req);

        assertNotNull(res);
        assertEquals("TX_REFUND_001", res.getRefundTransactionCode());
        assertEquals(new BigDecimal("300.00"), res.getPointsRefunded());
        assertEquals(new BigDecimal("2300.00"), res.getNewBalance()); // 2000 + 300
        assertEquals(ClearingStatus.REFUNDED, res.getStatus());

        verify(clearingRepository, times(1)).save(origClearing);
        verify(ledgerRepository, times(1)).save(any());
    }
}
