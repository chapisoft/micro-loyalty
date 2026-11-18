package com.natcash.loyalty.engagement.repository;

import com.natcash.loyalty.engagement.entity.PopupImpressionLogEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface PopupImpressionLogRepository extends JpaRepository<PopupImpressionLogEntity, Long> {

    boolean existsByTenantIdAndExternalUserIdAndShownAtAfter(String tenantId, String externalUserId, Instant since);
}
