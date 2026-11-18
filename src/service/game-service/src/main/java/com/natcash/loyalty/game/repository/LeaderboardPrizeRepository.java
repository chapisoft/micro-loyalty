package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.game.entity.LeaderboardPrizeEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaderboardPrizeRepository extends JpaRepository<LeaderboardPrizeEntity, Long> {

    List<LeaderboardPrizeEntity> findByTenantIdOrderByBoardTypeAscRankFromAsc(String tenantId);

    List<LeaderboardPrizeEntity> findByTenantIdAndBoardTypeAndStatusOrderByRankFromAsc(
            String tenantId, String boardType, String status);
}
