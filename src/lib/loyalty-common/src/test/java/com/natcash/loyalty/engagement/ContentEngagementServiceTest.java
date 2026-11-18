package com.natcash.loyalty.engagement;

import com.natcash.loyalty.engagement.entity.PopupImpressionLogEntity;
import com.natcash.loyalty.engagement.entity.PopupRuleEntity;
import com.natcash.loyalty.engagement.entity.TargetedOfferEntity;
import com.natcash.loyalty.engagement.entity.UserInboxMessageEntity;
import com.natcash.loyalty.engagement.repository.CommunicationLogRepository;
import com.natcash.loyalty.engagement.repository.ContentBannerRepository;
import com.natcash.loyalty.engagement.repository.CustomerSegmentMemberRepository;
import com.natcash.loyalty.engagement.repository.PopupImpressionLogRepository;
import com.natcash.loyalty.engagement.repository.PopupRuleRepository;
import com.natcash.loyalty.engagement.repository.TargetedOfferRepository;
import com.natcash.loyalty.engagement.repository.UserInboxMessageRepository;
import com.natcash.loyalty.engagement.service.ContentEngagementService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContentEngagementServiceTest {

    @Mock
    private ContentBannerRepository bannerRepository;
    @Mock
    private PopupRuleRepository popupRuleRepository;
    @Mock
    private PopupImpressionLogRepository impressionLogRepository;
    @Mock
    private TargetedOfferRepository offerRepository;
    @Mock
    private CustomerSegmentMemberRepository segmentMemberRepository;
    @Mock
    private UserInboxMessageRepository inboxRepository;
    @Mock
    private CommunicationLogRepository commLogRepository;

    private ContentEngagementService service;

    @BeforeEach
    void setUp() {
        service = new ContentEngagementService(
                bannerRepository, popupRuleRepository, impressionLogRepository,
                offerRepository, segmentMemberRepository, inboxRepository, commLogRepository);
    }

    @Test
    @DisplayName("GĐ5-1: Không hiển thị popup ngoài khung giờ 08:00-20:00")
    void suppressPopupOutsideHours() {
        Map<String, Object> res = service.resolveStartupPopup("TENANT_NATCASH", "USER_1", true, 1, 1, 22);

        assertNull(res.get("popup"));
        assertEquals("OUTSIDE_TIME_WINDOW", res.get("suppressedReason"));
        verify(impressionLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("GĐ5-2: Chặn hiển thị lặp lại trong vòng 24 giờ")
    void suppressPopupWithin24hCooldown() {
        when(impressionLogRepository.existsByTenantIdAndExternalUserIdAndShownAtAfter(
                eq("TENANT_NATCASH"), eq("USER_1"), any(Instant.class)))
                .thenReturn(true);

        Map<String, Object> res = service.resolveStartupPopup("TENANT_NATCASH", "USER_1", true, 1, 1, 10);

        assertNull(res.get("popup"));
        assertEquals("COOLDOWN_24H", res.get("suppressedReason"));
        verify(impressionLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("GĐ5-3: Chọn đúng 1 popup theo thứ tự ưu tiên (Thưởng chờ nhận > Voucher sắp hết hạn)")
    void pickHighestPriorityPopupAndLogImpression() {
        when(impressionLogRepository.existsByTenantIdAndExternalUserIdAndShownAtAfter(
                eq("TENANT_NATCASH"), eq("USER_1"), any(Instant.class)))
                .thenReturn(false);
        when(segmentMemberRepository.findByTenantIdAndExternalUserId("TENANT_NATCASH", "USER_1"))
                .thenReturn(List.of());

        PopupRuleEntity r1 = PopupRuleEntity.builder()
                .ruleCode("REWARD_READY").popupType("REWARD_READY").priority(1)
                .title("Reward waiting").segmentCode("ALL").windowStartHour(8).windowEndHour(20).enabled(true).status("ACTIVE").build();
        PopupRuleEntity r2 = PopupRuleEntity.builder()
                .ruleCode("VOUCHER_EXPIRING").popupType("VOUCHER_EXPIRING").priority(2).thresholdDays(3)
                .title("Voucher expiring").segmentCode("ALL").windowStartHour(8).windowEndHour(20).enabled(true).status("ACTIVE").build();

        when(popupRuleRepository.findByTenantIdAndEnabledTrueAndStatusOrderByPriorityAsc("TENANT_NATCASH", "ACTIVE"))
                .thenReturn(List.of(r1, r2));

        Map<String, Object> res = service.resolveStartupPopup("TENANT_NATCASH", "USER_1", true, 2, 1, 14);

        PopupRuleEntity chosen = (PopupRuleEntity) res.get("popup");
        assertNotNull(chosen);
        assertEquals("REWARD_READY", chosen.getRuleCode());
        verify(impressionLogRepository, times(1)).save(any(PopupImpressionLogEntity.class));
    }

    @Test
    @DisplayName("GĐ5-4: Gửi Targeted Offer đẩy vào Inbox và Push log")
    void sendTargetedOfferWritesInboxAndPush() {
        TargetedOfferEntity offer = TargetedOfferEntity.builder()
                .id(5L).tenantId("TENANT_NATCASH").offerCode("OFF_DELI")
                .title("50 HTG at Delimart").body("Just for you").channels("INBOX,PUSH").deepLink("/rewards").sentCount(0).build();
        when(offerRepository.findById(5L)).thenReturn(Optional.of(offer));

        Map<String, Object> res = service.sendTargetedOffer("TENANT_NATCASH", 5L, List.of("USER_A", "USER_B"));

        assertEquals(2, res.get("deliveredCount"));
        assertEquals("SENT", res.get("status"));
        verify(inboxRepository, times(2)).save(any(UserInboxMessageEntity.class));
        verify(commLogRepository, times(2)).save(any());
    }
}
