package com.natcash.loyalty.engagement.repository;

import com.natcash.loyalty.domain.enums.TriggerType;
import com.natcash.loyalty.engagement.entity.CommunicationLogEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface CommunicationLogRepository extends JpaRepository<CommunicationLogEntity, Long> {

    List<CommunicationLogEntity> findByTenantIdAndExternalUserIdOrderBySentAtDesc(
            String tenantId, String externalUserId);

    boolean existsByTenantIdAndExternalUserIdAndTriggerTypeAndSentAtAfter(
            String tenantId, String externalUserId, TriggerType triggerType, Instant sentAfter);
}
