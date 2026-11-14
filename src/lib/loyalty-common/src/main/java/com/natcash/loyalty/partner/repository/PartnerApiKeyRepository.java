package com.natcash.loyalty.partner.repository;

import com.natcash.loyalty.domain.enums.ApiKeyStatus;
import com.natcash.loyalty.partner.entity.PartnerApiKeyEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartnerApiKeyRepository extends JpaRepository<PartnerApiKeyEntity, Long> {

    List<PartnerApiKeyEntity> findByTenantIdAndPartnerIdOrderByCreatedAtDesc(String tenantId, Long partnerId);

    List<PartnerApiKeyEntity> findByTenantIdAndPartnerIdAndStatus(String tenantId, Long partnerId, ApiKeyStatus status);

    Optional<PartnerApiKeyEntity> findByIdAndTenantIdAndPartnerId(Long id, String tenantId, Long partnerId);
}
