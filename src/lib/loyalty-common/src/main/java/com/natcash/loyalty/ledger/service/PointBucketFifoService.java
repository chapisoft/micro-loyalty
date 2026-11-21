package com.natcash.loyalty.ledger.service;

import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.domain.enums.BucketStatus;
import com.natcash.loyalty.domain.enums.CurrencyAssetType;
import com.natcash.loyalty.domain.enums.SponsorType;
import com.natcash.loyalty.ledger.entity.PointExpirationBucketEntity;
import com.natcash.loyalty.ledger.repository.PointExpirationBucketRepository;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PointBucketFifoService {

    private final PointExpirationBucketRepository bucketRepository;

    @Transactional
    public PointExpirationBucketEntity createEarnBucket(
            String tenantId,
            Long accountId,
            BigDecimal points,
            Instant expiredAt,
            String sourceRef,
            CurrencyAssetType assetType) {
        return createEarnBucket(tenantId, accountId, points, expiredAt, sourceRef, assetType, null, SponsorType.NATCASH);
    }

    @Transactional
    public PointExpirationBucketEntity createEarnBucket(
            String tenantId,
            Long accountId,
            BigDecimal points,
            Instant expiredAt,
            String sourceRef,
            CurrencyAssetType assetType,
            Long fundingPartnerId,
            SponsorType sponsorType) {
        if (points == null || points.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        Instant effectiveExpiry = expiredAt != null
                ? expiredAt
                : Instant.now().plus(SystemParameterService.get().getInt(
                        tenantId, SystemParamSpec.WALLET_DEFAULT_POINT_EXPIRATION_MONTHS) * 30L, ChronoUnit.DAYS);
        SponsorType effectiveSponsor = sponsorType != null
                ? sponsorType
                : (fundingPartnerId != null ? SponsorType.PARTNER : SponsorType.NATCASH);
        PointExpirationBucketEntity bucket = PointExpirationBucketEntity.builder()
                .tenantId(tenantId)
                .accountId(accountId)
                .assetType(assetType != null ? assetType : CurrencyAssetType.LOYALTY_COIN)
                .initialPoints(points)
                .remainingPoints(points)
                .earnedAt(Instant.now())
                .expiredAt(effectiveExpiry)
                .sourceRef(sourceRef)
                .fundingPartnerId(fundingPartnerId)
                .sponsorType(effectiveSponsor)
                .status(BucketStatus.ACTIVE)
                .build();
        return bucketRepository.save(bucket);
    }

    @Transactional
    public BigDecimal consumeFifo(
            String tenantId,
            Long accountId,
            BigDecimal amountToConsume,
            CurrencyAssetType assetType) {
        List<FifoBucketConsumption> traces = consumeFifoWithTrace(tenantId, accountId, amountToConsume, assetType);
        return traces.stream()
                .map(FifoBucketConsumption::getPointsConsumed)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Khấu trừ FIFO và trả về dấu vết từng lô điểm đã tiêu thụ để bóc tách công nợ đối soát cuối chu kỳ.
     */
    @Transactional
    public List<FifoBucketConsumption> consumeFifoWithTrace(
            String tenantId,
            Long accountId,
            BigDecimal amountToConsume,
            CurrencyAssetType assetType) {
        if (amountToConsume == null || amountToConsume.compareTo(BigDecimal.ZERO) <= 0) {
            return Collections.emptyList();
        }
        CurrencyAssetType targetAsset = assetType != null ? assetType : CurrencyAssetType.LOYALTY_COIN;
        List<PointExpirationBucketEntity> buckets = bucketRepository.findActiveBucketsFifoForUpdate(
                tenantId, accountId, targetAsset);
        if (buckets == null || buckets.isEmpty()) {
            return Collections.emptyList();
        }

        BigDecimal remainingToDeduct = amountToConsume;
        List<FifoBucketConsumption> consumptions = new ArrayList<>();

        for (PointExpirationBucketEntity bucket : buckets) {
            if (remainingToDeduct.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            BigDecimal available = bucket.getRemainingPoints() != null ? bucket.getRemainingPoints() : BigDecimal.ZERO;
            if (available.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            BigDecimal deduct = available.min(remainingToDeduct);
            BigDecimal nextRemaining = available.subtract(deduct);
            bucket.setRemainingPoints(nextRemaining);
            if (nextRemaining.compareTo(BigDecimal.ZERO) <= 0) {
                bucket.setStatus(BucketStatus.DEPLETED);
            }
            bucketRepository.save(bucket);
            consumptions.add(FifoBucketConsumption.builder()
                    .bucketId(bucket.getId())
                    .sourceRef(bucket.getSourceRef())
                    .fundingPartnerId(bucket.getFundingPartnerId())
                    .sponsorType(bucket.getSponsorType() != null ? bucket.getSponsorType() : SponsorType.NATCASH)
                    .pointsConsumed(deduct)
                    .build());
            remainingToDeduct = remainingToDeduct.subtract(deduct);
        }

        log.debug("FIFO consume trace tenantId={} accountId={} requested={} buckets={}",
                tenantId, accountId, amountToConsume, consumptions.size());
        return consumptions;
    }

    /**
     * Hoàn trả số Coin đã khấu trừ về đúng lô gốc khi giao dịch bị hủy hoặc Core Revert.
     */
    @Transactional
    public void restoreBucket(Long bucketId, BigDecimal pointsToRestore) {
        if (bucketId == null || pointsToRestore == null || pointsToRestore.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        bucketRepository.findById(bucketId).ifPresent(bucket -> {
            BigDecimal current = bucket.getRemainingPoints() != null ? bucket.getRemainingPoints() : BigDecimal.ZERO;
            bucket.setRemainingPoints(current.add(pointsToRestore));
            if (bucket.getExpiredAt() == null || bucket.getExpiredAt().isAfter(Instant.now())) {
                bucket.setStatus(BucketStatus.ACTIVE);
            }
            bucketRepository.save(bucket);
        });
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FifoBucketConsumption {
        private Long bucketId;
        private String sourceRef;
        private Long fundingPartnerId;
        private SponsorType sponsorType;
        private BigDecimal pointsConsumed;
    }

    @Transactional
    public int expireDueBuckets() {
        List<PointExpirationBucketEntity> dueBuckets = bucketRepository
                .findTop500ByStatusAndRemainingPointsGreaterThanAndExpiredAtBeforeOrderByExpiredAtAsc(
                        BucketStatus.ACTIVE, BigDecimal.ZERO, Instant.now());
        if (dueBuckets == null || dueBuckets.isEmpty()) {
            return 0;
        }
        for (PointExpirationBucketEntity bucket : dueBuckets) {
            bucket.setRemainingPoints(BigDecimal.ZERO);
            bucket.setStatus(BucketStatus.EXPIRED);
            bucketRepository.save(bucket);
        }
        return dueBuckets.size();
    }

    @Transactional(readOnly = true)
    public List<PointExpirationBucketEntity> findExpiringBuckets(String tenantId, int withinDays) {
        int safeDays = Math.max(1, Math.min(withinDays, 365));
        Instant now = Instant.now();
        Instant cutoff = now.plus(safeDays, ChronoUnit.DAYS);
        List<PointExpirationBucketEntity> result = bucketRepository
                .findByTenantIdAndStatusAndExpiredAtBetweenOrderByExpiredAtAsc(
                        tenantId, BucketStatus.ACTIVE, now, cutoff);
        return result != null ? result : Collections.emptyList();
    }
}
