package com.natcash.loyalty.account.repository;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface LoyaltyAccountRepository extends JpaRepository<LoyaltyAccountEntity, Long> {

    Optional<LoyaltyAccountEntity> findByTenantIdAndExternalUserId(String tenantId, String externalUserId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM LoyaltyAccountEntity a WHERE a.tenantId = :tenantId AND a.externalUserId = :externalUserId")
    Optional<LoyaltyAccountEntity> findByTenantIdAndExternalUserIdForUpdate(
            @Param("tenantId") String tenantId,
            @Param("externalUserId") String externalUserId);
}
