package com.natcash.loyalty.auth.repository;

import com.natcash.loyalty.auth.entity.SystemRoleEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemRoleRepository extends JpaRepository<SystemRoleEntity, Long> {

    List<SystemRoleEntity> findByTenantIdOrderByIdAsc(String tenantId);

    Optional<SystemRoleEntity> findByIdAndTenantId(Long id, String tenantId);

    Optional<SystemRoleEntity> findByTenantIdAndCodeIgnoreCase(String tenantId, String code);
}
