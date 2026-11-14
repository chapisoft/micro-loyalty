package com.natcash.loyalty.engagement.service;

import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.engagement.entity.UserNotificationPreferenceEntity;
import com.natcash.loyalty.engagement.repository.UserNotificationPreferenceRepository;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.redisson.api.RAtomicLong;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.Locale;
import java.util.Optional;

@Service
public class EngagementAntiSpamFilter {

    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final UserNotificationPreferenceRepository preferenceRepository;
    private final RedissonClient redissonClient;

    @Autowired
    public EngagementAntiSpamFilter(
            UserNotificationPreferenceRepository preferenceRepository,
            @Autowired(required = false) RedissonClient redissonClient) {
        this.preferenceRepository = preferenceRepository;
        this.redissonClient = redissonClient;
    }

    public FilterDecision evaluate(
            String tenantId,
            String externalUserId,
            String scenarioCode,
            boolean isMarketing,
            Instant now) {
        Instant effectiveNow = now != null ? now : Instant.now();
        Optional<UserNotificationPreferenceEntity> prefOpt = preferenceRepository
                .findByTenantIdAndExternalUserId(tenantId, externalUserId);

        if (prefOpt.isPresent()) {
            UserNotificationPreferenceEntity pref = prefOpt.get();
            if (isMarketing && Boolean.TRUE.equals(pref.getOptOutMarketing())) {
                return FilterDecision.blocked("OPT_OUT_MARKETING");
            }
            if (Boolean.FALSE.equals(pref.getAllowPush())) {
                return FilterDecision.blocked("PUSH_DISABLED");
            }
        }

        SystemParameterService paramService = SystemParameterService.get();
        ZoneId targetZone = ZoneId.of(paramService.getString(tenantId, SystemParamSpec.ENGAGEMENT_TIMEZONE));
        boolean quietHoursEnabled = prefOpt.map(UserNotificationPreferenceEntity::getQuietHoursEnabled).orElse(Boolean.TRUE);
        if (quietHoursEnabled) {
            ZonedDateTime haitiTime = ZonedDateTime.ofInstant(effectiveNow, targetZone);
            if (paramService.isWithinTimeWindow(tenantId, SystemParamSpec.ENGAGEMENT_QUIET_HOURS, haitiTime.toLocalTime())) {
                return FilterDecision.blocked("QUIET_HOURS_20_08");
            }
        }

        if (redissonClient != null) {
            ZonedDateTime haitiTime = ZonedDateTime.ofInstant(effectiveNow, targetZone);
            String dayKey = RedisKeys.getPushDailyKey(tenantId, externalUserId, DAY_FMT.format(haitiTime));
            String weekKey = RedisKeys.getPushWeeklyKey(tenantId, externalUserId, resolveWeekKey(haitiTime));

            RAtomicLong dailyCounter = redissonClient.getAtomicLong(dayKey);
            if (dailyCounter.get() >= paramService.getInt(tenantId, SystemParamSpec.ENGAGEMENT_MAX_PUSH_PER_DAY)) {
                return FilterDecision.blocked("DAILY_CAP_EXCEEDED");
            }

            RAtomicLong weeklyCounter = redissonClient.getAtomicLong(weekKey);
            if (weeklyCounter.get() >= paramService.getInt(tenantId, SystemParamSpec.ENGAGEMENT_MAX_PUSH_PER_WEEK)) {
                return FilterDecision.blocked("WEEKLY_CAP_EXCEEDED");
            }

            if (scenarioCode != null && !scenarioCode.isBlank()) {
                RBucket<String> dedupBucket = redissonClient.getBucket(
                        RedisKeys.getEngagementDedupKey(tenantId, externalUserId, scenarioCode));
                if (dedupBucket.isExists()) {
                    return FilterDecision.blocked("DEDUPLICATION_COOLDOWN");
                }
            }
        }

        return FilterDecision.allowed();
    }

    public void recordDelivery(String tenantId, String externalUserId, String scenarioCode, Integer cooldownHours, Instant now) {
        if (redissonClient == null) {
            return;
        }
        SystemParameterService paramService = SystemParameterService.get();
        Instant effectiveNow = now != null ? now : Instant.now();
        ZonedDateTime haitiTime = ZonedDateTime.ofInstant(
                effectiveNow, ZoneId.of(paramService.getString(tenantId, SystemParamSpec.ENGAGEMENT_TIMEZONE)));

        RAtomicLong dailyCounter = redissonClient.getAtomicLong(
                RedisKeys.getPushDailyKey(tenantId, externalUserId, DAY_FMT.format(haitiTime)));
        if (dailyCounter.incrementAndGet() == 1L) {
            dailyCounter.expire(Duration.ofHours(24));
        }

        RAtomicLong weeklyCounter = redissonClient.getAtomicLong(
                RedisKeys.getPushWeeklyKey(tenantId, externalUserId, resolveWeekKey(haitiTime)));
        if (weeklyCounter.incrementAndGet() == 1L) {
            weeklyCounter.expire(Duration.ofDays(7));
        }

        if (scenarioCode != null && !scenarioCode.isBlank()) {
            int ttlHours = cooldownHours != null && cooldownHours > 0
                    ? cooldownHours
                    : paramService.getInt(tenantId, SystemParamSpec.ENGAGEMENT_DEDUP_WINDOW_HOURS);
            RBucket<String> dedupBucket = redissonClient.getBucket(
                    RedisKeys.getEngagementDedupKey(tenantId, externalUserId, scenarioCode));
            dedupBucket.set("1", Duration.ofHours(ttlHours));
        }
    }

    private String resolveWeekKey(ZonedDateTime zdt) {
        WeekFields wf = WeekFields.of(Locale.ROOT);
        int year = zdt.get(wf.weekBasedYear());
        int week = zdt.get(wf.weekOfWeekBasedYear());
        return year + "-W" + week;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FilterDecision {
        private boolean allowed;
        private String blockReason;

        public static FilterDecision allowed() {
            return FilterDecision.builder().allowed(true).build();
        }

        public static FilterDecision blocked(String reason) {
            return FilterDecision.builder().allowed(false).blockReason(reason).build();
        }
    }
}
