package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.game.entity.GamePrizeEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GamePrizeRepository extends JpaRepository<GamePrizeEntity, Long> {

    List<GamePrizeEntity> findByTenantIdAndGameCodeAndStatusOrderByDisplayOrderAsc(String tenantId, String gameCode, String status);

    List<GamePrizeEntity> findByTenantIdAndGameCodeOrderByDisplayOrderAsc(String tenantId, String gameCode);

    Optional<GamePrizeEntity> findByTenantIdAndGameCodeAndPrizeCode(String tenantId, String gameCode, String prizeCode);

    Optional<GamePrizeEntity> findByIdAndTenantId(Long id, String tenantId);
}
