package com.natcash.loyalty.engagement.repository;

import com.natcash.loyalty.engagement.entity.SystemAlertEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemAlertRepository extends JpaRepository<SystemAlertEntity, Long> {

    List<SystemAlertEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    List<SystemAlertEntity> findByTenantIdAndAcknowledgedOrderByCreatedAtDesc(String tenantId, Boolean acknowledged);

    Optional<SystemAlertEntity> findByIdAndTenantId(Long id, String tenantId);
}
