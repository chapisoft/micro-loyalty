package com.natcash.loyalty.wheel.repository;

import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.wheel.entity.LuckyWheelEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LuckyWheelRepository extends JpaRepository<LuckyWheelEntity, Long> {

    Optional<LuckyWheelEntity> findByTenantIdAndWheelCodeAndStatus(String tenantId, String wheelCode, CommonStatus status);

    Optional<LuckyWheelEntity> findByTenantIdAndWheelCode(String tenantId, String wheelCode);
}
