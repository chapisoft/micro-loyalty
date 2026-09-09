package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.domain.enums.GameStatus;
import com.natcash.loyalty.game.entity.GameHubEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameHubRepository extends JpaRepository<GameHubEntity, Long> {

    List<GameHubEntity> findByTenantId(String tenantId);

    List<GameHubEntity> findByTenantIdAndStatus(String tenantId, GameStatus status);

    Optional<GameHubEntity> findByTenantIdAndGameCode(String tenantId, String gameCode);

    Optional<GameHubEntity> findByTenantIdAndId(String tenantId, Long id);

    Optional<GameHubEntity> findByGameCode(String gameCode);

    @Query("SELECT COALESCE(SUM(g.dailyBudgetLimit), 0) FROM GameHubEntity g WHERE g.tenantId = :tenantId AND g.status = com.natcash.loyalty.domain.enums.GameStatus.ACTIVE")
    BigDecimal sumDailyBudgetLimitByTenantId(@Param("tenantId") String tenantId);
}

