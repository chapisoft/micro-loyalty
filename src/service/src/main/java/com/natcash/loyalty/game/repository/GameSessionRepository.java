package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.domain.enums.SessionStatus;
import com.natcash.loyalty.game.entity.GameSessionEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSessionEntity, Long> {

    Optional<GameSessionEntity> findByTenantIdAndSessionToken(String tenantId, String sessionToken);

    Optional<GameSessionEntity> findByTenantIdAndExternalUserIdAndGame_GameCodeAndStatus(
            String tenantId, String externalUserId, String gameCode, SessionStatus status);
}
