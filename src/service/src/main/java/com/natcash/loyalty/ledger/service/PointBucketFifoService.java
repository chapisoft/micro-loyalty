package com.natcash.loyalty.ledger.service;

import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.domain.enums.BucketStatus;
import com.natcash.loyalty.domain.enums.CurrencyAssetType;
import com.natcash.loyalty.ledger.entity.PointExpirationBucketEntity;
import com.natcash.loyalty.ledger.repository.PointExpirationBucketRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
        if (points == null || points.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        Instant effectiveExpiry = expiredAt != null
                ? expiredAt
                : Instant.now().plus(LoyaltyConstants.DEFAULT_POINT_EXPIRATION_MONTHS * 30L, ChronoUnit.DAYS);
        PointExpirationBucketEntity bucket = PointExpirationBucketEntity.builder()
                .tenantId(tenantId)
                .accountId(accountId)
                .assetType(assetType != null ? assetType : CurrencyAssetType.LOYALTY_COIN)
                .initialPoints(points)
                .remainingPoints(points)
                .earnedAt(Instant.now())
                .expiredAt(effectiveExpiry)
                .sourceRef(sourceRef)
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
        if (amountToConsume == null || amountToConsume.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        CurrencyAssetType targetAsset = assetType != null ? assetType : CurrencyAssetType.LOYALTY_COIN;
        List<PointExpirationBucketEntity> buckets = bucketRepository.findActiveBucketsFifoForUpdate(
                tenantId, accountId, targetAsset);
        if (buckets == null || buckets.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal remainingToDeduct = amountToConsume;
        BigDecimal totalDeducted = BigDecimal.ZERO;

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
            remainingToDeduct = remainingToDeduct.subtract(deduct);
            totalDeducted = totalDeducted.add(deduct);
        }

        log.debug("FIFO consume tenantId={} accountId={} requested={} deducted={}",
                tenantId, accountId, amountToConsume, totalDeducted);
        return totalDeducted;
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
