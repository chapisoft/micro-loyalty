package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.game.entity.GamePointLedgerEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface GamePointLedgerRepository extends JpaRepository<GamePointLedgerEntity, Long> {

    @Query("SELECT COALESCE(SUM(l.ptsAwarded), 0) FROM GamePointLedgerEntity l "
            + "WHERE l.tenantId = :tenantId AND l.externalUserId = :userId "
            + "AND l.sourceCode = :sourceCode AND l.earnedDate = :earnedDate")
    Integer sumDailyPoints(@Param("tenantId") String tenantId,
                           @Param("userId") String userId,
                           @Param("sourceCode") String sourceCode,
                           @Param("earnedDate") LocalDate earnedDate);
}
