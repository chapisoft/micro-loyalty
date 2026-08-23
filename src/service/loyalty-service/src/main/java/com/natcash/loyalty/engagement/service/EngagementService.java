package com.natcash.loyalty.engagement.service;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileRequest;
import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.domain.enums.TriggerType;
import com.natcash.loyalty.engagement.dto.NudgeDto.InAppNudgeRequest;
import com.natcash.loyalty.engagement.dto.NudgeDto.InAppNudgeResponse;
import com.natcash.loyalty.engagement.dto.NudgeDto.NudgeItemDto;
import com.natcash.loyalty.engagement.entity.CommunicationLogEntity;
import com.natcash.loyalty.engagement.entity.EngagementTriggerEntity;
import com.natcash.loyalty.engagement.repository.CommunicationLogRepository;
import com.natcash.loyalty.engagement.repository.EngagementTriggerRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class EngagementService {

    private static final Logger log = LoggerFactory.getLogger(EngagementService.class);

    private final AccountService accountService;
    private final EngagementTriggerRepository triggerRepository;
    private final CommunicationLogRepository logRepository;

    public EngagementService(AccountService accountService,
                             EngagementTriggerRepository triggerRepository,
                             CommunicationLogRepository logRepository) {
        this.accountService = accountService;
        this.triggerRepository = triggerRepository;
        this.logRepository = logRepository;
    }

    @Transactional
    public InAppNudgeResponse getInAppNudges(String tenantId, InAppNudgeRequest request) {
        String userId = request.getExternalUserId();
        ProfileResponse profile = accountService.getOrCreateProfile(tenantId,
                ProfileRequest.builder().externalUserId(userId).build());

        List<NudgeItemDto> nudges = new ArrayList<>();
        Instant oneDayAgo = Instant.now().minus(24, ChronoUnit.HOURS);

        // 1. Kiểm tra kịch bản Gợi nhắc Thăng hạng (TIER_UPGRADE_NUDGE)
        if (profile.getNextTierProgress() != null && profile.getNextTierProgress().getProgressPercentage() != null) {
            double progress = profile.getNextTierProgress().getProgressPercentage();
            if (progress >= 80.0 && progress < 100.0) {
                boolean alreadyNotified = logRepository.existsByTenantIdAndExternalUserIdAndTriggerTypeAndSentAtAfter(
                        tenantId, userId, TriggerType.TIER_UPGRADE_NUDGE, oneDayAgo);

                if (!alreadyNotified) {
                    Optional<EngagementTriggerEntity> triggerOpt = triggerRepository
                            .findByTenantIdAndTriggerTypeAndStatus(tenantId, TriggerType.TIER_UPGRADE_NUDGE, "ACTIVE");

                    String nextTierName = profile.getNextTierProgress().getNextTierName();
                    String pointsNeeded = profile.getNextTierProgress().getPointsNeeded().toPlainString();
                    String message = String.format("Bạn chỉ còn thiếu %s điểm để thăng hạng %s và nhận thêm nhiều ưu đãi độc quyền!",
                            pointsNeeded, nextTierName);

                    String deepLink = triggerOpt.map(EngagementTriggerEntity::getDeepLinkUrl).orElse("/loyalty/tier-benefit");

                    nudges.add(NudgeItemDto.builder()
                            .id(1L)
                            .triggerType(TriggerType.TIER_UPGRADE_NUDGE)
                            .title("Sắp Đạt Hạng " + nextTierName)
                            .content(message)
                            .deepLinkUrl(deepLink)
                            .priority("HIGH")
                            .timestamp(Instant.now())
                            .build());

                    // Lưu log giao tiếp chống spam
                    CommunicationLogEntity commLog = CommunicationLogEntity.builder()
                            .tenantId(tenantId)
                            .accountId(profile.getAccountId())
                            .externalUserId(userId)
                            .triggerType(TriggerType.TIER_UPGRADE_NUDGE)
                            .channel("IN_APP")
                            .title("Sắp Đạt Hạng " + nextTierName)
                            .content(message)
                            .sentAt(Instant.now())
                            .isRead(false)
                            .build();
                    logRepository.save(commLog);

                    log.info("[ENGAGEMENT-NUDGE] tenantId={}, user={}, type=TIER_UPGRADE_NUDGE, progress={}%",
                            tenantId, userId, progress);
                }
            }
        }

        return InAppNudgeResponse.builder()
                .nudges(nudges)
                .totalNudges(nudges.size())
                .build();
    }
}
