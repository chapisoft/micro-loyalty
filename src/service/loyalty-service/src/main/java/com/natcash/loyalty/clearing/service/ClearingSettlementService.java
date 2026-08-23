package com.natcash.loyalty.clearing.service;

import com.natcash.loyalty.clearing.dto.ClearingDto.PartnerClearingSummaryDto;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodResponse;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ClearingSettlementService {

    private static final Logger log = LoggerFactory.getLogger(ClearingSettlementService.class);

    private final ClearingTransactionRepository clearingRepository;

    public ClearingSettlementService(ClearingTransactionRepository clearingRepository) {
        this.clearingRepository = clearingRepository;
    }

    @Transactional(readOnly = true)
    public ReconciliationReportResponse getReconciliationReport(String tenantId, ReconciliationReportRequest request) {
        Instant from = request.getFromDate();
        Instant to = request.getToDate();

        List<ClearingTransactionEntity> txList = clearingRepository.findByTenantIdAndCreatedAtBetween(tenantId, from, to);

        long grandTotalTransactions = txList.size();
        BigDecimal grandTotalPoints = BigDecimal.ZERO;
        BigDecimal grandTotalFiat = BigDecimal.ZERO;

        Map<Long, List<ClearingTransactionEntity>> redeemerMap = new HashMap<>();
        for (ClearingTransactionEntity tx : txList) {
            grandTotalPoints = grandTotalPoints.add(tx.getPointsRedeemed() != null ? tx.getPointsRedeemed() : BigDecimal.ZERO);
            grandTotalFiat = grandTotalFiat.add(tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO);

            redeemerMap.computeIfAbsent(tx.getRedeemerPartnerId(), k -> new ArrayList<>()).add(tx);
        }

        List<PartnerClearingSummaryDto> summaries = new ArrayList<>();
        for (Map.Entry<Long, List<ClearingTransactionEntity>> entry : redeemerMap.entrySet()) {
            Long partnerId = entry.getKey();
            List<ClearingTransactionEntity> partnerTxs = entry.getValue();

            BigDecimal pointsRedeemed = BigDecimal.ZERO;
            BigDecimal fiatReceivable = BigDecimal.ZERO;
            for (ClearingTransactionEntity tx : partnerTxs) {
                pointsRedeemed = pointsRedeemed.add(tx.getPointsRedeemed() != null ? tx.getPointsRedeemed() : BigDecimal.ZERO);
                fiatReceivable = fiatReceivable.add(tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO);
            }

            summaries.add(PartnerClearingSummaryDto.builder()
                    .partnerId(partnerId)
                    .partnerName("Đối tác ID #" + partnerId)
                    .totalTransactions(partnerTxs.size())
                    .totalPointsIssued(BigDecimal.ZERO)
                    .totalPointsRedeemed(pointsRedeemed)
                    .totalFiatPayable(BigDecimal.ZERO)
                    .totalFiatReceivable(fiatReceivable)
                    .netSettlementAmount(fiatReceivable)
                    .status(ClearingStatus.PENDING)
                    .build());
        }

        log.info("[CLEARING-RECONCILIATION-REPORT] tenantId={}, txCount={}, totalPoints={}, totalFiat={}",
                tenantId, grandTotalTransactions, grandTotalPoints, grandTotalFiat);

        return ReconciliationReportResponse.builder()
                .periodFrom(from)
                .periodTo(to)
                .grandTotalTransactions(grandTotalTransactions)
                .grandTotalPointsRedeemed(grandTotalPoints)
                .grandTotalFiatAmount(grandTotalFiat)
                .partnerSummaries(summaries)
                .generatedAt(Instant.now())
                .build();
    }

    @Transactional
    public SettlePeriodResponse settlePeriod(String tenantId, SettlePeriodRequest request) {
        Instant from = request.getFromDate();
        Instant to = request.getToDate();

        List<ClearingTransactionEntity> pendingTxs = clearingRepository.findByTenantIdAndCreatedAtBetween(tenantId, from, to)
                .stream()
                .filter(tx -> tx.getStatus() == ClearingStatus.PENDING)
                .toList();

        BigDecimal totalSettled = BigDecimal.ZERO;
        Instant now = Instant.now();

        for (ClearingTransactionEntity tx : pendingTxs) {
            tx.setStatus(ClearingStatus.SETTLED);
            tx.setSettledAt(now);
            totalSettled = totalSettled.add(tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO);
        }

        clearingRepository.saveAll(pendingTxs);

        String batchCode = "SETTLE_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        log.info("[CLEARING-SETTLE-PERIOD-SUCCESS] tenantId={}, batchCode={}, count={}, totalSettled={}",
                tenantId, batchCode, pendingTxs.size(), totalSettled);

        return SettlePeriodResponse.builder()
                .settlementBatchCode(batchCode)
                .settledTransactionCount(pendingTxs.size())
                .totalSettledAmount(totalSettled)
                .status(ClearingStatus.SETTLED)
                .message("Quyết toán kết chuyển kỳ bù trừ thành công")
                .settledAt(now)
                .build();
    }
}
