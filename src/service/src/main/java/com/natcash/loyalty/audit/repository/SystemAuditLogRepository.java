package com.natcash.loyalty.audit.repository;

import com.natcash.loyalty.audit.entity.SystemAuditLogEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemAuditLogRepository extends JpaRepository<SystemAuditLogEntity, Long>, JpaSpecificationExecutor<SystemAuditLogEntity> {

    long countByTenantId(String tenantId);
}
