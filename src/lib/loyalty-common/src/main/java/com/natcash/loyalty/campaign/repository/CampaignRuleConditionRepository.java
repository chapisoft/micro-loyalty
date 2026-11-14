package com.natcash.loyalty.campaign.repository;

import com.natcash.loyalty.campaign.entity.CampaignRuleConditionEntity;
import com.natcash.loyalty.domain.enums.CommonStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignRuleConditionRepository extends JpaRepository<CampaignRuleConditionEntity, Long> {

    List<CampaignRuleConditionEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    List<CampaignRuleConditionEntity> findByTenantIdAndStatus(String tenantId, CommonStatus status);

    Optional<CampaignRuleConditionEntity> findByTenantIdAndCampaignCode(String tenantId, String campaignCode);
}
