package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.game.entity.WheelThemeEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WheelThemeRepository extends JpaRepository<WheelThemeEntity, Long> {

    List<WheelThemeEntity> findByTenantId(String tenantId);

    Optional<WheelThemeEntity> findByTenantIdAndThemeCode(String tenantId, String themeCode);

    Optional<WheelThemeEntity> findByTenantIdAndIsActiveTrue(String tenantId);
}
