package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.game.entity.LeaderboardPayoutEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaderboardPayoutRepository extends JpaRepository<LeaderboardPayoutEntity, Long> {

    List<LeaderboardPayoutEntity> findByTenantIdAndLeaderboardMonthOrderByBoardTypeAscRankPositionAsc(
            String tenantId, String leaderboardMonth);

    List<LeaderboardPayoutEntity> findByTenantIdOrderByLeaderboardMonthDescRankPositionAsc(String tenantId);

    Optional<LeaderboardPayoutEntity> findByTenantIdAndLeaderboardMonthAndBoardTypeAndExternalUserId(
            String tenantId, String leaderboardMonth, String boardType, String externalUserId);
}
