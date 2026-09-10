package com.natcash.loyalty.clearing.service;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.clearing.dto.ClearingDto.DisputeItemDto;
import com.natcash.loyalty.clearing.dto.ClearingDto.PartnerClearingSummaryDto;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.ResolveDisputeRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodResponse;
import com.natcash.loyalty.clearing.entity.LoyaltyClearingDisputeEntity;
import com.natcash.loyalty.clearing.repository.LoyaltyClearingDisputeRepository;
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
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClearingSettlementService {

    private final ClearingTransactionRepository clearingRepository;
    private final LoyaltyPartnerRepository partnerRepository;
    private final LoyaltyClearingDisputeRepository disputeRepository;
    private final OutboxService outboxService;

    // =========================================================================
    // 1. TỔNG HỢP BÁO CÁO ĐỐI SOÁT BÙ TRỪ KỲ (CMS)
    // =========================================================================
    @Transactional(readOnly = true)
    public ReconciliationReportResponse getReconciliationReport(String tenantId, ReconciliationReportRequest request) {
        Instant from = request.getFromDate() != null ? request.getFromDate() : Instant.now().minus(30, ChronoUnit.DAYS);
        Instant to = request.getToDate() != null ? request.getToDate() : Instant.now();

        List<ClearingTransactionEntity> txList = clearingRepository.findByTenantIdAndCreatedAtBetween(tenantId, from, to);
        if (request.getPartnerId() != null) {
            txList = txList.stream()
                    .filter(tx -> request.getPartnerId().equals(tx.getRedeemerPartnerId()))
                    .collect(Collectors.toList());
        }

        Map<Long, LoyaltyPartnerEntity> partnerMap = new HashMap<>();
        List<LoyaltyPartnerEntity> partners = partnerRepository.findByTenantId(tenantId);
        if (partners != null) {
            for (LoyaltyPartnerEntity p : partners) {
                if (p != null && p.getId() != null) {
                    partnerMap.put(p.getId(), p);
                }
            }
        }

        long grandTotalTransactions = txList.size();
        BigDecimal grandTotalPoints = BigDecimal.ZERO;
        BigDecimal grandTotalFiat = BigDecimal.ZERO;
        BigDecimal grandTotalCommission = BigDecimal.ZERO;
        BigDecimal grandTotalNet = BigDecimal.ZERO;

        Map<Long, List<ClearingTransactionEntity>> redeemerMap = new HashMap<>();
        for (ClearingTransactionEntity tx : txList) {
            BigDecimal pts = tx.getPointsRedeemed() != null ? tx.getPointsRedeemed() : BigDecimal.ZERO;
            BigDecimal fiat = tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO;
            BigDecimal comm = tx.getCommissionAmount() != null ? tx.getCommissionAmount() : BigDecimal.ZERO;
            BigDecimal net = tx.getNetPayoutAmount() != null ? tx.getNetPayoutAmount() : fiat.subtract(comm);

            grandTotalPoints = grandTotalPoints.add(pts);
            grandTotalFiat = grandTotalFiat.add(fiat);
            grandTotalCommission = grandTotalCommission.add(comm);
            grandTotalNet = grandTotalNet.add(net);

            Long partnerId = tx.getRedeemerPartnerId() != null ? tx.getRedeemerPartnerId() : 1L;
            redeemerMap.computeIfAbsent(partnerId, k -> new ArrayList<>()).add(tx);
        }

        List<PartnerClearingSummaryDto> summaries = new ArrayList<>();
        for (Map.Entry<Long, List<ClearingTransactionEntity>> entry : redeemerMap.entrySet()) {
            Long partnerId = entry.getKey();
            List<ClearingTransactionEntity> partnerTxs = entry.getValue();

            BigDecimal pointsRedeemed = BigDecimal.ZERO;
            BigDecimal fiatReceivable = BigDecimal.ZERO;
            BigDecimal commissionFee = BigDecimal.ZERO;
            BigDecimal netPayout = BigDecimal.ZERO;

            for (ClearingTransactionEntity tx : partnerTxs) {
                BigDecimal p = tx.getPointsRedeemed() != null ? tx.getPointsRedeemed() : BigDecimal.ZERO;
                BigDecimal f = tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO;
                BigDecimal c = tx.getCommissionAmount() != null ? tx.getCommissionAmount() : BigDecimal.ZERO;
                BigDecimal n = tx.getNetPayoutAmount() != null ? tx.getNetPayoutAmount() : f.subtract(c);

                pointsRedeemed = pointsRedeemed.add(p);
                fiatReceivable = fiatReceivable.add(f);
                commissionFee = commissionFee.add(c);
                netPayout = netPayout.add(n);
            }

            LoyaltyPartnerEntity partnerEntity = partnerMap.get(partnerId);
            String partnerCode = partnerEntity != null ? partnerEntity.getPartnerCode() : "PARTNER_" + partnerId;
            String partnerName = partnerEntity != null ? partnerEntity.getPartnerName() : "Đối tác ID #" + partnerId;

            summaries.add(PartnerClearingSummaryDto.builder()
                    .partnerId(partnerId)
                    .partnerCode(partnerCode)
                    .partnerName(partnerName)
                    .totalTransactions(partnerTxs.size())
                    .totalPointsIssued(BigDecimal.ZERO)
                    .totalPointsRedeemed(pointsRedeemed)
                    .totalFiatPayable(BigDecimal.ZERO)
                    .totalFiatReceivable(fiatReceivable)
                    .totalCommissionFee(commissionFee)
                    .netSettlementAmount(netPayout)
                    .status(ClearingStatus.PENDING)
                    .build());
        }

        log.info("[CLEARING-RECON-REPORT] tenantId={}, txCount={}, totalPoints={}, totalNet={}",
                tenantId, grandTotalTransactions, grandTotalPoints, grandTotalNet);

        return ReconciliationReportResponse.builder()
                .periodFrom(from)
                .periodTo(to)
                .grandTotalTransactions(grandTotalTransactions)
                .grandTotalPointsRedeemed(grandTotalPoints)
                .grandTotalFiatAmount(grandTotalFiat)
                .grandTotalCommissionFee(grandTotalCommission)
                .grandTotalNetSettlement(grandTotalNet)
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

        List<ClearingTransactionEntity> pendingTxs = clearingRepository.findByTenantIdAndCreatedAtBetween(tenantId, from, to)
                .stream()
                .filter(tx -> tx.getStatus() == ClearingStatus.PENDING)
                .collect(Collectors.toList());

        if (request.getPartnerId() != null) {
            pendingTxs = pendingTxs.stream()
                    .filter(tx -> request.getPartnerId().equals(tx.getRedeemerPartnerId()))
                    .collect(Collectors.toList());
        }

        String batchCode = "SETTLE_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        Instant now = Instant.now();

        BigDecimal totalSettled = BigDecimal.ZERO;
        BigDecimal totalCommission = BigDecimal.ZERO;
        BigDecimal totalNetPayout = BigDecimal.ZERO;

        for (ClearingTransactionEntity tx : pendingTxs) {
            tx.setStatus(ClearingStatus.SETTLED);
            tx.setReconciliationStatus(ReconciliationStatus.SETTLED);
            tx.setReconciliationBatchCode(batchCode);
            tx.setSettledAt(now);

            BigDecimal fiat = tx.getFiatAmount() != null ? tx.getFiatAmount() : BigDecimal.ZERO;
            BigDecimal comm = tx.getCommissionAmount() != null ? tx.getCommissionAmount() : BigDecimal.ZERO;
            BigDecimal net = tx.getNetPayoutAmount() != null ? tx.getNetPayoutAmount() : fiat.subtract(comm);

            totalSettled = totalSettled.add(fiat);
            totalCommission = totalCommission.add(comm);
            totalNetPayout = totalNetPayout.add(net);
        }

        if (!pendingTxs.isEmpty()) {
            clearingRepository.saveAll(pendingTxs);
        }

        // Bắn Webhook sự kiện SETTLEMENT_BATCH_GENERATED cho các đối tác có cấu hình webhookUrl
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

        log.info("[CLEARING-SETTLE-SUCCESS] tenantId={}, batchCode={}, count={}, totalNetPayout={}",
                tenantId, batchCode, pendingTxs.size(), totalNetPayout);

        return SettlePeriodResponse.builder()
                .settlementBatchCode(batchCode)
                .settledTransactionCount(pendingTxs.size())
                .totalSettledAmount(totalSettled)
                .totalCommissionFee(totalCommission)
                .totalNetPayout(totalNetPayout)
                .status(ClearingStatus.SETTLED)
                .message("Quyết toán kết chuyển kỳ bù trừ thành công")
                .settledAt(now)
                .build();
    }

    // =========================================================================
    // 3. ĐỐI SOÁT & TRA CỨU SAO KÊ DÀNH CHO ĐỐI TÁC (PARTNER API)
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
    // 4. TIẾP NHẬN TRANH CHẤP / SAI LỆCH ĐỐI SOÁT (PARTNER API)
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
    // 5. QUẢN LÝ TRANH CHẤP TRÊN CMS
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
}
