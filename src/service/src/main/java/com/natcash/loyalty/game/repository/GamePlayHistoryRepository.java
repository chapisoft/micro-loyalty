package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.game.entity.GamePlayHistoryEntity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GamePlayHistoryRepository extends JpaRepository<GamePlayHistoryEntity, Long> {

    List<GamePlayHistoryEntity> findByTenantIdAndExternalUserIdOrderByCreatedAtDesc(String tenantId, String externalUserId);

    Page<GamePlayHistoryEntity> findByTenantIdAndExternalUserIdOrderByCreatedAtDesc(String tenantId, String externalUserId, Pageable pageable);

    Page<GamePlayHistoryEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId, Pageable pageable);

    Optional<GamePlayHistoryEntity> findByTransactionRef(String transactionRef);

    long countByTenantIdAndExternalUserIdAndGameCode(String tenantId, String externalUserId, String gameCode);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(h) FROM GamePlayHistoryEntity h WHERE h.tenantId = :tenantId AND h.createdAt >= :start AND h.createdAt < :end")
    long countByTenantIdAndCreatedAtRange(@org.springframework.data.repository.query.Param("tenantId") String tenantId,
                                         @org.springframework.data.repository.query.Param("start") java.time.Instant start,
                                         @org.springframework.data.repository.query.Param("end") java.time.Instant end);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(h.rewardValue), 0) FROM GamePlayHistoryEntity h WHERE h.tenantId = :tenantId AND h.createdAt >= :start AND h.createdAt < :end")
    java.math.BigDecimal sumRewardValueByTenantIdAndCreatedAtRange(@org.springframework.data.repository.query.Param("tenantId") String tenantId,
                                                                   @org.springframework.data.repository.query.Param("start") java.time.Instant start,
                                                                   @org.springframework.data.repository.query.Param("end") java.time.Instant end);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT h.externalUserId) FROM GamePlayHistoryEntity h WHERE h.tenantId = :tenantId AND h.createdAt >= :start AND h.createdAt < :end")
    long countUniquePlayersByTenantIdAndCreatedAtRange(@org.springframework.data.repository.query.Param("tenantId") String tenantId,
                                                      @org.springframework.data.repository.query.Param("start") java.time.Instant start,
                                                      @org.springframework.data.repository.query.Param("end") java.time.Instant end);
}
