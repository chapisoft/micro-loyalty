package com.natcash.loyalty.clearing;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.ResolveDisputeRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodResponse;
import com.natcash.loyalty.clearing.entity.LoyaltyClearingDisputeEntity;
import com.natcash.loyalty.clearing.repository.LoyaltyClearingDisputeRepository;
import com.natcash.loyalty.clearing.service.ClearingSettlementService;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.DisputeStatus;
import com.natcash.loyalty.domain.enums.PartnerType;
import com.natcash.loyalty.outbox.service.OutboxService;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerDisputeRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerDisputeResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerReconciliationRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerReconciliationResponse;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClearingSettlementServiceTest {

    @Mock
    private ClearingTransactionRepository clearingRepository;

    @Mock
    private LoyaltyPartnerRepository partnerRepository;

    @Mock
    private LoyaltyClearingDisputeRepository disputeRepository;

    @Mock
    private OutboxService outboxService;

    private ClearingSettlementService clearingService;

    private LoyaltyPartnerEntity testPartner;

    @BeforeEach
    void setUp() {
        clearingService = new ClearingSettlementService(
                clearingRepository,
                partnerRepository,
                disputeRepository,
                outboxService
        );

        testPartner = LoyaltyPartnerEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .partnerCode("DELIMART")
                .partnerName("Siêu Thị Delimart")
                .partnerType(PartnerType.RETAIL)
                .webhookUrl("https://api.delimart.ht/webhook")
                .build();
    }

    @Test
    @DisplayName("CLEARING-01: Tổng hợp báo cáo đối soát bù trừ tài chính đa phương")
    void testGetReconciliationReport() {
        Instant from = Instant.now().minus(7, ChronoUnit.DAYS);
        Instant to = Instant.now();

        ClearingTransactionEntity tx1 = ClearingTransactionEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .redeemerPartnerId(1L)
                .pointsRedeemed(new BigDecimal("100.00"))
                .fiatAmount(new BigDecimal("100.00"))
                .commissionAmount(new BigDecimal("1.50"))
                .netPayoutAmount(new BigDecimal("98.50"))
                .status(ClearingStatus.PENDING)
                .build();

        ClearingTransactionEntity tx2 = ClearingTransactionEntity.builder()
                .id(2L)
                .tenantId("TENANT_DELIMART")
                .redeemerPartnerId(1L)
                .pointsRedeemed(new BigDecimal("200.00"))
                .fiatAmount(new BigDecimal("200.00"))
                .commissionAmount(new BigDecimal("3.00"))
                .netPayoutAmount(new BigDecimal("197.00"))
                .status(ClearingStatus.PENDING)
                .build();

        when(clearingRepository.findByTenantIdAndCreatedAtBetween("TENANT_DELIMART", from, to))
                .thenReturn(List.of(tx1, tx2));
        when(partnerRepository.findByTenantId("TENANT_DELIMART"))
                .thenReturn(List.of(testPartner));

        ReconciliationReportRequest req = ReconciliationReportRequest.builder()
                .fromDate(from)
                .toDate(to)
                .build();

        ReconciliationReportResponse res = clearingService.getReconciliationReport("TENANT_DELIMART", req);

        assertNotNull(res);
        assertEquals(2, res.getGrandTotalTransactions());
        assertEquals(new BigDecimal("300.00"), res.getGrandTotalPointsRedeemed());
        assertEquals(new BigDecimal("300.00"), res.getGrandTotalFiatAmount());
        assertEquals(new BigDecimal("4.50"), res.getGrandTotalCommissionFee());
        assertEquals(new BigDecimal("295.50"), res.getGrandTotalNetSettlement());
        assertEquals(1, res.getPartnerSummaries().size());
        assertEquals("DELIMART", res.getPartnerSummaries().get(0).getPartnerCode());
        assertEquals(new BigDecimal("295.50"), res.getPartnerSummaries().get(0).getNetSettlementAmount());
    }

    @Test
    @DisplayName("CLEARING-02: Chốt kỳ quyết toán bù trừ và sinh mã lô")
    void testSettlePeriod() {
        Instant from = Instant.now().minus(7, ChronoUnit.DAYS);
        Instant to = Instant.now();

        ClearingTransactionEntity tx = ClearingTransactionEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .redeemerPartnerId(1L)
                .fiatAmount(new BigDecimal("500.00"))
                .commissionAmount(new BigDecimal("7.50"))
                .netPayoutAmount(new BigDecimal("492.50"))
                .status(ClearingStatus.PENDING)
                .build();

        when(clearingRepository.findByTenantIdAndCreatedAtBetween("TENANT_DELIMART", from, to))
                .thenReturn(List.of(tx));
        when(partnerRepository.findById(1L))
                .thenReturn(Optional.of(testPartner));

        SettlePeriodRequest req = SettlePeriodRequest.builder()
                .fromDate(from)
                .toDate(to)
                .build();

        SettlePeriodResponse res = clearingService.settlePeriod("TENANT_DELIMART", req);

        assertNotNull(res);
        assertTrue(res.getSettlementBatchCode().startsWith("SETTLE_"));
        assertEquals(1, res.getSettledTransactionCount());
        assertEquals(new BigDecimal("500.00"), res.getTotalSettledAmount());
        assertEquals(new BigDecimal("7.50"), res.getTotalCommissionFee());
        assertEquals(new BigDecimal("492.50"), res.getTotalNetPayout());
        assertEquals(ClearingStatus.SETTLED, res.getStatus());

        verify(clearingRepository, times(1)).saveAll(any());
        verify(outboxService, times(1)).recordEvent(eq("TENANT_DELIMART"), eq("SETTLEMENT_BATCH_GENERATED"), any(), anyString());
    }

    @Test
    @DisplayName("CLEARING-03: Đối tác tra cứu dữ liệu đối soát kỳ")
    void testGetPartnerReconciliation() {
        Instant from = Instant.now().minus(7, ChronoUnit.DAYS);
        Instant to = Instant.now();

        when(partnerRepository.findByTenantIdAndPartnerCode("TENANT_DELIMART", "DELIMART"))
                .thenReturn(Optional.of(testPartner));

        ClearingTransactionEntity tx = ClearingTransactionEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .transactionCode("TX_001")
                .partnerOrderId("ORD_001")
                .redeemerPartnerId(1L)
                .pointsRedeemed(new BigDecimal("150.00"))
                .fiatAmount(new BigDecimal("150.00"))
                .commissionAmount(new BigDecimal("2.25"))
                .netPayoutAmount(new BigDecimal("147.75"))
                .status(ClearingStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        when(clearingRepository.findByTenantIdAndCreatedAtBetween(eq("TENANT_DELIMART"), any(), any()))
                .thenReturn(List.of(tx));

        PartnerReconciliationRequest req = PartnerReconciliationRequest.builder()
                .fromDate(from.toString())
                .toDate(to.toString())
                .build();

        PartnerReconciliationResponse res = clearingService.getPartnerReconciliation("TENANT_DELIMART", "DELIMART", req);

        assertNotNull(res);
        assertEquals("DELIMART", res.getPartnerCode());
        assertEquals(1, res.getTotalTransactions());
        assertEquals(new BigDecimal("150.00"), res.getTotalFiatAmount());
        assertEquals(new BigDecimal("147.75"), res.getNetSettlementAmount());
        assertEquals(1, res.getTransactionDetails().size());
        assertEquals("TX_001", res.getTransactionDetails().get(0).getTransactionCode());
    }

    @Test
    @DisplayName("CLEARING-04: Tạo và xử lý khiếu nại sai lệch đối soát (Dispute Lifecycle)")
    void testDisputeLifecycle() {
        when(partnerRepository.findByTenantIdAndPartnerCode("TENANT_DELIMART", "DELIMART"))
                .thenReturn(Optional.of(testPartner));

        PartnerDisputeRequest req = PartnerDisputeRequest.builder()
                .batchCode("SETTLE_123")
                .transactionCode("TX_MISSING_01")
                .disputeType("MISSING_TX")
                .partnerAmount(new BigDecimal("500.00"))
                .reason("Giao dịch có tại POS nhưng chưa ghi nhận ở Loyalty")
                .build();

        PartnerDisputeResponse disputeRes = clearingService.createDispute("TENANT_DELIMART", "DELIMART", req);

        assertNotNull(disputeRes);
        assertNotNull(disputeRes.getDisputeCode());
        assertTrue(disputeRes.getDisputeCode().startsWith("DISPUTE_"));
        assertEquals("OPEN", disputeRes.getStatus());

        verify(disputeRepository, times(1)).save(any(LoyaltyClearingDisputeEntity.class));

        LoyaltyClearingDisputeEntity disputeEntity = LoyaltyClearingDisputeEntity.builder()
                .id(10L)
                .tenantId("TENANT_DELIMART")
                .disputeCode(disputeRes.getDisputeCode())
                .batchCode("SETTLE_123")
                .partner(testPartner)
                .disputeType("MISSING_TX")
                .partnerAmount(new BigDecimal("500.00"))
                .status(DisputeStatus.OPEN)
                .build();

        when(disputeRepository.findByTenantIdAndDisputeCode("TENANT_DELIMART", disputeRes.getDisputeCode()))
                .thenReturn(Optional.of(disputeEntity));

        ResolveDisputeRequest resolveReq = ResolveDisputeRequest.builder()
                .status("RESOLVED")
                .resolvedAmount(new BigDecimal("500.00"))
                .note("Đã xác nhận hóa đơn hợp lệ và bù tiền quyết toán")
                .build();

        var resolveRes = clearingService.resolveDispute("TENANT_DELIMART", disputeRes.getDisputeCode(), resolveReq);

        assertNotNull(resolveRes);
        assertEquals("RESOLVED", resolveRes.getStatus());
        assertEquals(new BigDecimal("500.00"), resolveRes.getResolvedAmount());
        verify(disputeRepository, times(1)).save(disputeEntity);
    }
}
