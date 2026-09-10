package com.natcash.loyalty.clearing.service;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.clearing.dto.ClearingDto.DisputeItemDto;
import com.natcash.loyalty.clearing.dto.ClearingDto.PartnerClearingSummaryDto;
import com.natcash.loyalty.clearing.dto.ClearingDto.PartnerClearingTransactionDto;
import com.natcash.loyalty.clearing.dto.ClearingDto.PartnerTransactionsResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.ResolveDisputeRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodResponse;
import com.natcash.loyalty.clearing.entity.LoyaltyClearingDisputeEntity;
import com.natcash.loyalty.clearing.entity.LoyaltyClearinghouseSettlementEntity;
import com.natcash.loyalty.clearing.repository.LoyaltyClearingDisputeRepository;
import com.natcash.loyalty.clearing.repository.LoyaltyClearinghouseSettlementRepository;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.DisputeStatus;
import com.natcash.loyalty.domain.enums.ReconciliationStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.outbox.service.OutboxService;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerDisputeRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerDisputeResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerReconciliationRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerReconciliationResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerTxDetailDto;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
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
                    return new PartnerAccumulator(fallback != null ? fallback : LoyaltyPartnerEntity.builder().id(id).partnerName("Đối tác #" + id).build());
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
                    return new PartnerAccumulator(fallback != null ? fallback : LoyaltyPartnerEntity.builder().id(id).partnerName("Đối tác #" + id).build());
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
                    .partnerName(acc.partner.getPartnerName() != null ? acc.partner.getPartnerName() : "Đối tác #" + acc.partner.getId())
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

        // 1. Lấy danh sách các giao dịch PENDING trong kỳ
        List<ClearingTransactionEntity> pendingTxs = clearingRepository.findByTenantIdAndCreatedAtBetween(tenantId, from, to)
                .stream()
                .filter(tx -> tx.getStatus() == ClearingStatus.PENDING)
                .collect(Collectors.toList());

        if (request.getPartnerId() != null) {
            final Long targetPartnerId = request.getPartnerId();
            pendingTxs = pendingTxs.stream()
                    .filter(tx -> targetPartnerId.equals(tx.getRedeemerPartnerId()) || targetPartnerId.equals(tx.getIssuerPartnerId()))
                    .collect(Collectors.toList());
        }

        String batchCode = "SETTLE_" + period.replace("-", "") + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();

        BigDecimal totalSettled = BigDecimal.ZERO;
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
            BigDecimal comm = tx.getCommissionAmount() != null ? tx.getCommissionAmount() : BigDecimal.ZERO;
            BigDecimal net = tx.getNetPayoutAmount() != null ? tx.getNetPayoutAmount() : fiat.subtract(comm);

            totalSettled = totalSettled.add(fiat);
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

        log.info("[CLEARING-SETTLE-PERIOD-SUCCESS] tenantId={}, period={}, batchCode={}, count={}, totalNetPayout={}",
                tenantId, period, batchCode, pendingTxs.size(), totalNetPayout);

        return SettlePeriodResponse.builder()
                .settlementBatchCode(batchCode)
                .period(period)
                .settledTransactionCount(pendingTxs.size())
                .totalSettledAmount(totalSettled)
                .totalCommissionFee(totalCommission)
                .totalNetPayout(totalNetPayout)
                .status(ClearingStatus.SETTLED)
                .message("Quyết toán kết chuyển kỳ bù trừ " + period + " thành công")
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
        String partnerName = partner != null ? partner.getPartnerName() : "Đối tác #" + partnerId;

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
                .orElseThrow(() -> new LoyaltyException(ErrorCode.PARTNER_UNAUTHORIZED, "Không tìm thấy thông tin đối tác"));

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
                .batchCode(request.getBatchCode() != null ? request.getBatchCode() : "AUTO_RECON_" + System.currentTimeMillis())
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
                .orElseThrow(() -> new LoyaltyException(ErrorCode.PARTNER_UNAUTHORIZED, "Không tìm thấy thông tin đối tác"));

        ClearingTransactionEntity clearingTx = null;
        if (request.getTransactionCode() != null && !request.getTransactionCode().trim().isEmpty()) {
            clearingTx = clearingRepository.findByTenantIdAndTransactionCode(tenantId, request.getTransactionCode().trim()).orElse(null);
        }

        String disputeCode = "DISPUTE_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
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
                .message("Đã ghi nhận yêu cầu khiếu nại đối soát thành công")
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
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, "Không tìm thấy bản ghi khiếu nại"));

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
