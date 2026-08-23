package com.natcash.loyalty.engagement;

import com.natcash.loyalty.account.dto.ProfileDto.NextTierProgress;
import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.TierLevel;
import com.natcash.loyalty.domain.enums.TriggerType;
import com.natcash.loyalty.engagement.dto.NudgeDto.InAppNudgeRequest;
import com.natcash.loyalty.engagement.dto.NudgeDto.InAppNudgeResponse;
import com.natcash.loyalty.engagement.entity.EngagementTriggerEntity;
import com.natcash.loyalty.engagement.repository.CommunicationLogRepository;
import com.natcash.loyalty.engagement.repository.EngagementTriggerRepository;
import com.natcash.loyalty.engagement.service.EngagementService;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EngagementServiceTest {

    @Mock
    private AccountService accountService;

    @Mock
    private EngagementTriggerRepository triggerRepository;

    @Mock
    private CommunicationLogRepository logRepository;

    @InjectMocks
    private EngagementService engagementService;

    @Test
    @DisplayName("BE-12.1: Sinh gợi nhắc thăng hạng khi tiến độ đạt trên 80%")
    void testGenerateUpgradeNudge() {
        NextTierProgress progress = NextTierProgress.builder()
                .nextTierCode(TierLevel.GOLD)
                .nextTierName("Hạng Vàng")
                .pointsNeeded(new BigDecimal("150.00"))
                .progressPercentage(85.0)
                .build();

        ProfileResponse profile = ProfileResponse.builder()
                .accountId(1L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("USER_01")
                .nextTierProgress(progress)
                .build();

        when(accountService.getOrCreateProfile(eq("TENANT_DELIMART"), any()))
                .thenReturn(profile);

        when(logRepository.existsByTenantIdAndExternalUserIdAndTriggerTypeAndSentAtAfter(
                eq("TENANT_DELIMART"), eq("USER_01"), eq(TriggerType.TIER_UPGRADE_NUDGE), any()))
                .thenReturn(false);

        EngagementTriggerEntity trigger = EngagementTriggerEntity.builder()
                .deepLinkUrl("/loyalty/tier-benefit")
                .build();

        when(triggerRepository.findByTenantIdAndTriggerTypeAndStatus("TENANT_DELIMART", TriggerType.TIER_UPGRADE_NUDGE, CommonStatus.ACTIVE))
                .thenReturn(Optional.of(trigger));

        InAppNudgeRequest request = InAppNudgeRequest.builder()
                .externalUserId("USER_01")
                .build();

        InAppNudgeResponse response = engagementService.getInAppNudges("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals(1, response.getTotalNudges());
        assertTrue(response.getNudges().get(0).getContent().contains("150.00"));
        verify(logRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("BE-12.2: Không gửi lại gợi nhắc nếu đã thông báo trong 24 giờ qua")
    void testDoNotSendDuplicateNudgeWithin24Hours() {
        NextTierProgress progress = NextTierProgress.builder()
                .nextTierCode(TierLevel.GOLD)
                .nextTierName("Hạng Vàng")
                .pointsNeeded(new BigDecimal("150.00"))
                .progressPercentage(85.0)
                .build();

        ProfileResponse profile = ProfileResponse.builder()
                .accountId(1L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("USER_01")
                .nextTierProgress(progress)
                .build();

        when(accountService.getOrCreateProfile(eq("TENANT_DELIMART"), any()))
                .thenReturn(profile);

        // Giả lập đã gửi tin trong 24h qua
        when(logRepository.existsByTenantIdAndExternalUserIdAndTriggerTypeAndSentAtAfter(
                eq("TENANT_DELIMART"), eq("USER_01"), eq(TriggerType.TIER_UPGRADE_NUDGE), any()))
                .thenReturn(true);

        InAppNudgeRequest request = InAppNudgeRequest.builder()
                .externalUserId("USER_01")
                .build();

        InAppNudgeResponse response = engagementService.getInAppNudges("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals(0, response.getTotalNudges());
        verify(logRepository, never()).save(any());
    }
}
