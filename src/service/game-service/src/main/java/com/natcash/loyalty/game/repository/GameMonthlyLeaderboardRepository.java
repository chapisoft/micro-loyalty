package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.game.entity.GameMonthlyLeaderboardEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameMonthlyLeaderboardRepository extends JpaRepository<GameMonthlyLeaderboardEntity, Long> {

    List<GameMonthlyLeaderboardEntity> findTop50ByTenantIdAndLeaderboardMonthOrderByTotalScoreDesc(
            String tenantId, String leaderboardMonth);

    Optional<GameMonthlyLeaderboardEntity> findByTenantIdAndLeaderboardMonthAndExternalUserId(
            String tenantId, String leaderboardMonth, String externalUserId);
}
