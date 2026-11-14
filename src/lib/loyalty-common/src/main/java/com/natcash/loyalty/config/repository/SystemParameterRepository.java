package com.natcash.loyalty.config.repository;

import com.natcash.loyalty.config.entity.SystemParameterEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemParameterRepository extends JpaRepository<SystemParameterEntity, Long> {

    List<SystemParameterEntity> findByTenantIdOrderByIdAsc(String tenantId);

    List<SystemParameterEntity> findByTenantIdOrderByGroupCodeAscParamKeyAsc(String tenantId);

    Optional<SystemParameterEntity> findByTenantIdAndParamKeyIgnoreCase(String tenantId, String paramKey);
}
