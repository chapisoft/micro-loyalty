package com.natcash.loyalty.ledger.repository;

import com.natcash.loyalty.domain.enums.BucketStatus;
import com.natcash.loyalty.domain.enums.CurrencyAssetType;
import com.natcash.loyalty.ledger.entity.PointExpirationBucketEntity;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Repository
public interface PointExpirationBucketRepository extends JpaRepository<PointExpirationBucketEntity, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM PointExpirationBucketEntity b " +
           "WHERE b.tenantId = :tenantId " +
           "AND b.accountId = :accountId " +
           "AND b.assetType = :assetType " +
           "AND b.status = com.natcash.loyalty.domain.enums.BucketStatus.ACTIVE " +
           "AND b.remainingPoints > 0 " +
           "ORDER BY b.expiredAt ASC, b.id ASC")
    List<PointExpirationBucketEntity> findActiveBucketsFifoForUpdate(
            @Param("tenantId") String tenantId,
            @Param("accountId") Long accountId,
            @Param("assetType") CurrencyAssetType assetType);

    List<PointExpirationBucketEntity> findByTenantIdAndAccountIdAndStatusOrderByExpiredAtAsc(
            String tenantId, Long accountId, BucketStatus status);

    List<PointExpirationBucketEntity> findByTenantIdAndStatusAndExpiredAtBetweenOrderByExpiredAtAsc(
            String tenantId, BucketStatus status, Instant from, Instant to);

    List<PointExpirationBucketEntity> findTop500ByStatusAndRemainingPointsGreaterThanAndExpiredAtBeforeOrderByExpiredAtAsc(
            BucketStatus status, BigDecimal minRemaining, Instant now);

    @Query("SELECT COALESCE(SUM(b.remainingPoints), 0) FROM PointExpirationBucketEntity b " +
           "WHERE b.tenantId = :tenantId AND b.status = com.natcash.loyalty.domain.enums.BucketStatus.ACTIVE " +
           "AND b.expiredAt <= :cutoff")
    BigDecimal sumExpiringPointsBefore(@Param("tenantId") String tenantId, @Param("cutoff") Instant cutoff);

    @Query("SELECT COALESCE(SUM(b.remainingPoints), 0) FROM PointExpirationBucketEntity b " +
           "WHERE b.tenantId = :tenantId AND b.status = com.natcash.loyalty.domain.enums.BucketStatus.ACTIVE")
    BigDecimal sumActiveLiabilityPoints(@Param("tenantId") String tenantId);
}
