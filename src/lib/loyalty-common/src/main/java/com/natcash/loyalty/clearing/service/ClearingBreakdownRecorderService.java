package com.natcash.loyalty.clearing.service;

import com.natcash.loyalty.clearing.entity.ClearingTransactionBreakdownEntity;
import com.natcash.loyalty.clearing.repository.ClearingTransactionBreakdownRepository;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.ClearingSourceType;
import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.SponsorType;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.service.PointBucketFifoService;
import com.natcash.loyalty.ledger.service.PointBucketFifoService.FifoBucketConsumption;
import com.natcash.loyalty.util.MessageUtils;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherRedemptionEntity;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRedemptionRepository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Dịch vụ dùng chung để xử lý nhiều mã Voucher trong 1 giao dịch, bóc tách chi tiết nguồn tài trợ
 * (Voucher & từng lô Coin FIFO) xuống clearing_transaction_breakdowns và hoàn trả khi hủy/Revert.
 */
@Slf4j
@Service
public class ClearingBreakdownRecorderService {

    private static final BigDecimal HUNDRED = new BigDecimal("100.00");

    private final ClearingTransactionBreakdownRepository breakdownRepository;
    private final LoyaltyVoucherRedemptionRepository redemptionRepository;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private PointBucketFifoService pointBucketFifoService;

    @Autowired
    public ClearingBreakdownRecorderService(
            ClearingTransactionBreakdownRepository breakdownRepository,
            LoyaltyVoucherRedemptionRepository redemptionRepository,
            @Autowired(required = false) ObjectMapper objectMapper) {
        this.breakdownRepository = breakdownRepository;
        this.redemptionRepository = redemptionRepository;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    public List<String> mergeVoucherCodes(String singleCode, List<String> multiCodes) {
        Set<String> merged = new LinkedHashSet<>();
        if (multiCodes != null) {
            for (String code : multiCodes) {
                if (code != null && !code.trim().isEmpty()) {
                    merged.add(code.trim());
                }
            }
        }
        if (singleCode != null && !singleCode.trim().isEmpty()) {
            merged.add(singleCode.trim());
        }
        return new ArrayList<>(merged);
    }

    public String toJsonArray(List<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(codes);
        } catch (Exception ex) {
            return "[]";
        }
    }

    public List<String> parseJsonArray(String json, String fallbackSingleCode) {
        Set<String> result = new LinkedHashSet<>();
        if (json != null && !json.isBlank() && !"[]".equals(json.trim())) {
            try {
                List<String> parsed = objectMapper.readValue(json, new TypeReference<>() {});
                if (parsed != null) {
                    for (String s : parsed) {
                        if (s != null && !s.isBlank()) {
                            result.add(s.trim());
                        }
                    }
                }
            } catch (Exception ex) {
                log.debug("Failed to parse voucher_codes_json: {}", ex.getMessage());
            }
        }
        if (fallbackSingleCode != null && !fallbackSingleCode.isBlank()) {
            result.add(fallbackSingleCode.trim());
        }
        return new ArrayList<>(result);
    }

    /**
     * Tính mức giảm giá của 1 voucher theo hóa đơn và phân bổ tỷ lệ đồng tài trợ.
     */
    public BigDecimal calculateVoucherDiscount(String tenantId, LoyaltyVoucherEntity voucher, BigDecimal remainingBill) {
        if (voucher == null || remainingBill == null || remainingBill.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal minBill = voucher.getMinBillAmount() != null ? voucher.getMinBillAmount() : BigDecimal.ZERO;
        if (remainingBill.compareTo(minBill) < 0) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION,
                    MessageUtils.getMessage("wallet.error.bill_below_min_voucher"));
        }

