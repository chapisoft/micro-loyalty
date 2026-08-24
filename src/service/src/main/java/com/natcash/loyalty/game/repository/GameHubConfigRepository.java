package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.game.entity.GameHubConfigEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameHubConfigRepository extends JpaRepository<GameHubConfigEntity, Long> {

    Optional<GameHubConfigEntity> findByTenantId(String tenantId);
}
