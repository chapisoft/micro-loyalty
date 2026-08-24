package com.natcash.loyalty.campaign.repository;

import com.natcash.loyalty.campaign.entity.CampaignMilestoneEntity;
import com.natcash.loyalty.domain.enums.CommonStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface CampaignMilestoneRepository extends JpaRepository<CampaignMilestoneEntity, Long> {

    List<CampaignMilestoneEntity> findByTenantIdAndStatusAndStartDateBeforeAndEndDateAfterOrderByCampaignCodeAscMilestoneStepAsc(
            String tenantId, CommonStatus status, Instant now1, Instant now2);

    List<CampaignMilestoneEntity> findByTenantIdAndCampaignCodeOrderByMilestoneStepAsc(
            String tenantId, String campaignCode);
}
