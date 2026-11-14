package com.natcash.loyalty.campaign.repository;

import com.natcash.loyalty.campaign.entity.AiCampaignSuggestionEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiCampaignSuggestionRepository extends JpaRepository<AiCampaignSuggestionEntity, Long> {

    List<AiCampaignSuggestionEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId);
}
