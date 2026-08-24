package com.natcash.loyalty.account.repository;

import com.natcash.loyalty.account.entity.LoyaltyTierEntity;
import com.natcash.loyalty.domain.enums.TierLevel;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyTierRepository extends JpaRepository<LoyaltyTierEntity, Long> {

    Optional<LoyaltyTierEntity> findByTenantIdAndCode(String tenantId, TierLevel code);

    List<LoyaltyTierEntity> findByTenantId(String tenantId);

    List<LoyaltyTierEntity> findByTenantIdOrderByTierLevelAsc(String tenantId);

    Optional<LoyaltyTierEntity> findByTenantIdAndTierLevel(String tenantId, Integer tierLevel);
}
