package com.natcash.loyalty.game.repository;

import com.natcash.loyalty.game.entity.GamePointRuleEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GamePointRuleRepository extends JpaRepository<GamePointRuleEntity, Long> {

    List<GamePointRuleEntity> findByTenantIdOrderBySourceCodeAsc(String tenantId);

    Optional<GamePointRuleEntity> findByTenantIdAndSourceCode(String tenantId, String sourceCode);
}
