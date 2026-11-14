package com.natcash.loyalty.account.repository;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.domain.enums.CommonStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyAccountRepository extends JpaRepository<LoyaltyAccountEntity, Long> {

    Optional<LoyaltyAccountEntity> findByTenantIdAndExternalUserId(String tenantId, String externalUserId);

    List<LoyaltyAccountEntity> findByTenantId(String tenantId);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, CommonStatus status);

    @Query("SELECT a.tier.id, a.tier.code, a.tier.name, a.tier.tierLevel, a.tier.pointMultiplier, COUNT(a.id) " +
           "FROM LoyaltyAccountEntity a " +
           "WHERE a.tenantId = :tenantId AND a.tier IS NOT NULL " +
           "GROUP BY a.tier.id, a.tier.code, a.tier.name, a.tier.tierLevel, a.tier.pointMultiplier " +
           "ORDER BY a.tier.tierLevel ASC")
    List<Object[]> countMembersByTier(@Param("tenantId") String tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM LoyaltyAccountEntity a WHERE a.tenantId = :tenantId AND a.externalUserId = :externalUserId")
    Optional<LoyaltyAccountEntity> findByTenantIdAndExternalUserIdForUpdate(
            @Param("tenantId") String tenantId,
            @Param("externalUserId") String externalUserId);
}
