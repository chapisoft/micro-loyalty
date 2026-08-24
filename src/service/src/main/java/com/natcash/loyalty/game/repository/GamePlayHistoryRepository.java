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
}
