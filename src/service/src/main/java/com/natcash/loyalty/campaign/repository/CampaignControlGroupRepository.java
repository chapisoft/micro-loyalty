package com.natcash.loyalty.campaign.repository;

import com.natcash.loyalty.campaign.entity.CampaignControlGroupEntity;
import com.natcash.loyalty.domain.enums.ControlBucketGroup;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CampaignControlGroupRepository extends JpaRepository<CampaignControlGroupEntity, Long> {

    Optional<CampaignControlGroupEntity> findByTenantIdAndCampaignCodeAndExternalUserId(
            String tenantId, String campaignCode, String externalUserId);

    long countByTenantIdAndCampaignCodeAndBucketGroup(
            String tenantId, String campaignCode, ControlBucketGroup bucketGroup);
}
