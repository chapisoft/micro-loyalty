package com.natcash.loyalty.campaign.repository;

import com.natcash.loyalty.campaign.entity.CampaignMilestoneEntity;
import com.natcash.loyalty.domain.enums.CommonStatus;

import com.natcash.loyalty.domain.enums.CampaignMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignMilestoneRepository extends JpaRepository<CampaignMilestoneEntity, Long> {

    List<CampaignMilestoneEntity> findByTenantIdOrderByCampaignCodeAscMilestoneStepAsc(String tenantId);

    List<CampaignMilestoneEntity> findByTenantIdAndPartnerIdOrderByCampaignCodeAscMilestoneStepAsc(String tenantId, Long partnerId);

    List<CampaignMilestoneEntity> findByTenantIdAndStatusAndStartDateBeforeAndEndDateAfterOrderByCampaignCodeAscMilestoneStepAsc(
            String tenantId, CommonStatus status, Instant now1, Instant now2);

    @Query("SELECT m FROM CampaignMilestoneEntity m " +
           "WHERE m.tenantId = :tenantId AND m.status = :status " +
           "AND m.startDate <= :now AND m.endDate >= :now " +
           "AND m.targetMetric = :metric " +
           "AND (m.partnerId IS NULL OR (:partnerId IS NOT NULL AND m.partnerId = :partnerId))")
    List<CampaignMilestoneEntity> findActiveMilestonesForTracking(
            @Param("tenantId") String tenantId,
            @Param("status") CommonStatus status,
            @Param("now") Instant now,
            @Param("metric") CampaignMetric metric,
            @Param("partnerId") Long partnerId);

    List<CampaignMilestoneEntity> findByTenantIdAndCampaignCodeOrderByMilestoneStepAsc(
            String tenantId, String campaignCode);

    Optional<CampaignMilestoneEntity> findByTenantIdAndCampaignCodeAndMilestoneStep(
            String tenantId, String campaignCode, Integer milestoneStep);

    Optional<CampaignMilestoneEntity> findByIdAndTenantId(Long id, String tenantId);
}

