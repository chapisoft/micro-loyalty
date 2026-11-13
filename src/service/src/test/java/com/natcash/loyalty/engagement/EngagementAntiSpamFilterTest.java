package com.natcash.loyalty.engagement;

import com.natcash.loyalty.engagement.entity.UserNotificationPreferenceEntity;
import com.natcash.loyalty.engagement.repository.UserNotificationPreferenceRepository;
import com.natcash.loyalty.engagement.service.EngagementAntiSpamFilter;
import com.natcash.loyalty.engagement.service.EngagementAntiSpamFilter.FilterDecision;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RAtomicLong;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EngagementAntiSpamFilterTest {

    private static final String TENANT_ID = "TENANT_NATCASH";
    private static final String USER_ID = "50937123456";
    private static final ZoneId HAITI_ZONE = ZoneId.of("America/Port-au-Prince");

    @Mock
    private UserNotificationPreferenceRepository preferenceRepository;

    @Mock
    private RedissonClient redissonClient;

    @Test
    void evaluate_shouldBlockMarketingWhenOptOutEnabled() {
        EngagementAntiSpamFilter filter = new EngagementAntiSpamFilter(preferenceRepository, null);
        when(preferenceRepository.findByTenantIdAndExternalUserId(TENANT_ID, USER_ID))
                .thenReturn(Optional.of(UserNotificationPreferenceEntity.builder()
                        .optOutMarketing(true)
                        .allowPush(true)
                        .quietHoursEnabled(true)
                        .build()));

        Instant daytime = ZonedDateTime.of(2026, 6, 15, 14, 0, 0, 0, HAITI_ZONE).toInstant();
        FilterDecision decision = filter.evaluate(TENANT_ID, USER_ID, "PROMO_WINBACK", true, daytime);

        assertFalse(decision.isAllowed());
        assertEquals("OPT_OUT_MARKETING", decision.getBlockReason());
    }

    @Test
    void evaluate_shouldBlockDuringQuietHours20to08() {
        EngagementAntiSpamFilter filter = new EngagementAntiSpamFilter(preferenceRepository, null);
        when(preferenceRepository.findByTenantIdAndExternalUserId(TENANT_ID, USER_ID))
                .thenReturn(Optional.empty());

        Instant nightTime = ZonedDateTime.of(2026, 6, 15, 22, 30, 0, 0, HAITI_ZONE).toInstant();
        FilterDecision decision = filter.evaluate(TENANT_ID, USER_ID, "REMIND_POINTS", true, nightTime);

        assertFalse(decision.isAllowed());
        assertEquals("QUIET_HOURS_20_08", decision.getBlockReason());
    }

    @Test
    @SuppressWarnings("unchecked")
    void evaluate_shouldEnforceDailyWeeklyCapsAndDedup() {
        EngagementAntiSpamFilter filter = new EngagementAntiSpamFilter(preferenceRepository, redissonClient);
        when(preferenceRepository.findByTenantIdAndExternalUserId(TENANT_ID, USER_ID))
                .thenReturn(Optional.empty());

        RAtomicLong dailyCounter = mock(RAtomicLong.class);
        RAtomicLong weeklyCounter = mock(RAtomicLong.class);
        RBucket<Object> dedupBucket = mock(RBucket.class);

        when(redissonClient.getAtomicLong(anyString())).thenReturn(dailyCounter, weeklyCounter);
        when(dailyCounter.get()).thenReturn(1L);

        Instant daytime = ZonedDateTime.of(2026, 6, 15, 11, 0, 0, 0, HAITI_ZONE).toInstant();
        FilterDecision dailyBlocked = filter.evaluate(TENANT_ID, USER_ID, "SCENARIO_1", true, daytime);
        assertFalse(dailyBlocked.isAllowed());
        assertEquals("DAILY_CAP_EXCEEDED", dailyBlocked.getBlockReason());

        when(redissonClient.getAtomicLong(anyString())).thenReturn(dailyCounter, weeklyCounter);
        when(dailyCounter.get()).thenReturn(0L);
        when(weeklyCounter.get()).thenReturn(3L);
        FilterDecision weeklyBlocked = filter.evaluate(TENANT_ID, USER_ID, "SCENARIO_1", true, daytime);
        assertFalse(weeklyBlocked.isAllowed());
        assertEquals("WEEKLY_CAP_EXCEEDED", weeklyBlocked.getBlockReason());

        when(redissonClient.getAtomicLong(anyString())).thenReturn(dailyCounter, weeklyCounter);
        when(weeklyCounter.get()).thenReturn(1L);
        when(redissonClient.getBucket(anyString())).thenReturn(dedupBucket);
        when(dedupBucket.isExists()).thenReturn(true);
        FilterDecision dedupBlocked = filter.evaluate(TENANT_ID, USER_ID, "SCENARIO_1", true, daytime);
        assertFalse(dedupBlocked.isAllowed());
        assertEquals("DEDUPLICATION_COOLDOWN", dedupBlocked.getBlockReason());

        when(redissonClient.getAtomicLong(anyString())).thenReturn(dailyCounter, weeklyCounter);
        when(dedupBucket.isExists()).thenReturn(false);
        FilterDecision allowed = filter.evaluate(TENANT_ID, USER_ID, "SCENARIO_1", true, daytime);
        assertTrue(allowed.isAllowed());
    }
}
