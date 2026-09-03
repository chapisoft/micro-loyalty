package com.natcash.loyalty.clearing.service;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.clearing.dto.ClearingDto.PartnerClearingSummaryDto;
import com.natcash.loyalty.clearing.dto.ClearingDto.PartnerClearingTransactionDto;
import com.natcash.loyalty.clearing.dto.ClearingDto.PartnerTransactionsResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodResponse;
import com.natcash.loyalty.clearing.entity.LoyaltyClearinghouseSettlementEntity;
import com.natcash.loyalty.clearing.repository.LoyaltyClearinghouseSettlementRepository;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ClearingSettlementService {

    private static final Logger log = LoggerFactory.getLogger(ClearingSettlementService.class);
    private static final DateTimeFormatter PERIOD_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneOffset.UTC);

    private final ClearingTransactionRepository clearingRepository;
    private final LoyaltyPartnerRepository partnerRepository;
    private final LoyaltyClearinghouseSettlementRepository settlementRepository;

    public ClearingSettlementService(ClearingTransactionRepository clearingRepository,
                                    LoyaltyPartnerRepository partnerRepository,
                                    LoyaltyClearinghouseSettlementRepository settlementRepository) {
        this.clearingRepository = clearingRepository;
        this.partnerRepository = partnerRepository;
        this.settlementRepository = settlementRepository;
    }

    /**
     * Báo cáo đối soát bù trừ tài chính đa phương 2 chiều (Xóa bỏ 100% Mock data).
     */
    @Transactional(readOnly = true)
    public ReconciliationReportResponse getReconciliationReport(String tenantId, ReconciliationReportRequest request) {
        Instant from = request.getFromDate();
        Instant to = request.getToDate();

        // 1. Tải toàn bộ đối tác của tenant để có đầy đủ thông tin định danh
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

        // 3. Khởi tạo bộ tích lũy 2 chiều theo từng đối tác
        Map<Long, PartnerAccumulator> accumulators = new LinkedHashMap<>();
        for (Map.Entry<Long, LoyaltyPartnerEntity> entry : partnerMap.entrySet()) {
            accumulators.put(entry.getKey(), new PartnerAccumulator(entry.getValue()));
        }

        BigDecimal grandTotalPointsIssued = BigDecimal.ZERO;
        BigDecimal grandTotalPointsRedeemed = BigDecimal.ZERO;
        BigDecimal grandTotalFiatPayable = BigDecimal.ZERO;
        BigDecimal grandTotalFiatReceivable = BigDecimal.ZERO;

        for (ClearingTransactionEntity tx : txList) {
            BigDecimal points = tx.getPointsRedeemed() != null ? tx.getPointsRedeemed() : BigDecimal.ZERO;
            BigDecimal fiat = tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO;

            Long issuerId = tx.getIssuerPartnerId();
            Long redeemerId = tx.getRedeemerPartnerId();

            // Chiều Phát Hành (Issuer) -> Nợ phải trả cho quỹ liên minh
            if (issuerId != null) {
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
            if (redeemerId != null) {
                PartnerAccumulator redeemerAcc = accumulators.computeIfAbsent(redeemerId, id -> {
                    LoyaltyPartnerEntity fallback = partnerRepository.findById(id).orElse(null);
                    return new PartnerAccumulator(fallback != null ? fallback : LoyaltyPartnerEntity.builder().id(id).partnerName("Đối tác #" + id).build());
                });
                if (issuerId == null || !issuerId.equals(redeemerId)) {
                    redeemerAcc.txCount++;
                }
                redeemerAcc.pointsRedeemed = redeemerAcc.pointsRedeemed.add(points);
                redeemerAcc.fiatReceivable = redeemerAcc.fiatReceivable.add(fiat);
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
            BigDecimal netAmount = acc.fiatReceivable.subtract(acc.fiatPayable);
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
                    .netSettlementAmount(netAmount)
                    .status(status)
                    .build());
        }

        BigDecimal grandTotalNetSettlement = grandTotalFiatReceivable.subtract(grandTotalFiatPayable);

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
                .grandTotalNetSettlement(grandTotalNetSettlement)
                .grandTotalFiatAmount(grandTotalFiatReceivable)
                .partnerSummaries(summaries)
                .generatedAt(Instant.now())
                .build();
    }

    /**
     * Quyết toán kết chuyển kỳ bù trừ và lưu sổ cái chốt kỳ bất biến vào loyalty_clearinghouse_settlements.
     */
    @Transactional
    public SettlePeriodResponse settlePeriod(String tenantId, SettlePeriodRequest request) {
        Instant from = request.getFromDate();
        Instant to = request.getToDate();
        String period = PERIOD_FORMATTER.format(from);
        Instant now = Instant.now();

        // 1. Lấy danh sách các giao dịch PENDING trong kỳ
        List<ClearingTransactionEntity> pendingTxs = clearingRepository.findByTenantIdAndCreatedAtBetween(tenantId, from, to)
                .stream()
                .filter(tx -> tx.getStatus() == ClearingStatus.PENDING)
                .collect(Collectors.toList());

        BigDecimal totalSettled = BigDecimal.ZERO;
        Map<Long, PartnerPeriodAccumulator> partnerPeriodMap = new HashMap<>();

        for (ClearingTransactionEntity tx : pendingTxs) {
            tx.setStatus(ClearingStatus.SETTLED);
            tx.setSettledAt(now);

            BigDecimal points = tx.getPointsRedeemed() != null ? tx.getPointsRedeemed() : BigDecimal.ZERO;
            BigDecimal fiat = tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO;
            totalSettled = totalSettled.add(fiat);

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
            BigDecimal netAmount = acc.fiatReceivable.subtract(acc.fiatPayable);

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

        String batchCode = "SETTLE_" + period.replace("-", "") + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();

        log.info("[CLEARING-SETTLE-PERIOD-SUCCESS] tenantId={}, period={}, batchCode={}, count={}, totalSettled={}",
                tenantId, period, batchCode, pendingTxs.size(), totalSettled);

        return SettlePeriodResponse.builder()
                .settlementBatchCode(batchCode)
                .period(period)
                .settledTransactionCount(pendingTxs.size())
                .totalSettledAmount(totalSettled)
                .status(ClearingStatus.SETTLED)
                .message("Quyết toán kết chuyển kỳ bù trừ " + period + " thành công")
                .settledAt(now)
                .build();
    }

    /**
     * Lấy danh sách giao dịch bù trừ chi tiết thành phần của 1 đối tác trong kỳ (Drill-down).
     */
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

    private static class PartnerAccumulator {
        final LoyaltyPartnerEntity partner;
        long txCount = 0;
        BigDecimal pointsIssued = BigDecimal.ZERO;
        BigDecimal pointsRedeemed = BigDecimal.ZERO;
        BigDecimal fiatPayable = BigDecimal.ZERO;
        BigDecimal fiatReceivable = BigDecimal.ZERO;
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
    }
}
