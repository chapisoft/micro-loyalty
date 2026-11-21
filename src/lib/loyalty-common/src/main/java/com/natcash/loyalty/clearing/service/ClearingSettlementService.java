package com.natcash.loyalty.clearing.service;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.approval.dto.ApprovalDto.ApprovalItemResponse;
import com.natcash.loyalty.approval.dto.ApprovalDto.CreateApprovalRequest;
import com.natcash.loyalty.approval.service.ApprovalQueueService;
import com.natcash.loyalty.clearing.dto.ClearingDto.AutoBatchCreateRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.ClearingBreakdownItemDto;
import com.natcash.loyalty.clearing.dto.ClearingDto.DisputeItemDto;
import com.natcash.loyalty.clearing.dto.ClearingDto.PartnerClearingSummaryDto;
import com.natcash.loyalty.clearing.dto.ClearingDto.PartnerClearingTransactionDto;
import com.natcash.loyalty.clearing.dto.ClearingDto.PartnerTransactionsResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.PayBatchRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.ResolveDisputeRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.SponsorAttributionDto;
import com.natcash.loyalty.clearing.dto.ClearingDto.SponsorAttributionSummaryResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.ThreeWayReconcileItem;
import com.natcash.loyalty.clearing.dto.ClearingDto.ThreeWayReconcileRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.ThreeWayReconcileResponse;
import com.natcash.loyalty.clearing.entity.ClearingPaymentBatchEntity;
import com.natcash.loyalty.clearing.entity.ClearingTransactionBreakdownEntity;
import com.natcash.loyalty.clearing.entity.LoyaltyClearingDisputeEntity;
import com.natcash.loyalty.clearing.entity.LoyaltyClearinghouseSettlementEntity;
import com.natcash.loyalty.clearing.repository.ClearingPaymentBatchRepository;
import com.natcash.loyalty.clearing.repository.ClearingTransactionBreakdownRepository;
import com.natcash.loyalty.clearing.repository.LoyaltyClearingDisputeRepository;
import com.natcash.loyalty.clearing.repository.LoyaltyClearinghouseSettlementRepository;
import com.natcash.loyalty.codegeneration.domain.CodeType;
import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.ApprovalActionType;
import com.natcash.loyalty.domain.enums.ApprovalTargetType;
import com.natcash.loyalty.domain.enums.BatchDirection;
import com.natcash.loyalty.domain.enums.BatchSettlementStatus;
import com.natcash.loyalty.domain.enums.ClearingSourceType;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.DisputeStatus;
import com.natcash.loyalty.domain.enums.HoldStatus;
import com.natcash.loyalty.domain.enums.ReconciliationStatus;
import com.natcash.loyalty.domain.enums.SponsorType;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.outbox.service.OutboxService;
import com.natcash.loyalty.util.MessageUtils;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerDisputeRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerDisputeResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentConfirmRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerReconciliationRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerReconciliationResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerTxDetailDto;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyAcceptancePolicyEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyPaymentHoldEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyAcceptancePolicyRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyPaymentHoldRepository;
import com.natcash.loyalty.wallet.service.PartnerPaymentGatewayService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClearingSettlementService {

    private static final DateTimeFormatter PERIOD_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneOffset.UTC);

    private final ClearingTransactionRepository clearingRepository;
    private final LoyaltyPartnerRepository partnerRepository;
    private final LoyaltyClearingDisputeRepository disputeRepository;
    private final LoyaltyClearinghouseSettlementRepository settlementRepository;
    private final OutboxService outboxService;

    @Autowired(required = false)
    private ClearingPaymentBatchRepository paymentBatchRepository;

    @Autowired(required = false)
    private ClearingTransactionBreakdownRepository breakdownRepository;

    @Autowired(required = false)
    private LoyaltyPaymentHoldRepository holdRepository;

    @Autowired(required = false)
    private PartnerPaymentGatewayService paymentGatewayService;

    @Autowired(required = false)
    private ClearingBreakdownRecorderService breakdownRecorderService;

    @Autowired(required = false)
    private ApprovalQueueService approvalQueueService;

    @Autowired(required = false)
    private LoyaltyAcceptancePolicyRepository policyRepository;

    // =========================================================================
    // 1. TỔNG HỢP BÁO CÁO ĐỐI SOÁT BÙ TRỪ KỲ (CMS)
    // =========================================================================
    @Transactional(readOnly = true)
    public ReconciliationReportResponse getReconciliationReport(String tenantId, ReconciliationReportRequest request) {
        Instant from = request.getFromDate() != null ? request.getFromDate() : Instant.now().minus(30, ChronoUnit.DAYS);
        Instant to = request.getToDate() != null ? request.getToDate() : Instant.now();

        // 1. Tải toàn bộ đối tác của tenant để có thông tin định danh
        List<LoyaltyPartnerEntity> partners = partnerRepository.findByTenantId(tenantId);
        Map<Long, LoyaltyPartnerEntity> partnerMap = new LinkedHashMap<>();
        if (partners != null) {
            for (LoyaltyPartnerEntity p : partners) {
                if (p != null && p.getId() != null) {
                    partnerMap.put(p.getId(), p);
                }
            }
        }

        // 2. Tải toàn bộ giao dịch bù trừ trong khoảng thời gian
        List<ClearingTransactionEntity> txList = clearingRepository.findByTenantIdAndCreatedAtBetween(tenantId, from, to);
        if (request.getPartnerId() != null) {
            final Long targetPartnerId = request.getPartnerId();
            txList = txList.stream()
                    .filter(tx -> targetPartnerId.equals(tx.getRedeemerPartnerId()) || targetPartnerId.equals(tx.getIssuerPartnerId()))
                    .collect(Collectors.toList());
        }

        // 3. Khởi tạo bộ tích lũy 2 chiều theo từng đối tác
        Map<Long, PartnerAccumulator> accumulators = new LinkedHashMap<>();
        for (Map.Entry<Long, LoyaltyPartnerEntity> entry : partnerMap.entrySet()) {
            if (request.getPartnerId() == null || request.getPartnerId().equals(entry.getKey())) {
                accumulators.put(entry.getKey(), new PartnerAccumulator(entry.getValue()));
            }
        }

        BigDecimal grandTotalPointsIssued = BigDecimal.ZERO;
        BigDecimal grandTotalPointsRedeemed = BigDecimal.ZERO;
        BigDecimal grandTotalFiatPayable = BigDecimal.ZERO;
        BigDecimal grandTotalFiatReceivable = BigDecimal.ZERO;
        BigDecimal grandTotalCommission = BigDecimal.ZERO;

        for (ClearingTransactionEntity tx : txList) {
            BigDecimal points = tx.getPointsRedeemed() != null ? tx.getPointsRedeemed() : BigDecimal.ZERO;
            BigDecimal fiat = tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO;
            BigDecimal comm = tx.getCommissionAmount() != null ? tx.getCommissionAmount() : BigDecimal.ZERO;

            grandTotalCommission = grandTotalCommission.add(comm);

            Long issuerId = tx.getIssuerPartnerId();
            Long redeemerId = tx.getRedeemerPartnerId();

            // Chiều Phát Hành (Issuer) -> Nợ phải trả cho quỹ liên minh
            if (issuerId != null && (request.getPartnerId() == null || request.getPartnerId().equals(issuerId))) {
                PartnerAccumulator issuerAcc = accumulators.computeIfAbsent(issuerId, id -> {
                    LoyaltyPartnerEntity fallback = partnerRepository.findById(id).orElse(null);
                    return new PartnerAccumulator(fallback != null ? fallback : LoyaltyPartnerEntity.builder().id(id).partnerName(MessageUtils.getMessage("clearing.partner.fallback_name", id)).build());
                });
                issuerAcc.txCount++;
                issuerAcc.pointsIssued = issuerAcc.pointsIssued.add(points);
                issuerAcc.fiatPayable = issuerAcc.fiatPayable.add(fiat);
                grandTotalPointsIssued = grandTotalPointsIssued.add(points);
                grandTotalFiatPayable = grandTotalFiatPayable.add(fiat);
                if (tx.getStatus() == ClearingStatus.PENDING) {
                    issuerAcc.hasPending = true;
                }
            }

            // Chiều Thu Hồi (Redeemer) -> Quyền thu tiền từ quỹ liên minh
            if (redeemerId != null && (request.getPartnerId() == null || request.getPartnerId().equals(redeemerId))) {
                PartnerAccumulator redeemerAcc = accumulators.computeIfAbsent(redeemerId, id -> {
                    LoyaltyPartnerEntity fallback = partnerRepository.findById(id).orElse(null);
                    return new PartnerAccumulator(fallback != null ? fallback : LoyaltyPartnerEntity.builder().id(id).partnerName(MessageUtils.getMessage("clearing.partner.fallback_name", id)).build());
                });
                if (issuerId == null || !issuerId.equals(redeemerId)) {
                    redeemerAcc.txCount++;
                }
                redeemerAcc.pointsRedeemed = redeemerAcc.pointsRedeemed.add(points);
                redeemerAcc.fiatReceivable = redeemerAcc.fiatReceivable.add(fiat);
                redeemerAcc.commissionFee = redeemerAcc.commissionFee.add(comm);
                grandTotalPointsRedeemed = grandTotalPointsRedeemed.add(points);
                grandTotalFiatReceivable = grandTotalFiatReceivable.add(fiat);
                if (tx.getStatus() == ClearingStatus.PENDING) {
                    redeemerAcc.hasPending = true;
                }
            }
        }

        // 4. Chuyển đổi sang danh sách DTO tổng hợp
        List<PartnerClearingSummaryDto> summaries = new ArrayList<>();
        for (PartnerAccumulator acc : accumulators.values()) {
            BigDecimal netAmount = acc.fiatReceivable.subtract(acc.fiatPayable).subtract(acc.commissionFee);
            ClearingStatus status = acc.hasPending ? ClearingStatus.PENDING : (acc.txCount > 0 ? ClearingStatus.SETTLED : ClearingStatus.PENDING);

            summaries.add(PartnerClearingSummaryDto.builder()
                    .partnerId(acc.partner.getId())
                    .partnerCode(acc.partner.getPartnerCode() != null ? acc.partner.getPartnerCode() : "PARTNER_" + acc.partner.getId())
                    .partnerName(acc.partner.getPartnerName() != null ? acc.partner.getPartnerName() : MessageUtils.getMessage("clearing.partner.fallback_name", acc.partner.getId()))
                    .partnerType(acc.partner.getPartnerType() != null ? acc.partner.getPartnerType().name() : "RETAIL")
                    .totalTransactions(acc.txCount)
                    .totalPointsIssued(acc.pointsIssued)
                    .totalPointsRedeemed(acc.pointsRedeemed)
                    .totalFiatPayable(acc.fiatPayable)
                    .totalFiatReceivable(acc.fiatReceivable)
                    .totalCommissionFee(acc.commissionFee)
                    .netSettlementAmount(netAmount)
                    .status(status)
                    .build());
        }

        BigDecimal grandTotalNetSettlement = grandTotalFiatReceivable.subtract(grandTotalFiatPayable).subtract(grandTotalCommission);

        log.info("[CLEARING-RECONCILIATION-REPORT] tenantId={}, txCount={}, issued={}, redeemed={}, net={}",
                tenantId, txList.size(), grandTotalPointsIssued, grandTotalPointsRedeemed, grandTotalNetSettlement);

        return ReconciliationReportResponse.builder()
                .periodFrom(from)
                .periodTo(to)
                .grandTotalTransactions(txList.size())
                .grandTotalPointsIssued(grandTotalPointsIssued)
                .grandTotalPointsRedeemed(grandTotalPointsRedeemed)
                .grandTotalFiatPayable(grandTotalFiatPayable)
                .grandTotalFiatReceivable(grandTotalFiatReceivable)
                .grandTotalFiatAmount(grandTotalFiatReceivable)
                .grandTotalCommissionFee(grandTotalCommission)
                .grandTotalNetSettlement(grandTotalNetSettlement)
                .partnerSummaries(summaries)
                .generatedAt(Instant.now())
                .build();
    }

    // =========================================================================
    // 2. CHỐT KỲ QUYẾT TOÁN & BẮN WEBHOOK HẠCH TOÁN (CMS)
    // =========================================================================
    @Transactional
    public SettlePeriodResponse settlePeriod(String tenantId, SettlePeriodRequest request) {
        Instant from = request.getFromDate();
        Instant to = request.getToDate();
        String period = (from != null) ? PERIOD_FORMATTER.format(from) : PERIOD_FORMATTER.format(Instant.now());
        Instant now = Instant.now();

        // 1. Lấy danh sách các giao dịch PENDING trong kỳ (loại trừ các giao dịch DISPUTED hoặc chưa MATCHED nếu bật strictMatchedOnly)
        boolean strictMatchedOnly = Boolean.TRUE.equals(request.getStrictMatchedOnly());
        List<ClearingTransactionEntity> pendingTxs = clearingRepository.findByTenantIdAndCreatedAtBetween(tenantId, from, to)
                .stream()
                .filter(tx -> tx.getStatus() == ClearingStatus.PENDING)
                .filter(tx -> tx.getReconciliationStatus() != ReconciliationStatus.DISPUTED)
                .filter(tx -> !strictMatchedOnly || tx.getReconciliationStatus() == ReconciliationStatus.MATCHED)
                .collect(Collectors.toList());

        if (request.getPartnerId() != null) {
            final Long targetPartnerId = request.getPartnerId();
            pendingTxs = pendingTxs.stream()
                    .filter(tx -> targetPartnerId.equals(tx.getRedeemerPartnerId()) || targetPartnerId.equals(tx.getIssuerPartnerId()))
                    .collect(Collectors.toList());
        }

        String batchCode = CentralizedCodeGeneratorService.get().generateCode(
                CodeType.SETTLEMENT_BATCH,
                Map.of("period", period));

        BigDecimal totalSettled = BigDecimal.ZERO;
        BigDecimal totalVoucherDiscountSettled = BigDecimal.ZERO;
        BigDecimal totalCommission = BigDecimal.ZERO;
        BigDecimal totalNetPayout = BigDecimal.ZERO;
        Map<Long, PartnerPeriodAccumulator> partnerPeriodMap = new HashMap<>();

        for (ClearingTransactionEntity tx : pendingTxs) {
            tx.setStatus(ClearingStatus.SETTLED);
            tx.setReconciliationStatus(ReconciliationStatus.SETTLED);
            tx.setReconciliationBatchCode(batchCode);
            tx.setSettledAt(now);

            BigDecimal points = tx.getPointsRedeemed() != null ? tx.getPointsRedeemed() : BigDecimal.ZERO;
            BigDecimal fiat = tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO;
            BigDecimal vDiscount = tx.getVoucherDiscountAmount() != null ? tx.getVoucherDiscountAmount() : BigDecimal.ZERO;
            BigDecimal comm = tx.getCommissionAmount() != null ? tx.getCommissionAmount() : BigDecimal.ZERO;
            BigDecimal net = tx.getNetPayoutAmount() != null ? tx.getNetPayoutAmount() : fiat.subtract(comm);

            totalSettled = totalSettled.add(fiat);
            totalVoucherDiscountSettled = totalVoucherDiscountSettled.add(vDiscount);
            totalCommission = totalCommission.add(comm);
            totalNetPayout = totalNetPayout.add(net);

            // Tích lũy bên Issuer
            if (tx.getIssuerPartnerId() != null) {
                PartnerPeriodAccumulator acc = partnerPeriodMap.computeIfAbsent(tx.getIssuerPartnerId(), k -> new PartnerPeriodAccumulator());
                acc.pointsIssued = acc.pointsIssued.add(points);
                acc.fiatPayable = acc.fiatPayable.add(fiat);
            }

            // Tích lũy bên Redeemer
            if (tx.getRedeemerPartnerId() != null) {
                PartnerPeriodAccumulator acc = partnerPeriodMap.computeIfAbsent(tx.getRedeemerPartnerId(), k -> new PartnerPeriodAccumulator());
                acc.pointsRedeemed = acc.pointsRedeemed.add(points);
                acc.fiatReceivable = acc.fiatReceivable.add(fiat);
                acc.commissionFee = acc.commissionFee.add(comm);
            }
        }

        if (!pendingTxs.isEmpty()) {
            clearingRepository.saveAll(pendingTxs);
        }

        // 2. Lưu bản ghi chốt kỳ bất biến vào loyalty_clearinghouse_settlements
        for (Map.Entry<Long, PartnerPeriodAccumulator> entry : partnerPeriodMap.entrySet()) {
            Long partnerId = entry.getKey();
            PartnerPeriodAccumulator acc = entry.getValue();

            BigDecimal netPoints = acc.pointsRedeemed.subtract(acc.pointsIssued);
            BigDecimal netAmount = acc.fiatReceivable.subtract(acc.fiatPayable).subtract(acc.commissionFee);

            Optional<LoyaltyClearinghouseSettlementEntity> existing = settlementRepository
                    .findByTenantIdAndPartnerIdAndPeriod(tenantId, partnerId, period);

            LoyaltyClearinghouseSettlementEntity settlement;
            if (existing.isPresent()) {
                settlement = existing.get();
                settlement.setTotalPointsIssued(settlement.getTotalPointsIssued().add(acc.pointsIssued));
                settlement.setTotalPointsRedeemed(settlement.getTotalPointsRedeemed().add(acc.pointsRedeemed));
                settlement.setNetPoints(settlement.getNetPoints().add(netPoints));
                settlement.setNetSettlementAmount(settlement.getNetSettlementAmount().add(netAmount));
                settlement.setStatus(ClearingStatus.SETTLED);
                settlement.setSettledAt(now);
                settlement.setUpdatedAt(now);
            } else {
                settlement = LoyaltyClearinghouseSettlementEntity.builder()
                        .tenantId(tenantId)
                        .partnerId(partnerId)
                        .period(period)
                        .totalPointsIssued(acc.pointsIssued)
                        .totalPointsRedeemed(acc.pointsRedeemed)
                        .netPoints(netPoints)
                        .netSettlementAmount(netAmount)
                        .status(ClearingStatus.SETTLED)
                        .settledAt(now)
                        .createdAt(now)
                        .updatedAt(now)
                        .build();
            }
            settlementRepository.save(settlement);
        }

        // 3. Bắn Webhook sự kiện SETTLEMENT_BATCH_GENERATED cho các đối tác có cấu hình webhookUrl
        Map<Long, List<ClearingTransactionEntity>> partnerTxsMap = new HashMap<>();
        for (ClearingTransactionEntity tx : pendingTxs) {
            if (tx.getRedeemerPartnerId() != null) {
                partnerTxsMap.computeIfAbsent(tx.getRedeemerPartnerId(), k -> new ArrayList<>()).add(tx);
            }
        }

        for (Map.Entry<Long, List<ClearingTransactionEntity>> entry : partnerTxsMap.entrySet()) {
            BigDecimal partnerTotalSettled = BigDecimal.ZERO;
            BigDecimal partnerNetPayout = BigDecimal.ZERO;
            for (ClearingTransactionEntity tx : entry.getValue()) {
                if (tx.getFiatAmount() != null) {
                    partnerTotalSettled = partnerTotalSettled.add(tx.getFiatAmount());
                }
                if (tx.getNetPayoutAmount() != null) {
                    partnerNetPayout = partnerNetPayout.add(tx.getNetPayoutAmount());
                } else if (tx.getFiatAmount() != null) {
                    partnerNetPayout = partnerNetPayout.add(tx.getFiatAmount());
                }
            }
            final BigDecimal finalTotalSettled = partnerTotalSettled;
            final BigDecimal finalNetPayout = partnerNetPayout;

            partnerRepository.findById(entry.getKey()).ifPresent(partner -> {
                if (partner.getWebhookUrl() != null && !partner.getWebhookUrl().trim().isEmpty()) {
                    outboxService.recordEvent(tenantId, "SETTLEMENT_BATCH_GENERATED", Map.of(
                            "batchCode", batchCode,
                            "partnerCode", partner.getPartnerCode(),
                            "transactionCount", entry.getValue().size(),
                            "totalSettledAmount", finalTotalSettled,
                            "netPayoutAmount", finalNetPayout,
                            "settledAt", now.toString()
                    ), partner.getWebhookUrl());
                }
            });
        }

        List<SponsorAttributionDto> sponsorAttributions = aggregateSponsorAttributions(tenantId, pendingTxs);

        log.info("[CLEARING-SETTLE-PERIOD-SUCCESS] tenantId={}, period={}, batchCode={}, count={}, totalNetPayout={}",
                tenantId, period, batchCode, pendingTxs.size(), totalNetPayout);

        return SettlePeriodResponse.builder()
                .settlementBatchCode(batchCode)
                .period(period)
                .settledTransactionCount(pendingTxs.size())
                .totalSettledAmount(totalSettled)
                .totalVoucherDiscountSettled(totalVoucherDiscountSettled)
                .totalCommissionFee(totalCommission)
                .totalNetPayout(totalNetPayout)
                .status(ClearingStatus.SETTLED)
                .message(MessageUtils.getMessage("clearing.settle.success", period))
                .sponsorAttributions(sponsorAttributions)
                .settledAt(now)
                .build();
    }

    // =========================================================================
    // 3. CHI TIẾT GIAO DỊCH THÀNH PHẦN CỦA ĐỐI TÁC TRONG KỲ (DRILL-DOWN CMS)
    // =========================================================================
    @Transactional(readOnly = true)
    public PartnerTransactionsResponse getPartnerTransactions(String tenantId, Long partnerId, Instant from, Instant to) {
        LoyaltyPartnerEntity partner = partnerRepository.findById(partnerId).orElse(null);
        String partnerCode = partner != null ? partner.getPartnerCode() : "PARTNER_" + partnerId;
        String partnerName = partner != null ? partner.getPartnerName() : MessageUtils.getMessage("clearing.partner.fallback_name", partnerId);

        List<ClearingTransactionEntity> txs = clearingRepository.findByPartnerAndPeriod(tenantId, partnerId, from, to);

        BigDecimal totalPoints = BigDecimal.ZERO;
        BigDecimal totalFiat = BigDecimal.ZERO;
        List<PartnerClearingTransactionDto> dtos = new ArrayList<>();

        for (ClearingTransactionEntity tx : txs) {
            BigDecimal pts = tx.getPointsRedeemed() != null ? tx.getPointsRedeemed() : BigDecimal.ZERO;
            BigDecimal fiat = tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO;
            totalPoints = totalPoints.add(pts);
            totalFiat = totalFiat.add(fiat);

            String role = partnerId.equals(tx.getRedeemerPartnerId()) ? "REDEEMER" : "ISSUER";

            dtos.add(PartnerClearingTransactionDto.builder()
                    .id(tx.getId())
                    .transactionCode(tx.getTransactionCode())
                    .externalUserId(tx.getExternalUserId())
                    .pointsRedeemed(pts)
                    .fiatAmount(fiat)
                    .exchangeRate(tx.getExchangeRate())
                    .role(role)
                    .status(tx.getStatus())
                    .settledAt(tx.getSettledAt())
                    .createdAt(tx.getCreatedAt())
                    .build());
        }

        return PartnerTransactionsResponse.builder()
                .partnerId(partnerId)
                .partnerCode(partnerCode)
                .partnerName(partnerName)
                .totalTransactions(txs.size())
                .totalPoints(totalPoints)
                .totalFiat(totalFiat)
                .transactions(dtos)
                .build();
    }

    // =========================================================================
    // 4. ĐỐI SOÁT & TRA CỨU SAO KÊ DÀNH CHO ĐỐI TÁC (PARTNER B2B API)
    // =========================================================================
    @Transactional(readOnly = true)
    public PartnerReconciliationResponse getPartnerReconciliation(String tenantId, String partnerCode, PartnerReconciliationRequest request) {
        LoyaltyPartnerEntity partner = partnerRepository.findByTenantIdAndPartnerCode(tenantId, partnerCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.PARTNER_UNAUTHORIZED, MessageUtils.getMessage("clearing.partner.not_found")));

        Instant from = request.getFromDate() != null ? Instant.parse(request.getFromDate()) : Instant.now().minus(7, ChronoUnit.DAYS);
        Instant to = request.getToDate() != null ? Instant.parse(request.getToDate()) : Instant.now();

        List<ClearingTransactionEntity> txList = clearingRepository.findByTenantIdAndCreatedAtBetween(tenantId, from, to)
                .stream()
                .filter(tx -> partner.getId().equals(tx.getRedeemerPartnerId()))
                .collect(Collectors.toList());

        BigDecimal totalPoints = BigDecimal.ZERO;
        BigDecimal totalFiat = BigDecimal.ZERO;
        BigDecimal totalCommission = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;

        List<PartnerTxDetailDto> details = new ArrayList<>();
        for (ClearingTransactionEntity tx : txList) {
            BigDecimal pts = tx.getPointsRedeemed() != null ? tx.getPointsRedeemed() : BigDecimal.ZERO;
            BigDecimal fiat = tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO;
            BigDecimal comm = tx.getCommissionAmount() != null ? tx.getCommissionAmount() : BigDecimal.ZERO;
            BigDecimal net = tx.getNetPayoutAmount() != null ? tx.getNetPayoutAmount() : fiat.subtract(comm);

            totalPoints = totalPoints.add(pts);
            totalFiat = totalFiat.add(fiat);
            totalCommission = totalCommission.add(comm);
            totalNet = totalNet.add(net);

            details.add(PartnerTxDetailDto.builder()
                    .transactionCode(tx.getTransactionCode())
                    .partnerOrderId(tx.getPartnerOrderId())
                    .externalUserId(tx.getExternalUserId())
                    .pointsRedeemed(pts)
                    .fiatAmount(fiat)
                    .commissionAmount(comm)
                    .netPayoutAmount(net)
                    .status(tx.getStatus().name())
                    .createdAt(tx.getCreatedAt())
                    .build());
        }

        return PartnerReconciliationResponse.builder()
                .tenantId(tenantId)
                .partnerCode(partner.getPartnerCode())
                .partnerName(partner.getPartnerName())
                .period(from.toString() + " -> " + to.toString())
                .batchCode(request.getBatchCode() != null
                        ? request.getBatchCode()
                        : CentralizedCodeGeneratorService.get().generateCode(CodeType.RECON_BATCH))
                .totalTransactions(txList.size())
                .totalPointsBurned(totalPoints)
                .totalFiatAmount(totalFiat)
                .totalCommissionFee(totalCommission)
                .netSettlementAmount(totalNet)
                .status("RECONCILED")
                .transactionDetails(details)
                .build();
    }

    // =========================================================================
    // 5. TIẾP NHẬN TRANH CHẤP / SAI LỆCH ĐỐI SOÁT (PARTNER B2B API)
    // =========================================================================
    @Transactional
    public PartnerDisputeResponse createDispute(String tenantId, String partnerCode, PartnerDisputeRequest request) {
        LoyaltyPartnerEntity partner = partnerRepository.findByTenantIdAndPartnerCode(tenantId, partnerCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.PARTNER_UNAUTHORIZED, MessageUtils.getMessage("clearing.partner.not_found")));

        ClearingTransactionEntity clearingTx = null;
        if (request.getTransactionCode() != null && !request.getTransactionCode().trim().isEmpty()) {
            clearingTx = clearingRepository.findByTenantIdAndTransactionCode(tenantId, request.getTransactionCode().trim()).orElse(null);
        }

        String disputeCode = CentralizedCodeGeneratorService.get().generateCode(CodeType.CLEARING_DISPUTE);
        LoyaltyClearingDisputeEntity dispute = LoyaltyClearingDisputeEntity.builder()
                .tenantId(tenantId)
                .disputeCode(disputeCode)
                .batchCode(request.getBatchCode())
                .clearingTransaction(clearingTx)
                .partner(partner)
                .disputeType(request.getDisputeType())
                .partnerAmount(request.getPartnerAmount())
                .loyaltyAmount(clearingTx != null ? clearingTx.getFiatAmount() : (request.getLoyaltyAmount() != null ? request.getLoyaltyAmount() : BigDecimal.ZERO))
                .status(DisputeStatus.OPEN)
                .resolutionNote(request.getReason())
                .createdAt(Instant.now())
                .build();

        disputeRepository.save(dispute);

        log.info("[DISPUTE-CREATED] tenantId={}, partner={}, disputeCode={}, batchCode={}",
                tenantId, partnerCode, disputeCode, request.getBatchCode());

        return PartnerDisputeResponse.builder()
                .disputeCode(disputeCode)
                .batchCode(request.getBatchCode())
                .disputeType(request.getDisputeType())
                .status(DisputeStatus.OPEN.name())
                .message(MessageUtils.getMessage("clearing.dispute.created"))
                .createdAt(Instant.now())
                .build();
    }

    // =========================================================================
    // 6. QUẢN LÝ TRANH CHẤP TRÊN CMS
    // =========================================================================
    @Transactional(readOnly = true)
    public List<DisputeItemDto> getDisputes(String tenantId) {
        return disputeRepository.findByTenantId(tenantId).stream()
                .map(d -> DisputeItemDto.builder()
                        .id(d.getId())
                        .disputeCode(d.getDisputeCode())
                        .batchCode(d.getBatchCode())
                        .partnerId(d.getPartner().getId())
                        .partnerName(d.getPartner().getPartnerName())
                        .disputeType(d.getDisputeType())
                        .partnerAmount(d.getPartnerAmount())
                        .loyaltyAmount(d.getLoyaltyAmount())
                        .resolvedAmount(d.getResolvedAmount())
                        .status(d.getStatus().name())
                        .resolutionNote(d.getResolutionNote())
                        .createdAt(d.getCreatedAt())
                        .resolvedAt(d.getResolvedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public DisputeItemDto resolveDispute(String tenantId, String disputeCode, ResolveDisputeRequest request) {
        LoyaltyClearingDisputeEntity dispute = disputeRepository.findByTenantIdAndDisputeCode(tenantId, disputeCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, MessageUtils.getMessage("clearing.dispute.not_found")));

        DisputeStatus newStatus = DisputeStatus.fromCode(request.getStatus());
        if (newStatus == null) {
            newStatus = DisputeStatus.RESOLVED;
        }

        dispute.setStatus(newStatus);
        if (request.getResolvedAmount() != null) {
            dispute.setResolvedAmount(request.getResolvedAmount());
        }
        if (request.getNote() != null) {
            dispute.setResolutionNote(request.getNote());
        }
        dispute.setResolvedAt(Instant.now());
        disputeRepository.save(dispute);

        log.info("[DISPUTE-RESOLVED] tenantId={}, disputeCode={}, status={}", tenantId, disputeCode, newStatus);

        return DisputeItemDto.builder()
                .id(dispute.getId())
                .disputeCode(dispute.getDisputeCode())
                .batchCode(dispute.getBatchCode())
                .partnerId(dispute.getPartner().getId())
                .partnerName(dispute.getPartner().getPartnerName())
                .disputeType(dispute.getDisputeType())
                .partnerAmount(dispute.getPartnerAmount())
                .loyaltyAmount(dispute.getLoyaltyAmount())
                .resolvedAmount(dispute.getResolvedAmount())
                .status(dispute.getStatus().name())
                .resolutionNote(dispute.getResolutionNote())
                .createdAt(dispute.getCreatedAt())
                .resolvedAt(dispute.getResolvedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<ClearingPaymentBatchEntity> listPaymentBatches(String tenantId, Long partnerId) {
        if (paymentBatchRepository == null) {
            return Collections.emptyList();
        }
        return partnerId != null
                ? paymentBatchRepository.findByTenantIdAndPartnerIdOrderByCreatedAtDesc(tenantId, partnerId)
                : paymentBatchRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional
    public ClearingPaymentBatchEntity createPaymentBatch(
            String tenantId,
            Long partnerId,
            String period,
            BigDecimal grossAmount,
            BigDecimal discountAmount,
            BigDecimal mdrFeePercent,
            Integer txCount) {
        if (paymentBatchRepository == null) {
            throw new LoyaltyException(ErrorCode.SYSTEM_ERROR);
        }
        partnerRepository.findByIdAndTenantId(partnerId, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));

        BigDecimal gross = grossAmount != null ? grossAmount : BigDecimal.ZERO;
        BigDecimal discount = discountAmount != null ? discountAmount : BigDecimal.ZERO;
        BigDecimal feePct = mdrFeePercent != null
                ? mdrFeePercent
                : SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.SETTLEMENT_DEFAULT_MDR_FEE_PERCENT);

        BigDecimal mdrFee = gross.multiply(feePct)
                .divide(SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.PERCENT_DIVISOR),
                        2, RoundingMode.HALF_UP);
        BigDecimal netPayable = gross.subtract(discount).subtract(mdrFee).max(BigDecimal.ZERO);

        List<LoyaltyClearingDisputeEntity> openDisputes = disputeRepository
                .findByTenantIdAndPartner_Id(tenantId, partnerId)
                .stream()
                .filter(d -> d.getStatus() == DisputeStatus.OPEN || d.getStatus() == DisputeStatus.IN_REVIEW)
                .toList();
        List<String> knCodes = openDisputes.stream()
                .map(LoyaltyClearingDisputeEntity::getDisputeCode)
                .filter(code -> code != null && code.startsWith("KN-"))
                .toList();
        String excludedJson = knCodes.isEmpty()
                ? "[]"
                : "[" + knCodes.stream().map(c -> "\"" + c + "\"").collect(Collectors.joining(",")) + "]";

        String effectivePeriod = period != null && !period.isBlank()
                ? period.trim()
                : PERIOD_FORMATTER.format(Instant.now());
        String batchCode = CentralizedCodeGeneratorService.get().generateCode(
                CodeType.PAYMENT_BATCH,
                Map.of("period", effectivePeriod));

        ClearingPaymentBatchEntity batch = ClearingPaymentBatchEntity.builder()
                .tenantId(tenantId)
                .batchCode(batchCode)
                .partnerId(partnerId)
                .period(effectivePeriod)
                .grossAmount(gross)
                .discountAmount(discount)
                .mdrFeeAmount(mdrFee)
                .netPayableAmount(netPayable)
                .excludedDisputeCodes(excludedJson)
                .txCount(txCount != null ? txCount : 0)
                .confirmDeadlineAt(Instant.now().plus(
                        SystemParameterService.get().getInt(tenantId, SystemParamSpec.SETTLEMENT_CONFIRM_DEADLINE_DAYS),
                        ChronoUnit.DAYS))
                .status(BatchSettlementStatus.PENDING_CONFIRM)
                .build();
        return paymentBatchRepository.save(batch);
    }

    /**
     * Khởi tạo lô thanh toán tự động tổng hợp dữ liệu từ clearing_transactions và clearing_transaction_breakdowns
     * (loại trừ các giao dịch đang tranh chấp DISPUTED và tách riêng công nợ hoàn bù W_LOYALTY_POOL).
     */
    @Transactional
    public ClearingPaymentBatchEntity createAutoPaymentBatch(String tenantId, AutoBatchCreateRequest request) {
        if (paymentBatchRepository == null) {
            throw new LoyaltyException(ErrorCode.SYSTEM_ERROR);
        }
        if (request.getGrossAmount() != null && request.getTxCount() != null) {
            return createPaymentBatch(
                    tenantId,
                    request.getPartnerId(),
                    request.getPeriod(),
                    request.getGrossAmount(),
                    request.getDiscountAmount(),
                    request.getMdrFeePercent(),
                    request.getTxCount());
        }

        LoyaltyPartnerEntity partner = partnerRepository.findByIdAndTenantId(request.getPartnerId(), tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));

        Instant from = parseStartInstant(request.getPeriodFrom());
        Instant to = parseEndInstant(request.getPeriodTo());
        String effectivePeriod = (request.getPeriodFrom() != null && request.getPeriodTo() != null)
                ? request.getPeriodFrom().trim() + ".." + request.getPeriodTo().trim()
                : (request.getPeriod() != null && !request.getPeriod().isBlank()
                        ? request.getPeriod().trim()
                        : PERIOD_FORMATTER.format(Instant.now()));

        List<ClearingTransactionEntity> periodTxs = clearingRepository.findByTenantIdAndCreatedAtBetween(tenantId, from, to)
                .stream()
                .filter(tx -> tx.getStatus() == ClearingStatus.PENDING)
                .filter(tx -> tx.getReconciliationStatus() != ReconciliationStatus.DISPUTED)
                .filter(tx -> partner.getId().equals(tx.getRedeemerPartnerId())
                        || partner.getId().equals(tx.getIssuerPartnerId()))
                .toList();

        BigDecimal grossAmount = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal mdrFee = BigDecimal.ZERO;
        int count = 0;

        for (ClearingTransactionEntity tx : periodTxs) {
            if (partner.getId().equals(tx.getRedeemerPartnerId())) {
                count++;
                BigDecimal bill = tx.getBillAmount() != null && tx.getBillAmount().compareTo(BigDecimal.ZERO) > 0
                        ? tx.getBillAmount()
                        : (tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO);
                BigDecimal discount = tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO;
                grossAmount = grossAmount.add(bill);
                totalDiscount = totalDiscount.add(discount);
                if (tx.getCommissionAmount() != null) {
                    mdrFee = mdrFee.add(tx.getCommissionAmount());
                }
            }
        }

        if (mdrFee.compareTo(BigDecimal.ZERO) == 0 && totalDiscount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal feePct = request.getMdrFeePercent();
            if (feePct == null && policyRepository != null) {
                feePct = policyRepository.findByTenantIdAndPartnerId(tenantId, partner.getId())
                        .map(LoyaltyAcceptancePolicyEntity::getCommissionRatePercent)
                        .orElse(null);
            }
            if (feePct == null) {
                feePct = SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.SETTLEMENT_DEFAULT_MDR_FEE_PERCENT);
            }
            BigDecimal divisor = SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.PERCENT_DIVISOR);
            mdrFee = totalDiscount.multiply(feePct).divide(divisor, 2, RoundingMode.HALF_UP);
        }

        BigDecimal sponsorPayable = BigDecimal.ZERO;
        if (breakdownRepository != null && !periodTxs.isEmpty()) {
            List<Long> txIds = periodTxs.stream().map(ClearingTransactionEntity::getId).filter(id -> id != null).toList();
            if (!txIds.isEmpty()) {
                sponsorPayable = breakdownRepository.findByTenantIdAndClearingTxIdIn(tenantId, txIds).stream()
                        .filter(b -> !Boolean.TRUE.equals(b.getReverted()))
                        .filter(b -> partner.getId().equals(b.getFundingPartnerId()))
                        .map(b -> b.getPayableAmount() != null ? b.getPayableAmount() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }

        BatchDirection direction = request.getBatchDirection() != null
                ? request.getBatchDirection()
                : (sponsorPayable.compareTo(BigDecimal.ZERO) > 0 && count > 0
                        ? BatchDirection.NET_OFFSET
                        : (sponsorPayable.compareTo(BigDecimal.ZERO) > 0
                                ? BatchDirection.SPONSOR_REPLENISH
                                : BatchDirection.MERCHANT_SETTLEMENT));

        BigDecimal netPayable = totalDiscount.subtract(mdrFee).subtract(sponsorPayable);

        List<String> knCodes = disputeRepository.findByTenantIdAndPartner_Id(tenantId, partner.getId())
                .stream()
                .filter(d -> d.getStatus() == DisputeStatus.OPEN || d.getStatus() == DisputeStatus.IN_REVIEW)
                .map(LoyaltyClearingDisputeEntity::getDisputeCode)
                .filter(code -> code != null && !code.isBlank())
                .toList();
        String excludedJson = knCodes.isEmpty()
                ? "[]"
                : "[" + knCodes.stream().map(c -> "\"" + c + "\"").collect(Collectors.joining(",")) + "]";

        String batchCode = CentralizedCodeGeneratorService.get().generateCode(
                CodeType.PAYMENT_BATCH,
                Map.of("period", PERIOD_FORMATTER.format(Instant.now())));

        ClearingPaymentBatchEntity batch = ClearingPaymentBatchEntity.builder()
                .tenantId(tenantId)
                .batchCode(batchCode)
                .partnerId(partner.getId())
                .period(effectivePeriod)
                .grossAmount(grossAmount)
                .discountAmount(totalDiscount)
                .mdrFeeAmount(mdrFee)
                .sponsorPayableAmount(sponsorPayable)
                .netPayableAmount(netPayable)
                .batchDirection(direction)
                .excludedDisputeCodes(excludedJson)
                .txCount(count)
                .confirmDeadlineAt(Instant.now().plus(
                        SystemParameterService.get().getInt(tenantId, SystemParamSpec.SETTLEMENT_CONFIRM_DEADLINE_DAYS),
                        ChronoUnit.DAYS))
                .status(BatchSettlementStatus.PENDING_CONFIRM)
                .build();
        return paymentBatchRepository.save(batch);
    }

    // =========================================================================
    // 7. ĐỐI SOÁT 3 BÊN 1-1 TỪNG GIAO DỊCH (W_LOYALTY_POOL <-> KÊNH BÁN <-> LOYALTY)
    // =========================================================================
    @Transactional
    public ThreeWayReconcileResponse reconcileThreeWay(String tenantId, ThreeWayReconcileRequest request) {
        String batchCode = (request.getBatchCode() != null && !request.getBatchCode().isBlank())
                ? request.getBatchCode().trim()
                : CentralizedCodeGeneratorService.get().generateCode(CodeType.RECON_BATCH);

        List<ThreeWayReconcileItem> items = request.getItems() != null ? request.getItems() : Collections.emptyList();
        int matchedCount = 0;
        int autoConfirmedCount = 0;
        int autoRevertedCount = 0;
        int disputedCount = 0;
        int missingTxCount = 0;
        BigDecimal totalPoolDeducted = BigDecimal.ZERO;
        BigDecimal totalBreakdownMatched = BigDecimal.ZERO;
        List<String> createdDisputeCodes = new ArrayList<>();
        Instant now = Instant.now();

        for (ThreeWayReconcileItem item : items) {
            BigDecimal poolAmount = item.getPoolDeductedAmount() != null ? item.getPoolDeductedAmount() : BigDecimal.ZERO;
            totalPoolDeducted = totalPoolDeducted.add(poolAmount);

            ClearingTransactionEntity clearing = resolveClearingTxForReconcile(tenantId, item);
            boolean coreReverted = "REVERTED".equalsIgnoreCase(item.getCoreStatus());

            if (coreReverted) {
                if (clearing != null && clearing.getStatus() != ClearingStatus.CANCELLED && clearing.getStatus() != ClearingStatus.REFUNDED) {
                    clearing.setStatus(ClearingStatus.CANCELLED);
                    clearing.setReconciliationStatus(ReconciliationStatus.MATCHED);
                    clearing.setCoreTxId(item.getCoreTxId());
                    clearing.setCorePoolDeductedAmount(BigDecimal.ZERO);
                    clearing.setReconciliationBatchCode(batchCode);
                    clearing.setReconciledAt(now);
                    clearingRepository.save(clearing);
                    if (breakdownRecorderService != null) {
                        breakdownRecorderService.revertBreakdownsAndAssets(clearing, null);
                    }
                    autoRevertedCount++;
                } else if (holdRepository != null && item.getHoldCode() != null) {
                    holdRepository.findByTenantIdAndHoldCode(tenantId, item.getHoldCode()).ifPresent(hold -> {
                        if (hold.getStatus() == HoldStatus.HELD) {
                            hold.setStatus(HoldStatus.CANCELLED);
                            holdRepository.save(hold);
                        }
                    });
                    autoRevertedCount++;
                }
                continue;
            }

            // Kịch bản Saga dở dang: Core đã trừ W_LOYALTY_POOL nhưng hold ở Loyalty chưa Confirm
            if (clearing == null && holdRepository != null && item.getHoldCode() != null && paymentGatewayService != null) {
                Optional<LoyaltyPaymentHoldEntity> holdOpt = holdRepository.findByTenantIdAndHoldCode(tenantId, item.getHoldCode());
                if (holdOpt.isPresent() && holdOpt.get().getStatus() == HoldStatus.HELD) {
                    LoyaltyPaymentHoldEntity hold = holdOpt.get();
                    String txCode = (item.getTransactionCode() != null && !item.getTransactionCode().isBlank())
                            ? item.getTransactionCode()
                            : (item.getCoreTxId() != null ? item.getCoreTxId() : "RECON_" + hold.getHoldCode());
                    try {
                        paymentGatewayService.confirm(tenantId, hold.getPartner().getPartnerCode(),
                                PartnerPaymentConfirmRequest.builder()
                                        .holdCode(hold.getHoldCode())
                                        .transactionCode(txCode)
                                        .partnerOrderId(item.getPartnerOrderId() != null ? item.getPartnerOrderId() : hold.getPartnerOrderId())
                                        .build());
                        clearing = clearingRepository.findByTenantIdAndHoldCode(tenantId, hold.getHoldCode()).orElse(null);
                        autoConfirmedCount++;
                    } catch (Exception ex) {
                        log.warn("[RECON-AUTO-CONFIRM-FAILED] holdCode={}, reason={}", hold.getHoldCode(), ex.getMessage());
                    }
                }
            }

            // Kịch bản thiếu giao dịch (MISSING_TX)
            if (clearing == null) {
                LoyaltyPartnerEntity partner = resolveDefaultPartnerForDispute(tenantId);
                if (partner != null) {
                    String disputeCode = createReconcileDispute(
                            tenantId, partner, batchCode, null, "MISSING_TX",
                            poolAmount, BigDecimal.ZERO,
                            "Core W_LOYALTY_POOL deducted " + poolAmount + " (coreTx=" + item.getCoreTxId() + ") missing in Loyalty");
                    createdDisputeCodes.add(disputeCode);
                }
                missingTxCount++;
                disputedCount++;
                continue;
            }

            // Kịch bản trùng lặp Core Tx trên cùng holdCode / clearing
            if (clearing.getCoreTxId() != null && item.getCoreTxId() != null
                    && !clearing.getCoreTxId().equals(item.getCoreTxId())) {
                clearing.setReconciliationStatus(ReconciliationStatus.DISPUTED);
                clearing.setDisputeReason("DUPLICATE_TX: CoreTx " + item.getCoreTxId() + " vs " + clearing.getCoreTxId());
                clearingRepository.save(clearing);
                LoyaltyPartnerEntity partner = partnerRepository.findById(clearing.getRedeemerPartnerId()).orElse(null);
                if (partner != null) {
                    createdDisputeCodes.add(createReconcileDispute(
                            tenantId, partner, batchCode, clearing, "DUPLICATE_TX",
                            poolAmount, clearing.getFiatAmount(), clearing.getDisputeReason()));
                }
                disputedCount++;
                continue;
            }

            // Kiểm tra khớp số tiền trích Pool (F4 - F5) với tổng giảm trừ Loyalty
            BigDecimal loyaltyAmount = clearing.getFiatAmount() != null ? clearing.getFiatAmount() : BigDecimal.ZERO;
            BigDecimal breakdownTotal = resolveTxBreakdownTotal(tenantId, clearing, loyaltyAmount);

            if (poolAmount.subtract(loyaltyAmount).abs().compareTo(new BigDecimal("0.01")) > 0
                    || breakdownTotal.subtract(loyaltyAmount).abs().compareTo(new BigDecimal("0.01")) > 0) {
                clearing.setReconciliationStatus(ReconciliationStatus.DISPUTED);
                clearing.setCoreTxId(item.getCoreTxId());
                clearing.setCorePoolDeductedAmount(poolAmount);
                clearing.setDisputeReason("AMOUNT_MISMATCH: pool=" + poolAmount + ", loyalty=" + loyaltyAmount + ", breakdown=" + breakdownTotal);
                clearingRepository.save(clearing);
                LoyaltyPartnerEntity partner = partnerRepository.findById(clearing.getRedeemerPartnerId()).orElse(null);
                if (partner != null) {
                    createdDisputeCodes.add(createReconcileDispute(
                            tenantId, partner, batchCode, clearing, "AMOUNT_MISMATCH",
                            poolAmount, loyaltyAmount, clearing.getDisputeReason()));
                }
                disputedCount++;
                continue;
            }

            clearing.setReconciliationStatus(ReconciliationStatus.MATCHED);
            clearing.setCoreTxId(item.getCoreTxId());
            clearing.setCorePoolDeductedAmount(poolAmount);
            clearing.setReconciliationBatchCode(batchCode);
            clearing.setReconciledAt(now);
            clearingRepository.save(clearing);
            matchedCount++;
            totalBreakdownMatched = totalBreakdownMatched.add(breakdownTotal);
        }

        return ThreeWayReconcileResponse.builder()
                .batchCode(batchCode)
                .totalChecked(items.size())
                .matchedCount(matchedCount)
                .autoConfirmedCount(autoConfirmedCount)
                .autoRevertedCount(autoRevertedCount)
                .disputedCount(disputedCount)
                .missingTxCount(missingTxCount)
                .totalPoolDeductedAmount(totalPoolDeducted)
                .totalBreakdownMatchedAmount(totalBreakdownMatched)
                .disputeCodes(createdDisputeCodes)
                .reconciledAt(now)
                .build();
    }

    // =========================================================================
    // 8. BÓC TÁCH THEO ĐƠN VỊ TÀI TRỢ & HOÀN TẤT THANH TOÁN BÙ TRỪ (035404)
    // =========================================================================
    @Transactional(readOnly = true)
    public SponsorAttributionSummaryResponse getSponsorAttributionSummary(String tenantId, Instant from, Instant to) {
        Instant effectiveFrom = from != null ? from : Instant.now().minus(30, ChronoUnit.DAYS);
        Instant effectiveTo = to != null ? to : Instant.now();

        List<ClearingTransactionEntity> txs = clearingRepository.findByTenantIdAndCreatedAtBetween(tenantId, effectiveFrom, effectiveTo)
                .stream()
                .filter(tx -> tx.getStatus() != ClearingStatus.CANCELLED && tx.getStatus() != ClearingStatus.REFUNDED)
                .filter(tx -> tx.getReconciliationStatus() != ReconciliationStatus.DISPUTED)
                .toList();

        List<SponsorAttributionDto> items = aggregateSponsorAttributions(tenantId, txs);
        BigDecimal natcashTotal = items.stream()
                .filter(i -> i.getSponsorType() == SponsorType.NATCASH)
                .map(SponsorAttributionDto::getTotalPayableToPool)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal partnerTotal = items.stream()
                .filter(i -> i.getSponsorType() != SponsorType.NATCASH)
                .map(SponsorAttributionDto::getTotalPayableToPool)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return SponsorAttributionSummaryResponse.builder()
                .periodFrom(effectiveFrom)
                .periodTo(effectiveTo)
                .totalPoolReplenishRequired(natcashTotal.add(partnerTotal))
                .natcashBudgetAmount(natcashTotal)
                .partnerReceivableAmount(partnerTotal)
                .items(items)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ClearingBreakdownItemDto> listBreakdowns(
            String tenantId, Instant from, Instant to, Long fundingPartnerId, String transactionCode) {
        if (breakdownRepository == null) {
            return Collections.emptyList();
        }
        List<ClearingTransactionBreakdownEntity> rows;
        Map<Long, ClearingTransactionEntity> txMap = new HashMap<>();
        if (transactionCode != null && !transactionCode.isBlank()) {
            clearingRepository.findByTenantIdAndTransactionCode(tenantId, transactionCode.trim())
                    .ifPresent(tx -> txMap.put(tx.getId(), tx));
            rows = breakdownRepository.findByTenantIdAndTransactionCodeOrderByIdAsc(tenantId, transactionCode.trim());
        } else {
            Instant effectiveFrom = from != null ? from : Instant.now().minus(30, ChronoUnit.DAYS);
            Instant effectiveTo = to != null ? to : Instant.now();
            List<ClearingTransactionEntity> txs = clearingRepository.findByTenantIdAndCreatedAtBetween(tenantId, effectiveFrom, effectiveTo);
            for (ClearingTransactionEntity tx : txs) {
                txMap.put(tx.getId(), tx);
            }
            List<Long> txIds = new ArrayList<>(txMap.keySet());
            rows = txIds.isEmpty() ? Collections.emptyList() : breakdownRepository.findByTenantIdAndClearingTxIdIn(tenantId, txIds);
        }

        Map<Long, LoyaltyPartnerEntity> partnerMap = new HashMap<>();
        partnerRepository.findByTenantId(tenantId).forEach(p -> partnerMap.put(p.getId(), p));

        return rows.stream()
                .filter(r -> fundingPartnerId == null || fundingPartnerId.equals(r.getFundingPartnerId()))
                .map(r -> {
                    ClearingTransactionEntity parent = txMap.get(r.getClearingTxId());
                    LoyaltyPartnerEntity partner = r.getFundingPartnerId() != null ? partnerMap.get(r.getFundingPartnerId()) : null;
                    return ClearingBreakdownItemDto.builder()
                            .id(r.getId())
                            .clearingTxId(r.getClearingTxId())
                            .transactionCode(r.getTransactionCode())
                            .holdCode(r.getHoldCode())
                            .sourceType(r.getSourceType())
                            .sourceRef(r.getSourceRef())
                            .bucketId(r.getBucketId())
                            .redemptionId(r.getRedemptionId())
                            .sponsorType(r.getSponsorType())
                            .fundingPartnerId(r.getFundingPartnerId())
                            .fundingPartnerCode(partner != null ? partner.getPartnerCode() : (r.getSponsorType() == SponsorType.NATCASH ? "NATCASH_BUDGET" : null))
                            .fundingPartnerName(partner != null ? partner.getPartnerName() : (r.getSponsorType() == SponsorType.NATCASH ? "Ngân sách Natcash" : null))
                            .shareRatio(r.getShareRatio())
                            .pointsConsumed(r.getPointsConsumed())
                            .exchangeRate(r.getExchangeRate())
                            .payableAmount(r.getPayableAmount())
                            .reverted(r.getReverted())
                            .reconciliationStatus(parent != null ? parent.getReconciliationStatus() : ReconciliationStatus.UNMATCHED)
                            .coreTxId(parent != null ? parent.getCoreTxId() : null)
                            .createdAt(r.getCreatedAt())
                            .build();
                })
                .toList();
    }

    @Transactional
    public ClearingPaymentBatchEntity submitBatchForApproval(String tenantId, String batchCode, String makerUsername) {
        if (paymentBatchRepository == null) {
            throw new LoyaltyException(ErrorCode.SYSTEM_ERROR);
        }
        ClearingPaymentBatchEntity batch = paymentBatchRepository.findByTenantIdAndBatchCode(tenantId, batchCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));

        if (approvalQueueService != null && batch.getApprovalRequestId() == null) {
            ApprovalItemResponse created = approvalQueueService.submitRequest(tenantId, CreateApprovalRequest.builder()
                    .targetType(ApprovalTargetType.PAYMENT_BATCH)
                    .targetId(String.valueOf(batch.getId()))
                    .actionType(ApprovalActionType.ADJUST)
                    .title("Quyết toán lô bù trừ " + batch.getBatchCode())
                    .payloadAfter(Map.of(
                            "batchId", batch.getId(),
                            "batchCode", batch.getBatchCode(),
                            "partnerId", batch.getPartnerId(),
                            "netPayableAmount", batch.getNetPayableAmount(),
                            "sponsorPayableAmount", batch.getSponsorPayableAmount(),
                            "batchDirection", batch.getBatchDirection() != null ? batch.getBatchDirection().name() : BatchDirection.MERCHANT_SETTLEMENT.name()
                    ))
                    .makerUsername(makerUsername)
                    .reason("Trình duyệt quyết toán lô đối soát " + batch.getBatchCode())
                    .build());
            batch.setApprovalRequestId(created.getId());
            return paymentBatchRepository.save(batch);
        }
        return batch;
    }

    @Transactional
    public ClearingPaymentBatchEntity confirmPaymentBatch(String tenantId, String batchCode, String actor) {
        if (paymentBatchRepository == null) {
            throw new LoyaltyException(ErrorCode.SYSTEM_ERROR);
        }
        ClearingPaymentBatchEntity batch = paymentBatchRepository.findByTenantIdAndBatchCode(tenantId, batchCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        batch.setStatus(BatchSettlementStatus.CONFIRMED);
        batch.setConfirmedAt(Instant.now());
        batch.setConfirmedBy(actor != null && !actor.isBlank() ? actor : "cms_admin");
        return paymentBatchRepository.save(batch);
    }

    @Transactional
    public ClearingPaymentBatchEntity payPaymentBatch(String tenantId, String batchCode, PayBatchRequest request) {
        if (paymentBatchRepository == null) {
            throw new LoyaltyException(ErrorCode.SYSTEM_ERROR);
        }
        ClearingPaymentBatchEntity batch = paymentBatchRepository.findByTenantIdAndBatchCode(tenantId, batchCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));

        if (batch.getStatus() == BatchSettlementStatus.PAID) {
            return batch;
        }
        Instant now = Instant.now();
        if (batch.getConfirmedAt() == null) {
            batch.setConfirmedAt(now);
            batch.setConfirmedBy(request != null && request.getPaidBy() != null ? request.getPaidBy() : "cms_finance");
        }
        if (request != null) {
            if (request.getBankRefCode() != null && !request.getBankRefCode().isBlank()) {
                batch.setBankRefCode(request.getBankRefCode().trim());
            }
            if (request.getCoreSettlementTxId() != null && !request.getCoreSettlementTxId().isBlank()) {
                batch.setCoreSettlementTxId(request.getCoreSettlementTxId().trim());
            }
        }
        batch.setPaidAt(now);
        batch.setStatus(BatchSettlementStatus.PAID);
        ClearingPaymentBatchEntity saved = paymentBatchRepository.save(batch);

        // Chốt toàn bộ giao dịch sạch thuộc đối tác trong kỳ về trạng thái bất biến SETTLED
        if (batch.getPartnerId() != null) {
            List<ClearingTransactionEntity> toSettle = clearingRepository
                    .findByTenantIdAndStatus(tenantId, ClearingStatus.PENDING)
                    .stream()
                    .filter(tx -> tx.getReconciliationStatus() != ReconciliationStatus.DISPUTED)
                    .filter(tx -> batch.getPartnerId().equals(tx.getRedeemerPartnerId())
                            || batch.getPartnerId().equals(tx.getIssuerPartnerId()))
                    .peek(tx -> {
                        tx.setStatus(ClearingStatus.SETTLED);
                        tx.setReconciliationStatus(ReconciliationStatus.SETTLED);
                        tx.setReconciliationBatchCode(batch.getBatchCode());
                        tx.setSettledAt(now);
                    })
                    .toList();
            if (!toSettle.isEmpty()) {
                clearingRepository.saveAll(toSettle);
            }
        }

        // Bắn Outbox kích hoạt lệnh 035404 bơm bù W_LOYALTY_POOL nếu có phần hoàn bù tài trợ
        if (outboxService != null && (batch.getBatchDirection() == BatchDirection.SPONSOR_REPLENISH
                || batch.getBatchDirection() == BatchDirection.NET_OFFSET
                || (batch.getSponsorPayableAmount() != null && batch.getSponsorPayableAmount().compareTo(BigDecimal.ZERO) > 0))) {
            outboxService.recordEvent(tenantId, "CORE_035404_REPLENISH_REQUEST", Map.of(
                    "batchCode", batch.getBatchCode(),
                    "partnerId", batch.getPartnerId(),
                    "sponsorPayableAmount", batch.getSponsorPayableAmount(),
                    "netPayableAmount", batch.getNetPayableAmount(),
                    "coreSettlementTxId", batch.getCoreSettlementTxId() != null ? batch.getCoreSettlementTxId() : "",
                    "paidAt", now.toString()
            ), null);
        }
        return saved;
    }

    private List<SponsorAttributionDto> aggregateSponsorAttributions(String tenantId, List<ClearingTransactionEntity> txs) {
        if (txs == null || txs.isEmpty()) {
            return Collections.emptyList();
        }
        Map<Long, LoyaltyPartnerEntity> partnerMap = new HashMap<>();
        partnerRepository.findByTenantId(tenantId).forEach(p -> partnerMap.put(p.getId(), p));

        Map<String, SponsorAccumulator> grouped = new LinkedHashMap<>();
        List<Long> txIds = txs.stream().map(ClearingTransactionEntity::getId).filter(id -> id != null).toList();
        List<ClearingTransactionBreakdownEntity> breakdowns = (breakdownRepository != null && !txIds.isEmpty())
                ? breakdownRepository.findByTenantIdAndClearingTxIdIn(tenantId, txIds)
                : Collections.emptyList();

        if (!breakdowns.isEmpty()) {
            for (ClearingTransactionBreakdownEntity b : breakdowns) {
                if (Boolean.TRUE.equals(b.getReverted())) {
                    continue;
                }
                SponsorType sType = b.getSponsorType() != null
                        ? b.getSponsorType()
                        : (b.getFundingPartnerId() != null ? SponsorType.PARTNER : SponsorType.NATCASH);
                Long fPartnerId = b.getFundingPartnerId();
                String groupKey = sType.name() + "::" + (fPartnerId != null ? fPartnerId : "NATCASH");
                SponsorAccumulator acc = grouped.computeIfAbsent(groupKey, k -> new SponsorAccumulator(fPartnerId, sType));
                BigDecimal amount = b.getPayableAmount() != null ? b.getPayableAmount() : BigDecimal.ZERO;
                if (b.getSourceType() == ClearingSourceType.VOUCHER) {
                    acc.voucherAmount = acc.voucherAmount.add(amount);
                } else {
                    acc.coinAmount = acc.coinAmount.add(amount);
                }
                acc.txCodes.add(b.getTransactionCode());
            }
        } else {
            for (ClearingTransactionEntity tx : txs) {
                Long fPartnerId = tx.getIssuerPartnerId();
                SponsorType sType = fPartnerId != null ? SponsorType.PARTNER : SponsorType.NATCASH;
                String groupKey = sType.name() + "::" + (fPartnerId != null ? fPartnerId : "NATCASH");
                SponsorAccumulator acc = grouped.computeIfAbsent(groupKey, k -> new SponsorAccumulator(fPartnerId, sType));
                BigDecimal pointAmt = tx.getPointDiscountAmount() != null && tx.getPointDiscountAmount().compareTo(BigDecimal.ZERO) > 0
                        ? tx.getPointDiscountAmount()
                        : (tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO);
                BigDecimal voucherAmt = tx.getVoucherDiscountAmount() != null ? tx.getVoucherDiscountAmount() : BigDecimal.ZERO;
                acc.coinAmount = acc.coinAmount.add(pointAmt);
                acc.voucherAmount = acc.voucherAmount.add(voucherAmt);
                if (tx.getTransactionCode() != null) {
                    acc.txCodes.add(tx.getTransactionCode());
                }
            }
        }

        List<SponsorAttributionDto> result = new ArrayList<>();
        for (SponsorAccumulator acc : grouped.values()) {
            LoyaltyPartnerEntity partner = acc.fundingPartnerId != null ? partnerMap.get(acc.fundingPartnerId) : null;
            boolean isNatcash = acc.sponsorType == SponsorType.NATCASH && acc.fundingPartnerId == null;
            BigDecimal total = acc.voucherAmount.add(acc.coinAmount);
            result.add(SponsorAttributionDto.builder()
                    .fundingPartnerId(acc.fundingPartnerId)
                    .partnerCode(isNatcash ? "NATCASH_BUDGET" : (partner != null ? partner.getPartnerCode() : "PARTNER_" + acc.fundingPartnerId))
                    .partnerName(isNatcash ? "Ngân sách Khuyến mãi Natcash" : (partner != null ? partner.getPartnerName() : "Partner #" + acc.fundingPartnerId))
                    .sponsorType(acc.sponsorType)
                    .voucherAmount(acc.voucherAmount)
                    .coinAmount(acc.coinAmount)
                    .totalPayableToPool(total)
                    .txCount(acc.txCodes.size())
                    .replenishChannel(isNatcash ? "CORE_035404" : "PARTNER_RECEIVABLE")
                    .build());
        }
        return result;
    }

    private ClearingTransactionEntity resolveClearingTxForReconcile(String tenantId, ThreeWayReconcileItem item) {
        if (item.getHoldCode() != null && !item.getHoldCode().isBlank()) {
            Optional<ClearingTransactionEntity> byHold = clearingRepository.findByTenantIdAndHoldCode(tenantId, item.getHoldCode().trim());
            if (byHold.isPresent()) {
                return byHold.get();
            }
        }
        if (item.getTransactionCode() != null && !item.getTransactionCode().isBlank()) {
            Optional<ClearingTransactionEntity> byTx = clearingRepository.findByTenantIdAndTransactionCode(tenantId, item.getTransactionCode().trim());
            if (byTx.isPresent()) {
                return byTx.get();
            }
        }
        if (item.getPartnerOrderId() != null && !item.getPartnerOrderId().isBlank()) {
            return clearingRepository.findByTenantIdAndPartnerOrderId(tenantId, item.getPartnerOrderId().trim()).orElse(null);
        }
        return null;
    }

    private BigDecimal resolveTxBreakdownTotal(String tenantId, ClearingTransactionEntity clearing, BigDecimal fallbackAmount) {
        if (breakdownRepository == null || clearing.getId() == null) {
            return fallbackAmount;
        }
        List<ClearingTransactionBreakdownEntity> rows = breakdownRepository
                .findByTenantIdAndClearingTxIdOrderByIdAsc(tenantId, clearing.getId());
        if (rows == null || rows.isEmpty()) {
            return fallbackAmount;
        }
        return rows.stream()
                .filter(r -> !Boolean.TRUE.equals(r.getReverted()))
                .map(r -> r.getPayableAmount() != null ? r.getPayableAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String createReconcileDispute(
            String tenantId,
            LoyaltyPartnerEntity partner,
            String batchCode,
            ClearingTransactionEntity clearing,
            String disputeType,
            BigDecimal partnerAmount,
            BigDecimal loyaltyAmount,
            String reason) {
        String disputeCode = CentralizedCodeGeneratorService.get().generateCode(CodeType.CLEARING_DISPUTE);
        LoyaltyClearingDisputeEntity dispute = LoyaltyClearingDisputeEntity.builder()
                .tenantId(tenantId)
                .disputeCode(disputeCode)
                .batchCode(batchCode)
                .clearingTransaction(clearing)
                .partner(partner)
                .disputeType(disputeType)
                .partnerAmount(partnerAmount)
                .loyaltyAmount(loyaltyAmount)
                .status(DisputeStatus.OPEN)
                .resolutionNote(reason)
                .createdAt(Instant.now())
                .build();
        disputeRepository.save(dispute);
        return disputeCode;
    }

    private LoyaltyPartnerEntity resolveDefaultPartnerForDispute(String tenantId) {
        List<LoyaltyPartnerEntity> list = partnerRepository.findByTenantId(tenantId);
        return (list != null && !list.isEmpty()) ? list.get(0) : null;
    }

    private Instant parseStartInstant(String periodFrom) {
        if (periodFrom == null || periodFrom.isBlank()) {
            return Instant.now().minus(30, ChronoUnit.DAYS);
        }
        String trimmed = periodFrom.trim();
        if (trimmed.length() == 10) {
            return LocalDate.parse(trimmed).atStartOfDay(ZoneOffset.UTC).toInstant();
        }
        return Instant.parse(trimmed);
    }

    private Instant parseEndInstant(String periodTo) {
        if (periodTo == null || periodTo.isBlank()) {
            return Instant.now();
        }
        String trimmed = periodTo.trim();
        if (trimmed.length() == 10) {
            return LocalDate.parse(trimmed).plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusMillis(1);
        }
        return Instant.parse(trimmed);
    }

    private static class SponsorAccumulator {
        final Long fundingPartnerId;
        final SponsorType sponsorType;
        BigDecimal voucherAmount = BigDecimal.ZERO;
        BigDecimal coinAmount = BigDecimal.ZERO;
        final java.util.Set<String> txCodes = new java.util.HashSet<>();

        SponsorAccumulator(Long fundingPartnerId, SponsorType sponsorType) {
            this.fundingPartnerId = fundingPartnerId;
            this.sponsorType = sponsorType;
        }
    }

    private static class PartnerAccumulator {
        final LoyaltyPartnerEntity partner;
        long txCount = 0;
        BigDecimal pointsIssued = BigDecimal.ZERO;
        BigDecimal pointsRedeemed = BigDecimal.ZERO;
        BigDecimal fiatPayable = BigDecimal.ZERO;
        BigDecimal fiatReceivable = BigDecimal.ZERO;
        BigDecimal commissionFee = BigDecimal.ZERO;
        boolean hasPending = false;

        PartnerAccumulator(LoyaltyPartnerEntity partner) {
            this.partner = partner;
        }
    }

    private static class PartnerPeriodAccumulator {
        BigDecimal pointsIssued = BigDecimal.ZERO;
        BigDecimal pointsRedeemed = BigDecimal.ZERO;
        BigDecimal fiatPayable = BigDecimal.ZERO;
        BigDecimal fiatReceivable = BigDecimal.ZERO;
        BigDecimal commissionFee = BigDecimal.ZERO;
    }
}
