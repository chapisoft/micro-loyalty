package com.natcash.loyalty.clearing;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.approval.dto.ApprovalDto.ApprovalItemResponse;
import com.natcash.loyalty.approval.service.ApprovalQueueService;
import com.natcash.loyalty.clearing.dto.ClearingDto.AutoBatchCreateRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.PayBatchRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SponsorAttributionSummaryResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.ThreeWayReconcileItem;
import com.natcash.loyalty.clearing.dto.ClearingDto.ThreeWayReconcileRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.ThreeWayReconcileResponse;
import com.natcash.loyalty.clearing.entity.ClearingPaymentBatchEntity;
import com.natcash.loyalty.clearing.entity.ClearingTransactionBreakdownEntity;
import com.natcash.loyalty.clearing.entity.LoyaltyClearingDisputeEntity;
import com.natcash.loyalty.clearing.repository.ClearingPaymentBatchRepository;
import com.natcash.loyalty.clearing.repository.ClearingTransactionBreakdownRepository;
import com.natcash.loyalty.clearing.repository.LoyaltyClearingDisputeRepository;
import com.natcash.loyalty.clearing.repository.LoyaltyClearinghouseSettlementRepository;
import com.natcash.loyalty.clearing.service.ClearingBreakdownRecorderService;
import com.natcash.loyalty.clearing.service.ClearingBreakdownRecorderService.VoucherSlice;
import com.natcash.loyalty.clearing.service.ClearingSettlementService;
import com.natcash.loyalty.domain.enums.BatchDirection;
import com.natcash.loyalty.domain.enums.BatchSettlementStatus;
import com.natcash.loyalty.domain.enums.BucketStatus;
import com.natcash.loyalty.domain.enums.ClearingSourceType;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.CurrencyAssetType;
import com.natcash.loyalty.domain.enums.HoldStatus;
import com.natcash.loyalty.domain.enums.PartnerType;
import com.natcash.loyalty.domain.enums.ReconciliationStatus;
import com.natcash.loyalty.domain.enums.SponsorType;
import com.natcash.loyalty.integration.NatcashWalletClient;
import com.natcash.loyalty.ledger.entity.PointExpirationBucketEntity;
import com.natcash.loyalty.ledger.repository.PointExpirationBucketRepository;
import com.natcash.loyalty.ledger.service.PointBucketFifoService;
import com.natcash.loyalty.ledger.service.PointBucketFifoService.FifoBucketConsumption;
import com.natcash.loyalty.outbox.service.OutboxService;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PooledClearingAndBreakdownTest {

    private static final String TENANT_NATCASH = "TENANT_NATCASH";

    @Mock
    private ClearingTransactionRepository clearingRepository;
    @Mock
    private LoyaltyPartnerRepository partnerRepository;
    @Mock
    private LoyaltyClearingDisputeRepository disputeRepository;
    @Mock
    private LoyaltyClearinghouseSettlementRepository settlementRepository;
    @Mock
    private ClearingPaymentBatchRepository paymentBatchRepository;
    @Mock
    private ClearingTransactionBreakdownRepository breakdownRepository;
    @Mock
    private LoyaltyPaymentHoldRepository holdRepository;
    @Mock
    private PartnerPaymentGatewayService paymentGatewayService;
    @Mock
    private ApprovalQueueService approvalQueueService;
    @Mock
    private LoyaltyAcceptancePolicyRepository policyRepository;
    @Mock
    private OutboxService outboxService;
    @Mock
    private PointExpirationBucketRepository bucketRepository;
    @Mock
    private LoyaltyVoucherRedemptionRepository redemptionRepository;

    private PointBucketFifoService fifoService;
    private ClearingBreakdownRecorderService breakdownRecorderService;
    private ClearingSettlementService clearingService;

    private LoyaltyPartnerEntity delimart;
    private LoyaltyPartnerEntity totalPartner;

    @BeforeEach
    void setUp() {
        fifoService = new PointBucketFifoService(bucketRepository);
        breakdownRecorderService = new ClearingBreakdownRecorderService(breakdownRepository, redemptionRepository, null);
        ReflectionTestUtils.setField(breakdownRecorderService, "pointBucketFifoService", fifoService);

        clearingService = new ClearingSettlementService(
                clearingRepository, partnerRepository, disputeRepository, settlementRepository, outboxService);
        ReflectionTestUtils.setField(clearingService, "paymentBatchRepository", paymentBatchRepository);
        ReflectionTestUtils.setField(clearingService, "breakdownRepository", breakdownRepository);
        ReflectionTestUtils.setField(clearingService, "holdRepository", holdRepository);
        ReflectionTestUtils.setField(clearingService, "paymentGatewayService", paymentGatewayService);
        ReflectionTestUtils.setField(clearingService, "breakdownRecorderService", breakdownRecorderService);
        ReflectionTestUtils.setField(clearingService, "approvalQueueService", approvalQueueService);
        ReflectionTestUtils.setField(clearingService, "policyRepository", policyRepository);

        delimart = LoyaltyPartnerEntity.builder()
                .id(10L)
                .tenantId(TENANT_NATCASH)
                .partnerCode("DELIMART")
                .partnerName("Siêu Thị Delimart")
                .partnerType(PartnerType.RETAIL)
                .build();

        totalPartner = LoyaltyPartnerEntity.builder()
                .id(20L)
                .tenantId(TENANT_NATCASH)
                .partnerCode("TOTAL")
                .partnerName("TotalEnergies Haiti")
                .partnerType(PartnerType.FUEL)
                .build();
    }

    @Test
    @DisplayName("POOLED-01: Bóc tách chi tiết nhiều Voucher (đồng tài trợ) + nhiều lô Coin FIFO trên 1 giao dịch")
    void testRecordBreakdowns_MultiVoucherAndFifoCoin() {
        ClearingTransactionEntity clearing = ClearingTransactionEntity.builder()
                .id(101L)
                .tenantId(TENANT_NATCASH)
                .transactionCode("TX_POOL_001")
                .holdCode("HOLD_POOL_001")
                .fiatAmount(new BigDecimal("250.00"))
                .build();

        List<VoucherSlice> vouchers = List.of(
                VoucherSlice.builder()
                        .redemptionId(1L)
                        .sourceRef("VC_DELI_100")
                        .partnerId(10L)
                        .sponsorType(SponsorType.CO_FUNDED)
                        .natcashSharePercent(new BigDecimal("40.00"))
                        .partnerSharePercent(new BigDecimal("60.00"))
                        .appliedDiscount(new BigDecimal("100.00"))
                        .build(),
                VoucherSlice.builder()
                        .redemptionId(2L)
                        .sourceRef("VC_NAT_50")
                        .partnerId(null)
                        .sponsorType(SponsorType.NATCASH)
                        .natcashSharePercent(new BigDecimal("100.00"))
                        .partnerSharePercent(BigDecimal.ZERO)
                        .appliedDiscount(new BigDecimal("50.00"))
                        .build()
        );

        List<FifoBucketConsumption> fifoLots = List.of(
                FifoBucketConsumption.builder()
                        .bucketId(1L)
                        .sourceRef("NATCASH_EARN")
                        .fundingPartnerId(null)
                        .sponsorType(SponsorType.NATCASH)
                        .pointsConsumed(new BigDecimal("70.00"))
                        .build(),
                FifoBucketConsumption.builder()
                        .bucketId(2L)
                        .sourceRef("CAMP_TOTAL")
                        .fundingPartnerId(20L)
                        .sponsorType(SponsorType.PARTNER)
                        .pointsConsumed(new BigDecimal("30.00"))
                        .build()
        );

        when(breakdownRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<ClearingTransactionBreakdownEntity> saved = breakdownRecorderService.recordBreakdowns(
                clearing, vouchers, fifoLots, new BigDecimal("100.00"), new BigDecimal("100.00"), BigDecimal.ONE, 10L);

        assertEquals(5, saved.size());
        BigDecimal totalSum = saved.stream()
                .map(ClearingTransactionBreakdownEntity::getPayableAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, new BigDecimal("250.00").compareTo(totalSum));

        assertEquals(ClearingSourceType.VOUCHER, saved.get(0).getSourceType());
        assertEquals(SponsorType.NATCASH, saved.get(0).getSponsorType());
        assertEquals(0, new BigDecimal("40.00").compareTo(saved.get(0).getPayableAmount()));

        assertEquals(SponsorType.PARTNER, saved.get(1).getSponsorType());
        assertEquals(10L, saved.get(1).getFundingPartnerId());
        assertEquals(0, new BigDecimal("60.00").compareTo(saved.get(1).getPayableAmount()));

        assertEquals(SponsorType.NATCASH, saved.get(2).getSponsorType());
        assertEquals(0, new BigDecimal("50.00").compareTo(saved.get(2).getPayableAmount()));

        assertEquals(ClearingSourceType.LOYALTY_COIN, saved.get(3).getSourceType());
        assertEquals(0, new BigDecimal("70.00").compareTo(saved.get(3).getPayableAmount()));

        assertEquals(20L, saved.get(4).getFundingPartnerId());
        assertEquals(0, new BigDecimal("30.00").compareTo(saved.get(4).getPayableAmount()));
    }

    @Test
    @DisplayName("POOLED-02: Theo dõi FIFO với Funding Partner và hoàn trả lại đúng lô khi Revert")
    void testFifoTraceAndRestore() {
        PointExpirationBucketEntity bucket = PointExpirationBucketEntity.builder()
                .id(99L)
                .tenantId(TENANT_NATCASH)
                .accountId(55L)
                .assetType(CurrencyAssetType.LOYALTY_COIN)
                .initialPoints(new BigDecimal("100.00"))
                .remainingPoints(new BigDecimal("100.00"))
                .fundingPartnerId(20L)
                .sponsorType(SponsorType.PARTNER)
                .sourceRef("CAMP_TOTAL")
                .expiredAt(Instant.now().plus(30, ChronoUnit.DAYS))
                .status(BucketStatus.ACTIVE)
                .build();

        when(bucketRepository.findActiveBucketsFifoForUpdate(TENANT_NATCASH, 55L, CurrencyAssetType.LOYALTY_COIN))
                .thenReturn(List.of(bucket));
        when(bucketRepository.findById(99L)).thenReturn(Optional.of(bucket));
        when(bucketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        List<FifoBucketConsumption> trace = fifoService.consumeFifoWithTrace(
                TENANT_NATCASH, 55L, new BigDecimal("100.00"), CurrencyAssetType.LOYALTY_COIN);

        assertEquals(1, trace.size());
        assertEquals(20L, trace.get(0).getFundingPartnerId());
        assertEquals(BucketStatus.DEPLETED, bucket.getStatus());

        fifoService.restoreBucket(99L, new BigDecimal("100.00"));
        assertEquals(BucketStatus.ACTIVE, bucket.getStatus());
        assertEquals(0, new BigDecimal("100.00").compareTo(bucket.getRemainingPoints()));
    }

    @Test
    @DisplayName("POOLED-03: Đối soát 3 bên xử lý Khớp toàn phần, Saga Auto-Confirm, Core Revert, Lệch tiền & Missing Tx")
    void testThreeWayReconcile_AllScenarios() {
        ClearingTransactionEntity matchedTx = ClearingTransactionEntity.builder()
                .id(1L).tenantId(TENANT_NATCASH).transactionCode("TX_OK").holdCode("HOLD_OK")
                .redeemerPartnerId(10L).fiatAmount(new BigDecimal("250.00"))
                .reconciliationStatus(ReconciliationStatus.UNMATCHED).status(ClearingStatus.PENDING)
                .build();

        ClearingTransactionEntity revertTx = ClearingTransactionEntity.builder()
                .id(2L).tenantId(TENANT_NATCASH).transactionCode("TX_REV").holdCode("HOLD_REV")
                .redeemerPartnerId(10L).fiatAmount(new BigDecimal("120.00"))
                .reconciliationStatus(ReconciliationStatus.UNMATCHED).status(ClearingStatus.PENDING)
                .build();

        ClearingTransactionEntity mismatchTx = ClearingTransactionEntity.builder()
                .id(3L).tenantId(TENANT_NATCASH).transactionCode("TX_DIFF").holdCode("HOLD_DIFF")
                .redeemerPartnerId(10L).fiatAmount(new BigDecimal("100.00"))
                .reconciliationStatus(ReconciliationStatus.UNMATCHED).status(ClearingStatus.PENDING)
                .build();

        LoyaltyPaymentHoldEntity staleHold = LoyaltyPaymentHoldEntity.builder()
                .id(50L).tenantId(TENANT_NATCASH).holdCode("HOLD_SAGA").partner(delimart)
                .partnerOrderId("ORD_SAGA").status(HoldStatus.HELD)
                .build();

        ClearingTransactionEntity autoConfirmedTx = ClearingTransactionEntity.builder()
                .id(4L).tenantId(TENANT_NATCASH).transactionCode("TX_SAGA").holdCode("HOLD_SAGA")
                .redeemerPartnerId(10L).fiatAmount(new BigDecimal("80.00"))
                .reconciliationStatus(ReconciliationStatus.UNMATCHED).status(ClearingStatus.PENDING)
                .build();

        when(clearingRepository.findByTenantIdAndHoldCode(TENANT_NATCASH, "HOLD_OK")).thenReturn(Optional.of(matchedTx));
        when(clearingRepository.findByTenantIdAndHoldCode(TENANT_NATCASH, "HOLD_REV")).thenReturn(Optional.of(revertTx));
        when(clearingRepository.findByTenantIdAndHoldCode(TENANT_NATCASH, "HOLD_DIFF")).thenReturn(Optional.of(mismatchTx));
        when(clearingRepository.findByTenantIdAndHoldCode(TENANT_NATCASH, "HOLD_SAGA"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(autoConfirmedTx));
        when(holdRepository.findByTenantIdAndHoldCode(TENANT_NATCASH, "HOLD_SAGA")).thenReturn(Optional.of(staleHold));
        when(partnerRepository.findById(10L)).thenReturn(Optional.of(delimart));
        when(partnerRepository.findByTenantId(TENANT_NATCASH)).thenReturn(List.of(delimart));
        when(disputeRepository.save(any(LoyaltyClearingDisputeEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        ThreeWayReconcileRequest req = ThreeWayReconcileRequest.builder()
                .items(List.of(
                        ThreeWayReconcileItem.builder().coreTxId("CORE_1").holdCode("HOLD_OK").poolDeductedAmount(new BigDecimal("250.00")).coreStatus("SUCCESS").build(),
                        ThreeWayReconcileItem.builder().coreTxId("CORE_2").holdCode("HOLD_REV").poolDeductedAmount(new BigDecimal("120.00")).coreStatus("REVERTED").build(),
                        ThreeWayReconcileItem.builder().coreTxId("CORE_3").holdCode("HOLD_DIFF").poolDeductedAmount(new BigDecimal("150.00")).coreStatus("SUCCESS").build(),
                        ThreeWayReconcileItem.builder().coreTxId("CORE_4").holdCode("HOLD_SAGA").transactionCode("TX_SAGA").poolDeductedAmount(new BigDecimal("80.00")).coreStatus("SUCCESS").build(),
                        ThreeWayReconcileItem.builder().coreTxId("CORE_5").holdCode("HOLD_MISSING").poolDeductedAmount(new BigDecimal("40.00")).coreStatus("SUCCESS").build()
                ))
                .build();

        ThreeWayReconcileResponse res = clearingService.reconcileThreeWay(TENANT_NATCASH, req);

        assertEquals(5, res.getTotalChecked());
        assertEquals(2, res.getMatchedCount());
        assertEquals(1, res.getAutoConfirmedCount());
        assertEquals(1, res.getAutoRevertedCount());
        assertEquals(2, res.getDisputedCount());
        assertEquals(1, res.getMissingTxCount());
        assertEquals(ReconciliationStatus.MATCHED, matchedTx.getReconciliationStatus());
        assertEquals(ClearingStatus.CANCELLED, revertTx.getStatus());
        assertEquals(ReconciliationStatus.DISPUTED, mismatchTx.getReconciliationStatus());
        verify(paymentGatewayService, times(1)).confirm(eq(TENANT_NATCASH), eq("DELIMART"), any());
    }

    @Test
    @DisplayName("POOLED-04: Tổng hợp nghĩa vụ hoàn bù W_LOYALTY_POOL, tạo lô tự động & khóa sổ PAID + 035404")
    void testSponsorAttributionSummary_AutoBatchAndPay() {
        Instant from = Instant.now().minus(7, ChronoUnit.DAYS);
        Instant to = Instant.now();

        ClearingTransactionEntity tx = ClearingTransactionEntity.builder()
                .id(101L).tenantId(TENANT_NATCASH).transactionCode("TX_POOL_001")
                .redeemerPartnerId(10L).billAmount(new BigDecimal("1000.00"))
                .fiatAmount(new BigDecimal("250.00")).commissionAmount(new BigDecimal("3.75"))
                .reconciliationStatus(ReconciliationStatus.MATCHED).status(ClearingStatus.PENDING)
                .build();

        List<ClearingTransactionBreakdownEntity> bdRows = new ArrayList<>();
        bdRows.add(ClearingTransactionBreakdownEntity.builder()
                .id(1L).tenantId(TENANT_NATCASH).clearingTxId(101L).transactionCode("TX_POOL_001")
                .sourceType(ClearingSourceType.VOUCHER).sponsorType(SponsorType.NATCASH)
                .fundingPartnerId(null).payableAmount(new BigDecimal("160.00")).reverted(false).build());
        bdRows.add(ClearingTransactionBreakdownEntity.builder()
                .id(2L).tenantId(TENANT_NATCASH).clearingTxId(101L).transactionCode("TX_POOL_001")
                .sourceType(ClearingSourceType.VOUCHER).sponsorType(SponsorType.PARTNER)
                .fundingPartnerId(10L).payableAmount(new BigDecimal("60.00")).reverted(false).build());
        bdRows.add(ClearingTransactionBreakdownEntity.builder()
                .id(3L).tenantId(TENANT_NATCASH).clearingTxId(101L).transactionCode("TX_POOL_001")
                .sourceType(ClearingSourceType.LOYALTY_COIN).sponsorType(SponsorType.PARTNER)
                .fundingPartnerId(20L).payableAmount(new BigDecimal("30.00")).reverted(false).build());

        when(clearingRepository.findByTenantIdAndCreatedAtBetween(eq(TENANT_NATCASH), any(), any())).thenReturn(List.of(tx));
        when(clearingRepository.findByTenantIdAndStatus(TENANT_NATCASH, ClearingStatus.PENDING)).thenReturn(List.of(tx));
        when(breakdownRepository.findByTenantIdAndClearingTxIdIn(eq(TENANT_NATCASH), eq(List.of(101L)))).thenReturn(bdRows);
        when(partnerRepository.findByTenantId(TENANT_NATCASH)).thenReturn(List.of(delimart, totalPartner));
        when(partnerRepository.findByIdAndTenantId(10L, TENANT_NATCASH)).thenReturn(Optional.of(delimart));
        when(policyRepository.findByTenantIdAndPartnerId(TENANT_NATCASH, 10L))
                .thenReturn(Optional.of(LoyaltyAcceptancePolicyEntity.builder().commissionRatePercent(new BigDecimal("1.50")).build()));
        when(paymentBatchRepository.save(any())).thenAnswer(inv -> {
            ClearingPaymentBatchEntity b = inv.getArgument(0);
            if (b.getId() == null) {
                b.setId(77L);
            }
            return b;
        });
        when(paymentBatchRepository.findByTenantIdAndBatchCode(eq(TENANT_NATCASH), anyString()))
                .thenAnswer(inv -> Optional.of(ClearingPaymentBatchEntity.builder()
                        .id(77L).tenantId(TENANT_NATCASH).batchCode(inv.getArgument(1))
                        .partnerId(10L).batchDirection(BatchDirection.NET_OFFSET)
                        .sponsorPayableAmount(new BigDecimal("60.00"))
                        .netPayableAmount(new BigDecimal("186.25"))
                        .status(BatchSettlementStatus.PENDING_CONFIRM)
                        .build()));
        when(approvalQueueService.submitRequest(eq(TENANT_NATCASH), any()))
                .thenReturn(ApprovalItemResponse.builder().id(888L).build());

        SponsorAttributionSummaryResponse summary = clearingService.getSponsorAttributionSummary(TENANT_NATCASH, from, to);
        assertEquals(0, new BigDecimal("250.00").compareTo(summary.getTotalPoolReplenishRequired()));
        assertEquals(0, new BigDecimal("160.00").compareTo(summary.getNatcashBudgetAmount()));
        assertEquals(0, new BigDecimal("90.00").compareTo(summary.getPartnerReceivableAmount()));

        ClearingPaymentBatchEntity createdBatch = clearingService.createAutoPaymentBatch(
                TENANT_NATCASH, AutoBatchCreateRequest.builder().partnerId(10L).build());
        assertEquals(BatchDirection.NET_OFFSET, createdBatch.getBatchDirection());
        assertEquals(0, new BigDecimal("60.00").compareTo(createdBatch.getSponsorPayableAmount()));
        // 250 - 3.75 MDR - 60 Sponsor Debt = 186.25 Net Payout
        assertEquals(0, new BigDecimal("186.25").compareTo(createdBatch.getNetPayableAmount()));

        ClearingPaymentBatchEntity submitted = clearingService.submitBatchForApproval(TENANT_NATCASH, createdBatch.getBatchCode(), "maker1");
        assertEquals(888L, submitted.getApprovalRequestId());

        ClearingPaymentBatchEntity paid = clearingService.payPaymentBatch(
                TENANT_NATCASH, createdBatch.getBatchCode(),
                PayBatchRequest.builder().bankRefCode("BNK_001").coreSettlementTxId("035404_TX_999").build());
        assertEquals(BatchSettlementStatus.PAID, paid.getStatus());
        assertEquals(ClearingStatus.SETTLED, tx.getStatus());
        verify(outboxService, times(1)).recordEvent(eq(TENANT_NATCASH), eq("CORE_035404_REPLENISH_REQUEST"), any(), isNull());
    }

    @Test
    @DisplayName("POOLED-05: NatcashWalletClient không trả true giả lập khi thiếu cấu hình baseUrl")
    void testNatcashWalletClient_NoFakeFallback() {
        NatcashWalletClient client = new NatcashWalletClient();
        assertFalse(client.verifyAndDeductWalletBalance("USER_1", new BigDecimal("100.00"), "TX_1"));
        assertFalse(client.refundWalletTransaction("TX_1", new BigDecimal("100.00"), "REF_1"));
    }
}
