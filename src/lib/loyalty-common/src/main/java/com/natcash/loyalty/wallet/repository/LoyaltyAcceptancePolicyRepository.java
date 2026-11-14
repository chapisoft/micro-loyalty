package com.natcash.loyalty.wallet.repository;

import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.wallet.entity.LoyaltyAcceptancePolicyEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyAcceptancePolicyRepository extends JpaRepository<LoyaltyAcceptancePolicyEntity, Long> {

    List<LoyaltyAcceptancePolicyEntity> findByTenantId(String tenantId);

    List<LoyaltyAcceptancePolicyEntity> findByTenantIdAndStatus(String tenantId, CommonStatus status);

    Optional<LoyaltyAcceptancePolicyEntity> findByTenantIdAndPartnerId(String tenantId, Long partnerId);

    Optional<LoyaltyAcceptancePolicyEntity> findByIdAndTenantId(Long id, String tenantId);
}
