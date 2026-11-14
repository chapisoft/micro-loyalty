package com.natcash.loyalty.campaign.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.natcash.loyalty.campaign.entity.AiCampaignSuggestionEntity;
import com.natcash.loyalty.campaign.repository.AiCampaignSuggestionRepository;
import com.natcash.loyalty.domain.enums.CampaignMissionCategory;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiCampaignCopilotService {

    private final AiCampaignSuggestionRepository suggestionRepository;
    private final CampaignConflictDetector conflictDetector;
    private final ObjectMapper objectMapper;

    @Transactional
    public AiCampaignSuggestionEntity suggestCampaign(
            String tenantId,
            String objective,
            String targetSegment,
            BigDecimal budgetCap,
            String createdBy) {
        CampaignMissionCategory recommendedCategory = inferCategory(objective);
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(30, ChronoUnit.DAYS);

        List<String> conflicts = conflictDetector.detectConflicts(
                tenantId, null, recommendedCategory, null, start, end);

        Map<String, Object> config = new LinkedHashMap<>();
        config.put("missionCategory", recommendedCategory);
        config.put("whenEvent", Map.of("event", recommendedCategory == CampaignMissionCategory.CROSS_SELL ? "BILL_PAY_UTILITY" : "QR_PAYMENT"));
        config.put("ifConditions", Map.of("segment", targetSegment != null ? targetSegment : "GENERAL", "minAmount", 150));
        config.put("thenRewards", Map.of("points", 150, "gameTurns", 2));
        config.put("limits", Map.of("maxPerUser", 3, "controlGroupPct", 5, "budgetCap", budgetCap != null ? budgetCap : new BigDecimal("500000")));

        BigDecimal roi = recommendedCategory == CampaignMissionCategory.CROSS_SELL
                ? new BigDecimal("185.00")
                : new BigDecimal("142.50");

        AiCampaignSuggestionEntity entity = AiCampaignSuggestionEntity.builder()
                .tenantId(tenantId)
                .objective(objective)
                .targetSegment(targetSegment != null ? targetSegment : "GENERAL")
                .budgetCap(budgetCap)
                .suggestedConfig(toJson(config))
                .conflictsDetected(toJson(conflicts))
                .estimatedRoiPct(roi)
                .createdBy(createdBy)
                .build();
        return suggestionRepository.save(entity);
    }

    private CampaignMissionCategory inferCategory(String objective) {
        if (objective == null) {
            return CampaignMissionCategory.TX_COUNT;
        }
        String lower = objective.toLowerCase();
        if (lower.contains("cross") || lower.contains("bill") || lower.contains("ch?o")) {
            return CampaignMissionCategory.CROSS_SELL;
        }
        if (lower.contains("win") || lower.contains("churn") || lower.contains("quay")) {
            return CampaignMissionCategory.WIN_BACK;
        }
        if (lower.contains("refer") || lower.contains("friend")) {
            return CampaignMissionCategory.REFERRAL;
        }
        if (lower.contains("first") || lower.contains("new")) {
            return CampaignMissionCategory.FIRST_TX;
        }
        return CampaignMissionCategory.TX_COUNT;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return "{}";
        }
    }
}
