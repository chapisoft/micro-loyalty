package com.natcash.loyalty.engagement.repository;

import com.natcash.loyalty.engagement.entity.PopupRuleEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PopupRuleRepository extends JpaRepository<PopupRuleEntity, Long> {

    List<PopupRuleEntity> findByTenantIdOrderByPriorityAsc(String tenantId);

    List<PopupRuleEntity> findByTenantIdAndEnabledTrueAndStatusOrderByPriorityAsc(String tenantId, String status);

    Optional<PopupRuleEntity> findByTenantIdAndRuleCode(String tenantId, String ruleCode);
}
