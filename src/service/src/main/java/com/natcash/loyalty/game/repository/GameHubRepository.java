package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.domain.enums.GameStatus;
import com.natcash.loyalty.game.entity.GameHubEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameHubRepository extends JpaRepository<GameHubEntity, Long> {

    List<GameHubEntity> findByTenantId(String tenantId);

    List<GameHubEntity> findByTenantIdAndStatus(String tenantId, GameStatus status);

    Optional<GameHubEntity> findByTenantIdAndGameCode(String tenantId, String gameCode);

    Optional<GameHubEntity> findByTenantIdAndId(String tenantId, Long id);
}
