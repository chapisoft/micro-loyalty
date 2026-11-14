package com.natcash.loyalty.config;

import com.natcash.loyalty.config.entity.SystemParameterEntity;
import com.natcash.loyalty.config.repository.SystemParameterRepository;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.config.service.SystemParameterService.SystemParameterItem;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.exception.LoyaltyException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemParameterServiceTest {

    private static final String TENANT = "NATCASH";

    @Mock
    private SystemParameterRepository systemParameterRepository;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private SystemParameterService service;

    @BeforeEach
    void setUp() {
        lenient().when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        service = new SystemParameterService(systemParameterRepository, stringRedisTemplate);
    }

    @Test
    void shouldCacheDbValueInL1AndRedisAcrossRepeatedReads() {
        String key = SystemParamSpec.MAX_DAILY_BURN_PERCENTAGE.code();
        String redisKey = RedisKeys.getSystemParamKey(TENANT, key);

        when(valueOperations.get(redisKey)).thenReturn(null);
        when(systemParameterRepository.findByTenantIdAndParamKeyIgnoreCase(TENANT, key))
                .thenReturn(Optional.of(SystemParameterEntity.builder()
                        .id(1L)
                        .tenantId(TENANT)
                        .paramKey(key)
                        .paramValue("75.00")
                        .valueType("DECIMAL")
                        .groupCode("POLICY")
                        .status(CommonStatus.ACTIVE)
                        .build()));

        BigDecimal first = service.getDecimal(TENANT, SystemParamSpec.MAX_DAILY_BURN_PERCENTAGE);
        BigDecimal second = service.getDecimal(TENANT, SystemParamSpec.MAX_DAILY_BURN_PERCENTAGE);
        BigDecimal third = service.getDecimal(TENANT, SystemParamSpec.MAX_DAILY_BURN_PERCENTAGE);

        assertEquals(0, new BigDecimal("75.00").compareTo(first));
        assertEquals(0, new BigDecimal("75.00").compareTo(second));
        assertEquals(0, new BigDecimal("75.00").compareTo(third));
        verify(systemParameterRepository, times(1)).findByTenantIdAndParamKeyIgnoreCase(TENANT, key);
        verify(valueOperations, times(1)).set(eq(redisKey), eq("75.00"), any(Duration.class));
    }

    @Test
    void shouldReadFromRedisL2CacheOnL1MissWithoutQueryingDatabase() {
        String key = SystemParamSpec.MAX_DAILY_BURN_PERCENTAGE.code();
        String redisKey = RedisKeys.getSystemParamKey(TENANT, key);

        when(valueOperations.get(redisKey)).thenReturn("65.50");

        BigDecimal result = service.getDecimal(TENANT, SystemParamSpec.MAX_DAILY_BURN_PERCENTAGE);

        assertEquals(0, new BigDecimal("65.50").compareTo(result));
        verify(systemParameterRepository, never()).findByTenantIdAndParamKeyIgnoreCase(TENANT, key);
    }

    @Test
    void shouldUpdateCacheImmediatelyOnWriteThroughUpdateAndDelete() {
        String key = SystemParamSpec.CLEARING_AUTO_SETTLE_ENABLED.code();
        String redisKey = RedisKeys.getSystemParamKey(TENANT, key);
        String ttlRedisKey = RedisKeys.getSystemParamKey(TENANT, SystemParamSpec.SYSTEM_CACHE_TTL_SECONDS.code());
        lenient().when(valueOperations.get(ttlRedisKey)).thenReturn("3600");

        SystemParameterEntity entity = SystemParameterEntity.builder()
                .id(10L)
                .tenantId(TENANT)
                .paramKey(key)
                .paramValue("true")
                .valueType("BOOLEAN")
                .groupCode("SETTLEMENT")
                .status(CommonStatus.ACTIVE)
                .build();
        when(systemParameterRepository.findByTenantIdAndParamKeyIgnoreCase(TENANT, key))
                .thenReturn(Optional.of(entity));
        when(systemParameterRepository.save(any(SystemParameterEntity.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        SystemParameterItem updated = service.updateParameter(
                TENANT,
                key,
                SystemParameterItem.builder().paramValue("false").build());

        assertEquals("false", updated.getParamValue());
        assertFalse(service.getBoolean(TENANT, SystemParamSpec.CLEARING_AUTO_SETTLE_ENABLED));
        verify(valueOperations, times(1)).set(eq(redisKey), eq("false"), any(Duration.class));

        service.deleteParameter(TENANT, key);
        verify(stringRedisTemplate, times(1)).delete(redisKey);
    }

    @Test
    void shouldValidateAndNormalizeAllSupportedParamTypes() {
        assertEquals("true", SystemParamSpec.validateAndNormalize(
                SystemParamSpec.CLEARING_AUTO_SETTLE_ENABLED.code(), " TRUE ", null, null));
        assertEquals("120", SystemParamSpec.validateAndNormalize(
                SystemParamSpec.REWARD_WALLET_DYNAMIC_QR_TTL_SECONDS.code(), " 120 ", null, null));
        assertEquals("2.50", SystemParamSpec.validateAndNormalize(
                SystemParamSpec.LOYALTY_POINT_EXCHANGE_RATE_HTG.code(), "2.50", null, null));
        assertEquals("MAINTENANCE", SystemParamSpec.validateAndNormalize(
                SystemParamSpec.SYSTEM_OPERATION_MODE.code(), "maintenance", null, null));
        assertEquals("21:00-07:30", SystemParamSpec.validateAndNormalize(
                SystemParamSpec.ENGAGEMENT_QUIET_HOURS.code(), " 21:00-07:30 ", null, null));
        assertEquals("{\"enablePartnerPortal\":true}", SystemParamSpec.validateAndNormalize(
                SystemParamSpec.FEATURE_FLAGS_JSON.code(), "{ \"enablePartnerPortal\" : true }", null, null));

        assertValidationError(SystemParamSpec.CLEARING_AUTO_SETTLE_ENABLED.code(), "yes");
        assertValidationError(SystemParamSpec.REWARD_WALLET_DYNAMIC_QR_TTL_SECONDS.code(), "12.5");
        assertValidationError(SystemParamSpec.LOYALTY_POINT_EXCHANGE_RATE_HTG.code(), "not-a-number");
        assertValidationError(SystemParamSpec.SYSTEM_OPERATION_MODE.code(), "UNKNOWN_MODE");
        assertValidationError(SystemParamSpec.ENGAGEMENT_QUIET_HOURS.code(), "25:00-08:00");
        assertValidationError(SystemParamSpec.FEATURE_FLAGS_JSON.code(), "{broken_json");
    }

    @Test
    void shouldEvaluateOvernightAndDaytimeTimeWindowsAccurately() {
        String key = SystemParamSpec.ENGAGEMENT_QUIET_HOURS.code();
        String redisKey = RedisKeys.getSystemParamKey(TENANT, key);
        String ttlRedisKey = RedisKeys.getSystemParamKey(TENANT, SystemParamSpec.SYSTEM_CACHE_TTL_SECONDS.code());
        lenient().when(valueOperations.get(ttlRedisKey)).thenReturn("3600");

        when(valueOperations.get(redisKey)).thenReturn("20:00-08:00");
        assertTrue(service.isWithinTimeWindow(TENANT, SystemParamSpec.ENGAGEMENT_QUIET_HOURS, LocalTime.of(22, 30)));
        assertTrue(service.isWithinTimeWindow(TENANT, SystemParamSpec.ENGAGEMENT_QUIET_HOURS, LocalTime.of(3, 15)));
        assertTrue(service.isWithinTimeWindow(TENANT, SystemParamSpec.ENGAGEMENT_QUIET_HOURS, LocalTime.of(20, 0)));
        assertFalse(service.isWithinTimeWindow(TENANT, SystemParamSpec.ENGAGEMENT_QUIET_HOURS, LocalTime.of(8, 0)));
        assertFalse(service.isWithinTimeWindow(TENANT, SystemParamSpec.ENGAGEMENT_QUIET_HOURS, LocalTime.of(12, 0)));

        SystemParameterEntity daytimeEntity = SystemParameterEntity.builder()
                .id(20L)
                .tenantId(TENANT)
                .paramKey(key)
                .paramValue("09:00-17:00")
                .valueType("TIME_WINDOW")
                .status(CommonStatus.ACTIVE)
                .build();
        when(systemParameterRepository.findByTenantIdAndParamKeyIgnoreCase(TENANT, key))
                .thenReturn(Optional.of(daytimeEntity));
        when(systemParameterRepository.save(any(SystemParameterEntity.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        service.updateParameter(TENANT, key, SystemParameterItem.builder().paramValue("09:00-17:00").build());

        assertTrue(service.isWithinTimeWindow(TENANT, SystemParamSpec.ENGAGEMENT_QUIET_HOURS, LocalTime.of(10, 0)));
        assertFalse(service.isWithinTimeWindow(TENANT, SystemParamSpec.ENGAGEMENT_QUIET_HOURS, LocalTime.of(8, 59)));
        assertFalse(service.isWithinTimeWindow(TENANT, SystemParamSpec.ENGAGEMENT_QUIET_HOURS, LocalTime.of(17, 0)));
    }

    private void assertValidationError(String code, String badValue) {
        LoyaltyException ex = assertThrows(
                LoyaltyException.class,
                () -> SystemParamSpec.validateAndNormalize(code, badValue, null, null));
        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
    }
}
