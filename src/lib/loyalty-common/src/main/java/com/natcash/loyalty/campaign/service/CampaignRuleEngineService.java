package com.natcash.loyalty.campaign.service;

import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ClaimRewardRequest;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ClaimRewardResponse;
import com.natcash.loyalty.campaign.entity.CampaignRuleConditionEntity;
import com.natcash.loyalty.campaign.entity.UserReferralEntity;
import com.natcash.loyalty.campaign.repository.CampaignRuleConditionRepository;
import com.natcash.loyalty.campaign.repository.UserReferralRepository;
import com.natcash.loyalty.codegeneration.domain.CodeType;
import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.ControlBucketGroup;
import com.natcash.loyalty.domain.enums.SponsorType;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.lock.DistributedLockHelper;

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
public class CampaignRuleEngineService {

    private final CampaignRuleConditionRepository ruleRepository;
    private final UserReferralRepository referralRepository;
    private final CampaignConflictDetector conflictDetector;
    private final ControlGroupService controlGroupService;
    private final MonthlyBudgetGuardService budgetGuardService;
    private final MilestoneService milestoneService;
    private final DistributedLockHelper lockHelper;

    @Transactional(readOnly = true)
    public List<CampaignRuleConditionEntity> listRules(String tenantId) {
        return ruleRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional
    public void deleteRule(String tenantId, Long id) {
        CampaignRuleConditionEntity entity = ruleRepository.findById(id)
                .filter(r -> tenantId.equals(r.getTenantId()))
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        ruleRepository.delete(entity);
    }

    @Transactional
    public Map<String, Object> saveRule(String tenantId, CampaignRuleConditionEntity request) {
        String code = request.getCampaignCode() != null && !request.getCampaignCode().isBlank()
                ? request.getCampaignCode().trim()
                : CentralizedCodeGeneratorService.get().generateCode(CodeType.CAMPAIGN_RULE);

        Instant start = request.getStartDate() != null ? request.getStartDate() : Instant.now();
        Instant end = request.getEndDate() != null ? request.getEndDate() : start.plus(30, ChronoUnit.DAYS);

        List<String> conflicts = conflictDetector.detectConflicts(
                tenantId, code, request.getMissionCategory(), request.getPartnerId(), start, end);

        CampaignRuleConditionEntity entity = ruleRepository.findByTenantIdAndCampaignCode(tenantId, code)
                .orElseGet(() -> CampaignRuleConditionEntity.builder()
                        .tenantId(tenantId)
                        .campaignCode(code)
                        .build());

        entity.setCampaignName(request.getCampaignName());
        entity.setMissionCategory(request.getMissionCategory());
        entity.setWhenEvent(request.getWhenEvent() != null ? request.getWhenEvent() : "{}");
        entity.setIfConditions(request.getIfConditions() != null ? request.getIfConditions() : "{}");
        entity.setThenRewards(request.getThenRewards() != null ? request.getThenRewards() : "{}");
        entity.setLimitsConfig(request.getLimitsConfig() != null ? request.getLimitsConfig() : "{}");
        entity.setSponsorType(request.getSponsorType() != null ? request.getSponsorType() : SponsorType.PLATFORM);
        entity.setPartnerId(request.getPartnerId());
        entity.setAudienceRole(request.getAudienceRole() != null && !request.getAudienceRole().isBlank()
                ? request.getAudienceRole().trim().toUpperCase()
                : "CUSTOMER");
        entity.setStartDate(start);
        entity.setEndDate(end);
        entity.setStatus(request.getStatus() != null ? request.getStatus() : CommonStatus.ACTIVE);

        CampaignRuleConditionEntity saved = ruleRepository.save(entity);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("rule", saved);
        result.put("conflictsDetected", conflicts);
        return result;
    }

    @Transactional
    public ClaimRewardResponse claimMilestoneWithGuard(
            String tenantId, Long milestoneId, String externalUserId, String campaignCode) {
        String effectiveCode = campaignCode != null && !campaignCode.isBlank()
                ? campaignCode
                : "MILESTONE_" + milestoneId;
        ControlBucketGroup bucket = controlGroupService.resolveBucket(tenantId, effectiveCode, externalUserId, null);
        if (bucket == ControlBucketGroup.CONTROL) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "User assigned to A/B Control Group");
        }

        String lockKey = RedisKeys.getMissionClaimLockKey(tenantId, milestoneId, externalUserId);
        return lockHelper.executeWithLock(lockKey, () -> {
            ClaimRewardResponse response = milestoneService.claimReward(tenantId, ClaimRewardRequest.builder()
                    .externalUserId(externalUserId)
                    .milestoneId(milestoneId)
                    .build());
            BigDecimal rewardPts = response.getRewardPoints() != null ? response.getRewardPoints() : BigDecimal.ZERO;
            budgetGuardService.checkAndConsume(tenantId, SponsorType.PLATFORM, rewardPts);
            return response;
        });
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMyReferrals(String tenantId, String externalUserId) {
        List<UserReferralEntity> referrals = referralRepository
                .findByTenantIdAndReferrerUserIdOrderByCreatedAtDesc(tenantId, externalUserId);
        long verifiedCount = referralRepository
                .countByTenantIdAndReferrerUserIdAndEkycVerifiedTrue(tenantId, externalUserId);
        BigDecimal totalEarned = referrals.stream()
                .map(r -> r.getRewardPoints() != null ? r.getRewardPoints() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("externalUserId", externalUserId);
        res.put("referralCode", "REF-" + externalUserId);
        res.put("ekycVerifiedCount", verifiedCount);
        res.put("totalRewardPoints", totalEarned);
        res.put("items", referrals);
        return res;
    }
}
