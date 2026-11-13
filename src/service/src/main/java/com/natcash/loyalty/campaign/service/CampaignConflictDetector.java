package com.natcash.loyalty.campaign.service;

import com.natcash.loyalty.campaign.entity.CampaignRuleConditionEntity;
import com.natcash.loyalty.campaign.repository.CampaignRuleConditionRepository;
import com.natcash.loyalty.domain.enums.CampaignMissionCategory;
import com.natcash.loyalty.domain.enums.CommonStatus;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class CampaignConflictDetector {

    private final CampaignRuleConditionRepository ruleRepository;

    public List<String> detectConflicts(
            String tenantId,
            String candidateCode,
            CampaignMissionCategory category,
            Long partnerId,
            Instant startDate,
            Instant endDate) {
        List<CampaignRuleConditionEntity> activeRules = ruleRepository.findByTenantIdAndStatus(tenantId, CommonStatus.ACTIVE);
        List<String> conflicts = new ArrayList<>();
        if (activeRules == null || startDate == null || endDate == null) {
            return conflicts;
        }
        for (CampaignRuleConditionEntity rule : activeRules) {
            if (candidateCode != null && candidateCode.equalsIgnoreCase(rule.getCampaignCode())) {
                continue;
            }
            boolean overlaps = !endDate.isBefore(rule.getStartDate()) && !startDate.isAfter(rule.getEndDate());
            boolean sameCategory = category != null && category == rule.getMissionCategory();
            boolean samePartner = Objects.equals(partnerId, rule.getPartnerId());
            if (overlaps && sameCategory && samePartner) {
                conflicts.add("Overlap with active rule " + rule.getCampaignCode()
                        + " (" + rule.getMissionCategory() + ")");
            }
        }
        return conflicts;
    }
}
