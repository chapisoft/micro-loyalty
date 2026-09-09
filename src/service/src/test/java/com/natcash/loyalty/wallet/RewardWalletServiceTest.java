package com.natcash.loyalty.wallet;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.stream.LoyaltyStreamEvent;
import com.natcash.loyalty.stream.LoyaltyStreamProducer;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletInquiryRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletInquiryResponse;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletRedeemRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletRedeemResponse;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletRefundRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletRefundResponse;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherRedemptionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRedemptionRepository;
import com.natcash.loyalty.wallet.service.RewardWalletService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;

import com.natcash.loyalty.wallet.dto.RewardWalletDto.QrTokenGenerateRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.QrTokenGenerateResponse;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.QrTokenVerifyRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.QrTokenVerifyResponse;
import com.natcash.loyalty.common.exception.LoyaltyException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RewardWalletServiceTest {

    @Mock
    private AccountService accountService;

    @Mock
    private LoyaltyAccountRepository accountRepository;

    @Mock
    private LoyaltyPointLedgerRepository ledgerRepository;

    @Mock
    private LoyaltyVoucherRedemptionRepository redemptionRepository;

    @Mock
    private ClearingTransactionRepository clearingRepository;

    @Mock
    private com.natcash.loyalty.wallet.repository.LoyaltyAcceptancePolicyRepository policyRepository;

    @Mock
    private com.natcash.loyalty.account.repository.LoyaltyPartnerRepository partnerRepository;

    @Mock
    private com.natcash.loyalty.campaign.service.MilestoneService milestoneService;

    @Mock
    private DistributedLockHelper lockHelper;

    @Mock
    private LoyaltyStreamProducer streamProducer;

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private RBucket<String> rBucket;

    private RewardWalletService rewardWalletService;

    @BeforeEach
    void setUp() {
        rewardWalletService = new RewardWalletService(
                accountService,
                accountRepository,
                ledgerRepository,
                redemptionRepository,
                clearingRepository,
                policyRepository,
                partnerRepository,
                lockHelper,
                streamProducer,
                milestoneService,
                redissonClient
        );
    }

    @Test
    @DisplayName("BE-13.1: Tra cứu thông tin Ví phần thưởng và Voucher khả dụng")
    void testRewardWalletInquiry() {
        ProfileResponse profile = ProfileResponse.builder()
                .accountId(1L)
                .externalUserId("USER_001")
                .currentPoints(new BigDecimal("1500.00"))
                .build();

        when(accountService.getOrCreateProfile(eq("TENANT_DELIMART"), any()))
                .thenReturn(profile);

        LoyaltyVoucherEntity voucher = LoyaltyVoucherEntity.builder()
                .voucherCode("DELI_50K")
                .title("Giảm 50K hóa đơn 200K")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("50.00"))
                .minBillAmount(new BigDecimal("200.00"))
                .build();

        LoyaltyVoucherRedemptionEntity redemption = LoyaltyVoucherRedemptionEntity.builder()
                .id(10L)
                .redemptionCode("RDM_999")
                .voucher(voucher)
                .status(VoucherStatus.ACTIVE)
                .expiresAt(Instant.now().plusSeconds(86400))
                .build();

        when(redemptionRepository.findByTenantIdAndAccount_ExternalUserIdAndStatusAndExpiresAtAfter(
                eq("TENANT_DELIMART"), eq("USER_001"), eq(VoucherStatus.ACTIVE), any()))
                .thenReturn(List.of(redemption));

        RewardWalletInquiryRequest request = RewardWalletInquiryRequest.builder()
                .externalUserId("USER_001")
                .build();

        RewardWalletInquiryResponse response = rewardWalletService.inquiry("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("1500.00"), response.getCurrentPoints());
        assertEquals(1, response.getTotalVouchers());
        assertEquals("RDM_999", response.getAvailableVouchers().get(0).getRedemptionCode());
    }

    @Test
    @DisplayName("BE-13.2: Khấu trừ đa phương tiện (Điểm + Voucher) tại quầy POS")
    void testRewardWalletRedeemCombined() {
        when(clearingRepository.existsByTenantIdAndTransactionCode("TENANT_DELIMART", "POS_TX_123"))
                .thenReturn(false);

        when(lockHelper.executeWithLock(anyString(), anyLong(), anyLong(), any()))
                .thenAnswer(invocation -> {
                    Supplier<?> supplier = invocation.getArgument(3);
                    return supplier.get();
                });

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("USER_001")
                .currentPoints(new BigDecimal("500.00"))
                .build();

        when(accountService.getAccountForUpdate("TENANT_DELIMART", "USER_001"))
                .thenReturn(account);

        LoyaltyVoucherEntity voucher = LoyaltyVoucherEntity.builder()
                .voucherCode("DELI_100K")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("100.00"))
                .minBillAmount(new BigDecimal("200.00"))
                .build();

        LoyaltyVoucherRedemptionEntity redemption = LoyaltyVoucherRedemptionEntity.builder()
                .id(10L)
                .redemptionCode("RDM_100K")
                .voucher(voucher)
                .status(VoucherStatus.ACTIVE)
                .expiresAt(Instant.now().plusSeconds(86400))
                .build();

        when(redemptionRepository.findByTenantIdAndRedemptionCode("TENANT_DELIMART", "RDM_100K"))
                .thenReturn(Optional.of(redemption));

        // Hóa đơn 1000: Áp voucher 100 -> còn 900. Tối đa khấu trừ điểm 50% = 450. Người dùng yêu cầu trừ 200 điểm.
        RewardWalletRedeemRequest request = RewardWalletRedeemRequest.builder()
                .externalUserId("USER_001")
                .transactionCode("POS_TX_123")
                .totalBillAmount(new BigDecimal("1000.00"))
                .pointsToBurn(new BigDecimal("200.00"))
                .voucherRedemptionCode("RDM_100K")
                .redeemerPartnerId(2L)
                .build();

        RewardWalletRedeemResponse response = rewardWalletService.redeem("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("1000.00"), response.getTotalBillAmount());
        assertEquals(new BigDecimal("100.00"), response.getVoucherDiscountAmount());
        assertEquals(new BigDecimal("200.00"), response.getPointDiscountAmount());
        // 1000 - 100 - 200 = 700
        assertEquals(new BigDecimal("700.00"), response.getFinalAmountToPay());
        // 500 - 200 = 300
        assertEquals(new BigDecimal("300.00"), response.getRemainingPoints());
        assertEquals("SUCCESS", response.getStatus());

        verify(ledgerRepository, times(1)).save(any());
        verify(clearingRepository, times(1)).save(any(ClearingTransactionEntity.class));
        verify(streamProducer, times(1)).publishEvent(any(LoyaltyStreamEvent.class));
    }

    @Test
    @DisplayName("BE-13.3: Hoàn tiền giao dịch hủy hóa đơn")
    void testRewardWalletRefund() {
        ClearingTransactionEntity clearing = ClearingTransactionEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .transactionCode("POS_TX_123")
                .externalUserId("USER_001")
                .pointsRedeemed(new BigDecimal("200.00"))
                .status(ClearingStatus.PENDING)
                .build();

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .id(1L)
                .externalUserId("USER_001")
                .currentPoints(new BigDecimal("300.00"))
                .build();

        when(clearingRepository.findByTenantIdAndTransactionCode("TENANT_DELIMART", "POS_TX_123"))
                .thenReturn(Optional.of(clearing));
        when(accountService.getAccountForUpdate("TENANT_DELIMART", "USER_001"))
                .thenReturn(account);

        RewardWalletRefundRequest request = RewardWalletRefundRequest.builder()
                .originalTransactionCode("POS_TX_123")
                .refundTransactionCode("REFUND_TX_456")
                .reason("Khách hủy mua hàng")
                .build();

        RewardWalletRefundResponse response = rewardWalletService.refund("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("200.00"), response.getPointsRefunded());
        // 300 + 200 = 500
        assertEquals(new BigDecimal("500.00"), response.getNewBalance());
        assertEquals("REFUNDED", response.getStatus());
        assertEquals(ClearingStatus.CANCELLED, clearing.getStatus());

        verify(ledgerRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("BE-13.4: Sinh mã Dynamic QR Token 60s cho Ví Phần Thưởng")
    void testGenerateQrToken() {
        when(redissonClient.getBucket(anyString())).thenReturn(rBucket);

        QrTokenGenerateRequest request = QrTokenGenerateRequest.builder()
                .externalUserId("USER_001")
                .build();

        QrTokenGenerateResponse response = rewardWalletService.generateQrToken("TENANT_DELIMART", request);

        assertNotNull(response);
        assertNotNull(response.getQrToken());
        assertEquals(60, response.getExpiresInSeconds());
        assertNotNull(response.getExpiresAt());
        verify(rBucket, times(1)).set(eq("USER_001"), any(Duration.class));
    }

    @Test
    @DisplayName("BE-13.5: Xác thực Dynamic QR Token 60s thành công")
    void testVerifyQrToken_Success() {
        when(redissonClient.getBucket(anyString())).thenReturn(rBucket);
        when(rBucket.get()).thenReturn("USER_001");

        ProfileResponse profile = ProfileResponse.builder()
                .accountId(1L)
                .externalUserId("USER_001")
                .currentPoints(new BigDecimal("1500.00"))
                .build();
        when(accountService.getOrCreateProfile(eq("TENANT_DELIMART"), any()))
                .thenReturn(profile);

        QrTokenVerifyRequest request = QrTokenVerifyRequest.builder()
                .qrToken("QR_VALID_TOKEN_123")
                .partnerId(2L)
                .build();

        QrTokenVerifyResponse response = rewardWalletService.verifyQrToken("TENANT_DELIMART", request);

        assertNotNull(response);
        assertTrue(response.isValid());
        assertEquals("USER_001", response.getExternalUserId());
        assertEquals(new BigDecimal("1500.00"), response.getCurrentPoints());
    }

    @Test
    @DisplayName("BE-13.6: Xác thực Dynamic QR Token thất bại khi token hết hạn")
    void testVerifyQrToken_Expired() {
        when(redissonClient.getBucket(anyString())).thenReturn(rBucket);
        when(rBucket.get()).thenReturn(null);

        QrTokenVerifyRequest request = QrTokenVerifyRequest.builder()
                .qrToken("QR_EXPIRED_TOKEN")
                .build();

        assertThrows(LoyaltyException.class, () ->
                rewardWalletService.verifyQrToken("TENANT_DELIMART", request)
        );
    }

    @Test
    @DisplayName("BE-13.7: Khấu trừ Ví phần thưởng sử dụng Dynamic QR Token 60s (Single-use atomicity)")
    void testRewardWalletRedeem_WithQrToken() {
        when(redissonClient.getBucket(anyString())).thenReturn(rBucket);
        when(rBucket.getAndDelete()).thenReturn("USER_001");

        when(clearingRepository.existsByTenantIdAndTransactionCode("TENANT_DELIMART", "POS_QR_TX_1"))
                .thenReturn(false);

        when(lockHelper.executeWithLock(anyString(), anyLong(), anyLong(), any()))
                .thenAnswer(invocation -> {
                    Supplier<?> supplier = invocation.getArgument(3);
                    return supplier.get();
                });

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("USER_001")
                .currentPoints(new BigDecimal("500.00"))
                .build();

        when(accountService.getAccountForUpdate("TENANT_DELIMART", "USER_001"))
                .thenReturn(account);

        RewardWalletRedeemRequest request = RewardWalletRedeemRequest.builder()
                .qrToken("QR_DYNAMIC_123")
                .transactionCode("POS_QR_TX_1")
                .totalBillAmount(new BigDecimal("500.00"))
                .pointsToBurn(new BigDecimal("100.00"))
                .redeemerPartnerId(2L)
                .build();

        RewardWalletRedeemResponse response = rewardWalletService.redeem("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals("POS_QR_TX_1", response.getTransactionCode());
        assertEquals("SUCCESS", response.getStatus());
        assertEquals(new BigDecimal("100.00"), response.getPointDiscountAmount());
        assertEquals(new BigDecimal("400.00"), response.getRemainingPoints());

        verify(rBucket, times(1)).getAndDelete();
    }
}
