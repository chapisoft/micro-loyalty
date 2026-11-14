package com.natcash.loyalty.wallet.repository;

import com.natcash.loyalty.domain.enums.HoldStatus;
import com.natcash.loyalty.wallet.entity.LoyaltyPaymentHoldEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyPaymentHoldRepository extends JpaRepository<LoyaltyPaymentHoldEntity, Long> {

    Optional<LoyaltyPaymentHoldEntity> findByTenantIdAndHoldCode(String tenantId, String holdCode);

    List<LoyaltyPaymentHoldEntity> findByTenantIdAndStatusAndExpiresAtBefore(String tenantId, HoldStatus status, Instant now);

    List<LoyaltyPaymentHoldEntity> findByTenantIdAndExternalUserIdAndStatus(String tenantId, String externalUserId, HoldStatus status);

    boolean existsByTenantIdAndHoldCode(String tenantId, String holdCode);
}
