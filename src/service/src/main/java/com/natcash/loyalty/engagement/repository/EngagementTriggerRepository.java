package com.natcash.loyalty.engagement.repository;

import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.TriggerType;
import com.natcash.loyalty.engagement.entity.EngagementTriggerEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EngagementTriggerRepository extends JpaRepository<EngagementTriggerEntity, Long> {

    List<EngagementTriggerEntity> findByTenantIdAndStatus(String tenantId, CommonStatus status);

    Optional<EngagementTriggerEntity> findByTenantIdAndTriggerTypeAndStatus(
            String tenantId, TriggerType triggerType, CommonStatus status);
}
