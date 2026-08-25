package com.natcash.loyalty.integration.repository;

import com.natcash.loyalty.domain.enums.IntegrationType;
import com.natcash.loyalty.integration.entity.TenantIntegrationEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantIntegrationRepository extends JpaRepository<TenantIntegrationEntity, Long> {

    Optional<TenantIntegrationEntity> findByTenantIdAndIntegrationTypeAndIsActiveTrue(
            String tenantId, IntegrationType integrationType);

    Optional<TenantIntegrationEntity> findByTenantIdAndIntegrationType(
            String tenantId, IntegrationType integrationType);

    List<TenantIntegrationEntity> findByTenantId(String tenantId);

    List<TenantIntegrationEntity> findByTenantIdAndIsActiveTrue(String tenantId);
}