        BigDecimal discount;
        if (voucher.getDiscountType() == DiscountType.PERCENTAGE) {
            BigDecimal divisor = SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.PERCENT_DIVISOR);
            discount = remainingBill.multiply(voucher.getDiscountValue())
                    .divide(divisor, 2, RoundingMode.HALF_UP);
            if (voucher.getMaxDiscountAmount() != null && discount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                discount = voucher.getMaxDiscountAmount();
            }
        } else {
            discount = voucher.getDiscountValue() != null ? voucher.getDiscountValue() : BigDecimal.ZERO;
        }
        return discount.min(remainingBill).max(BigDecimal.ZERO);
    }

    /**
     * Lưu toàn bộ dòng bóc tách cho 1 giao dịch bù trừ đã Confirm/Direct: gồm cả Voucher và các lô Coin FIFO.
     */
    @Transactional
    public List<ClearingTransactionBreakdownEntity> recordBreakdowns(
            ClearingTransactionEntity clearing,
            List<VoucherSlice> voucherSlices,
            List<FifoBucketConsumption> fifoConsumptions,
            BigDecimal totalPointDiscount,
            BigDecimal totalPointsBurned,
            BigDecimal exchangeRate,
            Long defaultIssuerPartnerId) {

        List<ClearingTransactionBreakdownEntity> saved = new ArrayList<>();
        if (clearing == null || clearing.getId() == null) {
            return saved;
        }

        // 1. Bóc tách từng mã Voucher theo cấu hình tài trợ / đồng tài trợ
        if (voucherSlices != null) {
            for (VoucherSlice slice : voucherSlices) {
                if (slice.getAppliedDiscount() == null || slice.getAppliedDiscount().compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                saved.addAll(splitVoucherSlice(clearing, slice));
            }
        }

        // 2. Bóc tách từng lô Coin FIFO đã khấu trừ (hoặc 1 dòng tổng nếu chưa có FIFO bucket cụ thể)
        if (totalPointDiscount != null && totalPointDiscount.compareTo(BigDecimal.ZERO) > 0) {
            saved.addAll(splitCoinConsumptions(
                    clearing, fifoConsumptions, totalPointDiscount, totalPointsBurned, exchangeRate, defaultIssuerPartnerId));
        }

        if (!saved.isEmpty()) {
            return breakdownRepository.saveAll(saved);
        }
        return Collections.emptyList();
    }

    /**
     * Đánh dấu hoàn bóc tách, khôi phục trạng thái Voucher và hoàn Coin về đúng lô FIFO gốc khi giao dịch hủy/Revert.
     */
    @Transactional
    public void revertBreakdownsAndAssets(ClearingTransactionEntity clearing, String singleFallbackVoucherCode) {
        if (clearing == null) {
            return;
        }
        List<ClearingTransactionBreakdownEntity> rows = clearing.getId() != null
                ? breakdownRepository.findByTenantIdAndClearingTxIdOrderByIdAsc(clearing.getTenantId(), clearing.getId())
                : Collections.emptyList();

        Set<Long> restoredRedemptionIds = new LinkedHashSet<>();
        for (ClearingTransactionBreakdownEntity row : rows) {
            if (Boolean.TRUE.equals(row.getReverted())) {
                continue;
            }
            row.setReverted(Boolean.TRUE);
            if (row.getSourceType() == ClearingSourceType.LOYALTY_COIN
                    && row.getBucketId() != null
                    && pointBucketFifoService != null
                    && row.getPointsConsumed() != null
                    && row.getPointsConsumed().compareTo(BigDecimal.ZERO) > 0) {
                pointBucketFifoService.restoreBucket(row.getBucketId(), row.getPointsConsumed());
            } else if (row.getSourceType() == ClearingSourceType.VOUCHER && row.getRedemptionId() != null) {
                restoredRedemptionIds.add(row.getRedemptionId());
            }
        }
        if (!rows.isEmpty()) {
            breakdownRepository.saveAll(rows);
        }

        // Khôi phục Voucher về ACTIVE
        for (Long redemptionId : restoredRedemptionIds) {
            redemptionRepository.findById(redemptionId).ifPresent(this::restoreRedemptionToActive);
        }
        if (restoredRedemptionIds.isEmpty() && singleFallbackVoucherCode != null && !singleFallbackVoucherCode.isBlank()) {
            redemptionRepository.findByTenantIdAndRedemptionCode(clearing.getTenantId(), singleFallbackVoucherCode)
                    .ifPresent(this::restoreRedemptionToActive);
        }
    }

    private void restoreRedemptionToActive(LoyaltyVoucherRedemptionEntity redemption) {
        if (redemption.getStatus() == VoucherStatus.USED) {
            redemption.setStatus(VoucherStatus.ACTIVE);
            redemption.setUsedAt(null);
            redemption.setUsedPartnerId(null);
            redemptionRepository.save(redemption);
        }
    }

    private List<ClearingTransactionBreakdownEntity> splitVoucherSlice(
            ClearingTransactionEntity clearing, VoucherSlice slice) {
        List<ClearingTransactionBreakdownEntity> result = new ArrayList<>();
        BigDecimal total = slice.getAppliedDiscount().setScale(2, RoundingMode.HALF_UP);
        SponsorType sponsorType = slice.getSponsorType() != null
                ? slice.getSponsorType()
                : (slice.getPartnerId() != null ? SponsorType.PARTNER : SponsorType.NATCASH);

        if (sponsorType == SponsorType.CO_FUNDED && slice.getPartnerId() != null) {
            BigDecimal partnerPct = slice.getPartnerSharePercent() != null ? slice.getPartnerSharePercent() : BigDecimal.ZERO;
            BigDecimal natcashPct = HUNDRED.subtract(partnerPct).max(BigDecimal.ZERO);

            BigDecimal partnerAmount = total.multiply(partnerPct).divide(HUNDRED, 2, RoundingMode.HALF_UP);
            BigDecimal natcashAmount = total.subtract(partnerAmount);

            if (natcashAmount.compareTo(BigDecimal.ZERO) > 0) {
                result.add(buildBreakdownRow(clearing, ClearingSourceType.VOUCHER, slice.getSourceRef(),
                        null, slice.getRedemptionId(), SponsorType.NATCASH, null, natcashPct,
                        BigDecimal.ZERO, BigDecimal.ONE, natcashAmount));
            }
            if (partnerAmount.compareTo(BigDecimal.ZERO) > 0) {
                result.add(buildBreakdownRow(clearing, ClearingSourceType.VOUCHER, slice.getSourceRef(),
                        null, slice.getRedemptionId(), SponsorType.PARTNER, slice.getPartnerId(), partnerPct,
                        BigDecimal.ZERO, BigDecimal.ONE, partnerAmount));
            }
            return result;
        }

        Long fundingPartnerId = sponsorType == SponsorType.PARTNER ? slice.getPartnerId() : null;
        result.add(buildBreakdownRow(clearing, ClearingSourceType.VOUCHER, slice.getSourceRef(),
                null, slice.getRedemptionId(), sponsorType, fundingPartnerId, HUNDRED,
                BigDecimal.ZERO, BigDecimal.ONE, total));
        return result;
    }

    private List<ClearingTransactionBreakdownEntity> splitCoinConsumptions(
            ClearingTransactionEntity clearing,
            List<FifoBucketConsumption> fifoConsumptions,
            BigDecimal totalPointDiscount,
            BigDecimal totalPointsBurned,
            BigDecimal exchangeRate,
            Long defaultIssuerPartnerId) {
        List<ClearingTransactionBreakdownEntity> result = new ArrayList<>();
        BigDecimal effectiveRate = exchangeRate != null && exchangeRate.compareTo(BigDecimal.ZERO) > 0
                ? exchangeRate : BigDecimal.ONE;

        if (fifoConsumptions == null || fifoConsumptions.isEmpty()) {
            SponsorType fallbackSponsor = defaultIssuerPartnerId != null ? SponsorType.PARTNER : SponsorType.NATCASH;
            result.add(buildBreakdownRow(
                    clearing, ClearingSourceType.LOYALTY_COIN, "COIN_WALLET",
                    null, null, fallbackSponsor, defaultIssuerPartnerId, HUNDRED,
                    totalPointsBurned != null ? totalPointsBurned : BigDecimal.ZERO,
                    effectiveRate, totalPointDiscount.setScale(2, RoundingMode.HALF_UP)));
            return result;
        }

        BigDecimal totalConsumedPts = fifoConsumptions.stream()
                .map(FifoBucketConsumption::getPointsConsumed)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalConsumedPts.compareTo(BigDecimal.ZERO) <= 0) {
            return result;
        }

        BigDecimal allocatedFiat = BigDecimal.ZERO;
        for (int i = 0; i < fifoConsumptions.size(); i++) {
            FifoBucketConsumption item = fifoConsumptions.get(i);
            BigDecimal itemFiat;
            if (i == fifoConsumptions.size() - 1) {
                itemFiat = totalPointDiscount.subtract(allocatedFiat).max(BigDecimal.ZERO);
            } else {
                itemFiat = totalPointDiscount.multiply(item.getPointsConsumed())
                        .divide(totalConsumedPts, 2, RoundingMode.HALF_UP);
                allocatedFiat = allocatedFiat.add(itemFiat);
            }

            BigDecimal sharePct = item.getPointsConsumed().multiply(HUNDRED)
                    .divide(totalConsumedPts, 2, RoundingMode.HALF_UP);
            SponsorType itemSponsor = item.getSponsorType() != null
                    ? item.getSponsorType()
                    : (item.getFundingPartnerId() != null ? SponsorType.PARTNER : SponsorType.NATCASH);

            result.add(buildBreakdownRow(
                    clearing, ClearingSourceType.LOYALTY_COIN,
                    item.getSourceRef() != null ? item.getSourceRef() : "COIN_BUCKET_" + item.getBucketId(),
                    item.getBucketId(), null, itemSponsor, item.getFundingPartnerId(), sharePct,
                    item.getPointsConsumed(), effectiveRate, itemFiat));
        }
        return result;
    }

    private ClearingTransactionBreakdownEntity buildBreakdownRow(
            ClearingTransactionEntity clearing,
            ClearingSourceType sourceType,
            String sourceRef,
            Long bucketId,
            Long redemptionId,
            SponsorType sponsorType,
            Long fundingPartnerId,
            BigDecimal shareRatio,
            BigDecimal pointsConsumed,
            BigDecimal exchangeRate,
            BigDecimal payableAmount) {
        return ClearingTransactionBreakdownEntity.builder()
                .tenantId(clearing.getTenantId())
                .clearingTxId(clearing.getId())
                .transactionCode(clearing.getTransactionCode())
                .holdCode(clearing.getHoldCode())
                .sourceType(sourceType)
                .sourceRef(sourceRef)
                .bucketId(bucketId)
                .redemptionId(redemptionId)
                .sponsorType(sponsorType)
                .fundingPartnerId(fundingPartnerId)
                .shareRatio(shareRatio)
                .pointsConsumed(pointsConsumed)
                .exchangeRate(exchangeRate)
                .payableAmount(payableAmount)
                .reverted(Boolean.FALSE)
                .createdAt(Instant.now())
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoucherSlice {
        private Long redemptionId;
        private Long voucherId;
        private String sourceRef;
        private String appliedCode;
        private Long partnerId;
        private SponsorType sponsorType;
        private BigDecimal natcashSharePercent;
        private BigDecimal partnerSharePercent;
        private BigDecimal appliedDiscount;
    }
}
