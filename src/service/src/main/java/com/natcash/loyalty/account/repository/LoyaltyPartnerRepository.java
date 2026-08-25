package com.natcash.loyalty.account.repository;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.domain.enums.CommonStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyPartnerRepository extends JpaRepository<LoyaltyPartnerEntity, Long> {

    List<LoyaltyPartnerEntity> findByTenantId(String tenantId);

    List<LoyaltyPartnerEntity> findByTenantIdAndStatus(String tenantId, CommonStatus status);

    Optional<LoyaltyPartnerEntity> findByTenantIdAndPartnerCode(String tenantId, String partnerCode);

    Optional<LoyaltyPartnerEntity> findByTenantIdAndApiKey(String tenantId, String apiKey);

    Optional<LoyaltyPartnerEntity> findByIdAndTenantId(Long id, String tenantId);
}
