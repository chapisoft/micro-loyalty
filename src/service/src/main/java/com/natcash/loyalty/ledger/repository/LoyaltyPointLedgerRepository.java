package com.natcash.loyalty.ledger.repository;

import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyPointLedgerRepository extends JpaRepository<LoyaltyPointLedgerEntity, Long> {

    Page<LoyaltyPointLedgerEntity> findByTenantIdAndAccount_ExternalUserIdOrderByCreatedAtDesc(
            String tenantId, String externalUserId, Pageable pageable);

    Page<LoyaltyPointLedgerEntity> findByTenantIdOrderByCreatedAtDesc(
            String tenantId, Pageable pageable);

    @Query("SELECT l FROM LoyaltyPointLedgerEntity l " +
           "LEFT JOIN l.account a " +
           "WHERE l.tenantId = :tenantId " +
           "AND (:externalUserId IS NULL OR :externalUserId = '' OR a.externalUserId = :externalUserId) " +
           "AND (:actionType IS NULL OR l.changeType = :actionType) " +
           "AND (:partnerId IS NULL OR l.partnerId = :partnerId) " +
           "AND (:keyword IS NULL OR :keyword = '' OR LOWER(l.referenceCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR a.externalUserId LIKE CONCAT('%', :keyword, '%') OR LOWER(l.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY l.createdAt DESC")
    Page<LoyaltyPointLedgerEntity> findLedgerWithFilters(
            @Param("tenantId") String tenantId,
            @Param("externalUserId") String externalUserId,
            @Param("actionType") PointActionType actionType,
            @Param("partnerId") Long partnerId,
            @Param("keyword") String keyword,
            Pageable pageable);

    Optional<LoyaltyPointLedgerEntity> findByTenantIdAndReferenceCode(String tenantId, String referenceCode);

    boolean existsByTenantIdAndReferenceCode(String tenantId, String referenceCode);

    long countByTenantId(String tenantId);

    @Query("SELECT COALESCE(SUM(l.pointChange), 0) FROM LoyaltyPointLedgerEntity l WHERE l.tenantId = :tenantId AND l.changeType IN (com.natcash.loyalty.domain.enums.PointActionType.EARN, com.natcash.loyalty.domain.enums.PointActionType.ADJUST, com.natcash.loyalty.domain.enums.PointActionType.CASHBACK, com.natcash.loyalty.domain.enums.PointActionType.SPIN, com.natcash.loyalty.domain.enums.PointActionType.REWARD)")
    BigDecimal sumEarnedPoints(@Param("tenantId") String tenantId);

    @Query("SELECT COALESCE(SUM(l.pointChange), 0) FROM LoyaltyPointLedgerEntity l WHERE l.tenantId = :tenantId AND l.changeType IN (com.natcash.loyalty.domain.enums.PointActionType.BURN, com.natcash.loyalty.domain.enums.PointActionType.EXPIRE, com.natcash.loyalty.domain.enums.PointActionType.REVERSAL)")
    BigDecimal sumBurnedPoints(@Param("tenantId") String tenantId);

    @Query(value = "SELECT TO_CHAR(l.created_at, 'YYYY-MM-DD') AS day, " +
                   "COALESCE(SUM(CASE WHEN l.point_change > 0 THEN l.point_change ELSE 0 END), 0) AS earned, " +
                   "COALESCE(SUM(CASE WHEN l.point_change < 0 THEN ABS(l.point_change) ELSE 0 END), 0) AS burned, " +
                   "COUNT(l.id) AS tx_count " +
                   "FROM loyalty_point_ledger l " +
                   "WHERE l.tenant_id = :tenantId AND l.created_at >= :since " +
                   "GROUP BY TO_CHAR(l.created_at, 'YYYY-MM-DD') " +
                   "ORDER BY day ASC", nativeQuery = true)
    List<Object[]> getPointTrendsRaw(@Param("tenantId") String tenantId, @Param("since") Instant since);

    List<LoyaltyPointLedgerEntity> findTop500ByChangeTypeInAndExpiredAtBeforeAndExpiredAtIsNotNullOrderByIdAsc(
            Collection<PointActionType> changeTypes, Instant now);
}
