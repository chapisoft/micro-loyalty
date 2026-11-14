package com.natcash.loyalty.config.service;

import com.natcash.loyalty.config.LoyaltyProperties;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.entity.SystemParameterEntity;
import com.natcash.loyalty.config.repository.SystemParameterRepository;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.util.MessageUtils;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Dịch vụ đọc và quản trị Tham số Hệ thống với cơ chế bộ nhớ đệm 2 tầng (L1 In-Memory + L2 Redis).
 * Đảm bảo mọi luồng nghiệp vụ đọc cấu hình trực tiếp từ Cache, tuyệt đối không truy vấn lặp lại vào CSDL.
 */
@Slf4j
@Service
public class SystemParameterService {

    private static final long DEFAULT_CACHE_TTL_SECONDS = 3600L;
    private static final String CACHE_NULL_SENTINEL = "__NULL__";
    private static final SystemParameterService DEFAULT_INSTANCE = new SystemParameterService(null, null);
    private static volatile SystemParameterService instance;

    private final SystemParameterRepository systemParameterRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final ConcurrentHashMap<String, CachedParamEntry> localCache = new ConcurrentHashMap<>();

    @Autowired
    public SystemParameterService(
            SystemParameterRepository systemParameterRepository,
            @Autowired(required = false) StringRedisTemplate stringRedisTemplate) {
        this.systemParameterRepository = systemParameterRepository;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @PostConstruct
    void registerInstance() {
        instance = this;
        try {
            String defaultTenant = LoyaltyProperties.get().getTenant().getDefaultTenant();
            if (systemParameterRepository != null && defaultTenant != null && !defaultTenant.isBlank()) {
                preloadTenantCache(defaultTenant);
            }
        } catch (Exception ex) {
            log.warn("[SYS-PARAM-PRELOAD-SKIP] Unable to preload system parameters at startup: {}", ex.getMessage());
        }
    }

    @PreDestroy
    void clearInstance() {
        if (instance == this) {
            instance = null;
        }
    }

    public static SystemParameterService get() {
        return instance != null ? instance : DEFAULT_INSTANCE;
    }

    // =========================================================================
    // ĐỌC CẤU HÌNH QUA CACHE 2 TẦNG (L1 -> REDIS -> DB -> FALLBACK SPEC/PROPS)
    // =========================================================================

    public String getString(SystemParamSpec spec) {
        return getString(TenantContext.getTenantId(), spec);
    }

    public String getString(String tenantId, SystemParamSpec spec) {
        if (spec == null) {
            return "";
        }
        return getString(tenantId, spec.code(), resolveEffectiveDefault(spec));
    }

    public String getString(String tenantId, String paramKey, String defaultValue) {
        if (paramKey == null || paramKey.isBlank()) {
            return defaultValue;
        }
        String normalizedKey = paramKey.trim().toUpperCase();
        String effectiveTenant = resolveTenantId(tenantId);
        String l1Key = buildL1Key(effectiveTenant, normalizedKey);
        long nowMs = System.currentTimeMillis();

        // 1. Kiểm tra L1 In-Memory Cache
        CachedParamEntry cached = localCache.get(l1Key);
        if (cached != null && !cached.isExpired(nowMs)) {
            return cached.value != null ? cached.value : defaultValue;
        }

        // 2. Kiểm tra L2 Redis Cache
        long ttlSeconds = resolveCacheTtlSeconds(effectiveTenant, normalizedKey);
        String redisKey = RedisKeys.getSystemParamKey(effectiveTenant, normalizedKey);
        if (stringRedisTemplate != null) {
            try {
                String redisVal = stringRedisTemplate.opsForValue().get(redisKey);
                if (redisVal != null) {
                    String resolved = CACHE_NULL_SENTINEL.equals(redisVal) ? defaultValue : redisVal;
                    putL1Cache(l1Key, CACHE_NULL_SENTINEL.equals(redisVal) ? null : redisVal, ttlSeconds);
                    return resolved;
                }
            } catch (Exception ex) {
                log.debug("[SYS-PARAM-REDIS-READ-FAIL] tenant={}, key={}, err={}", effectiveTenant, normalizedKey, ex.getMessage());
            }
        }

        // 3. Cache Miss -> Truy vấn CSDL đúng 1 lần và nạp ngay vào Redis + L1 Cache
        String dbValue = null;
        if (systemParameterRepository != null) {
            try {
                Optional<SystemParameterEntity> entityOpt = systemParameterRepository
                        .findByTenantIdAndParamKeyIgnoreCase(effectiveTenant, normalizedKey);
                if (entityOpt.isPresent()) {
                    SystemParameterEntity entity = entityOpt.get();
                    if (entity.getStatus() == CommonStatus.ACTIVE
                            && entity.getParamValue() != null
                            && !entity.getParamValue().isBlank()) {
                        dbValue = entity.getParamValue().trim();
                    }
                }
            } catch (Exception ex) {
                log.warn("[SYS-PARAM-DB-READ-FAIL] tenant={}, key={}, err={}", effectiveTenant, normalizedKey, ex.getMessage());
            }
        }

        if (dbValue != null) {
            writeCacheBothTiers(effectiveTenant, normalizedKey, dbValue, ttlSeconds);
            return dbValue;
        }

        // Ghi nhận kết quả miss vào Cache (Sentinel) để không truy vấn lặp lại vào DB cho khóa chưa cấu hình
        if (systemParameterRepository != null) {
            writeCacheBothTiers(effectiveTenant, normalizedKey, null, ttlSeconds);
        } else {
            putL1Cache(l1Key, null, ttlSeconds);
        }
        return defaultValue;
    }

    public int getInt(SystemParamSpec spec) {
        return getInt(TenantContext.getTenantId(), spec);
    }

    public int getInt(String tenantId, SystemParamSpec spec) {
        String raw = getString(tenantId, spec);
        try {
            return Integer.parseInt(raw.trim());
        } catch (Exception ex) {
            return Integer.parseInt(resolveEffectiveDefault(spec));
        }
    }

    public long getLong(SystemParamSpec spec) {
        return getLong(TenantContext.getTenantId(), spec);
    }

    public long getLong(String tenantId, SystemParamSpec spec) {
        String raw = getString(tenantId, spec);
        try {
            return Long.parseLong(raw.trim());
        } catch (Exception ex) {
            return Long.parseLong(resolveEffectiveDefault(spec));
        }
    }

    public BigDecimal getDecimal(SystemParamSpec spec) {
        return getDecimal(TenantContext.getTenantId(), spec);
    }

    public BigDecimal getDecimal(String tenantId, SystemParamSpec spec) {
        String raw = getString(tenantId, spec);
        try {
            return new BigDecimal(raw.trim());
        } catch (Exception ex) {
            return new BigDecimal(resolveEffectiveDefault(spec));
        }
    }

    public boolean getBoolean(SystemParamSpec spec) {
        return getBoolean(TenantContext.getTenantId(), spec);
    }

    public boolean getBoolean(String tenantId, SystemParamSpec spec) {
        String raw = getString(tenantId, spec);
        return Boolean.parseBoolean(raw != null ? raw.trim() : spec.defaultValue());
    }

    /**
     * Đánh giá khung giờ dạng HH:mm-HH:mm (ví dụ: ENGAGEMENT_QUIET_HOURS = 20:00-08:00).
     */
    public boolean isWithinTimeWindow(String tenantId, SystemParamSpec spec, LocalTime targetTime) {
        if (targetTime == null) {
            return false;
        }
        String raw = getString(tenantId, spec);
        String[] parts = raw != null ? raw.trim().split("-") : new String[0];
        if (parts.length != 2) {
            return false;
        }
        try {
            LocalTime start = LocalTime.parse(parts[0].trim());
            LocalTime end = LocalTime.parse(parts[1].trim());
            if (start.equals(end)) {
                return true;
            }
            if (start.isAfter(end)) {
                return !targetTime.isBefore(start) || targetTime.isBefore(end);
            }
            return !targetTime.isBefore(start) && targetTime.isBefore(end);
        } catch (Exception ex) {
            log.warn("[SYS-PARAM-TIME-WINDOW-PARSE] key={}, value={}, err={}", spec.code(), raw, ex.getMessage());
            return false;
        }
    }

    // =========================================================================
    // QUẢN TRỊ ĐỒNG BỘ CMS & WRITE-THROUGH CACHE
    // =========================================================================

    @Transactional(readOnly = true)
    public List<SystemParameterItem> listParameters(String tenantId, String groupCode, String keyword) {
        String effectiveTenant = resolveTenantId(tenantId);
        List<SystemParameterEntity> entities = systemParameterRepository != null
                ? systemParameterRepository.findByTenantIdOrderByGroupCodeAscParamKeyAsc(effectiveTenant)
                : List.of();

        Map<String, SystemParameterItem> merged = new LinkedHashMap<>();

        // 1. Nạp trước toàn bộ tham số từ DB (kèm làm giàu metadata từ SystemParamSpec)
        for (SystemParameterEntity entity : entities) {
            SystemParamSpec spec = SystemParamSpec.findByCode(entity.getParamKey()).orElse(null);
            SystemParameterItem item = toItem(entity, spec);
            merged.put(item.getParamKey(), item);
            if (entity.getStatus() == CommonStatus.ACTIVE && entity.getParamValue() != null) {
                putL1Cache(buildL1Key(effectiveTenant, item.getParamKey()), entity.getParamValue().trim(),
                        DEFAULT_CACHE_TTL_SECONDS);
            }
        }

        // 2. Bổ sung các tham số chuẩn trong SystemParamSpec nếu tenant chưa có bản ghi riêng trong DB
        for (SystemParamSpec spec : SystemParamSpec.values()) {
            merged.computeIfAbsent(spec.code(), k -> SystemParameterItem.builder()
                    .paramKey(spec.code())
                    .paramName(spec.paramName())
                    .paramValue(resolveEffectiveDefault(spec))
                    .defaultValue(spec.defaultValue())
                    .valueType(spec.type().name())
                    .groupCode(spec.groupCode())
                    .allowedValues(spec.allowedValues())
                    .description(spec.description())
                    .status(1)
                    .fromDefault(true)
                    .build());
        }

        String filterGroup = groupCode != null && !groupCode.isBlank()
                && !LoyaltyConstants.FILTER_ALL.equalsIgnoreCase(groupCode.trim())
                ? groupCode.trim().toUpperCase()
                : null;
        String filterKw = keyword != null && !keyword.isBlank()
                ? keyword.trim().toLowerCase()
                : null;

        return merged.values().stream()
                .filter(item -> filterGroup == null || filterGroup.equalsIgnoreCase(item.getGroupCode()))
                .filter(item -> filterKw == null
                        || item.getParamKey().toLowerCase().contains(filterKw)
                        || (item.getParamName() != null && item.getParamName().toLowerCase().contains(filterKw))
                        || (item.getDescription() != null && item.getDescription().toLowerCase().contains(filterKw)))
                .toList();
    }

    @Transactional(readOnly = true)
    public SystemParameterItem getParameter(String tenantId, String paramKey) {
        String effectiveTenant = resolveTenantId(tenantId);
        String normalizedKey = paramKey != null ? paramKey.trim().toUpperCase() : "";
        Optional<SystemParameterEntity> opt = systemParameterRepository != null
                ? systemParameterRepository.findByTenantIdAndParamKeyIgnoreCase(effectiveTenant, normalizedKey)
                : Optional.empty();
        if (opt.isPresent()) {
            return toItem(opt.get(), SystemParamSpec.findByCode(normalizedKey).orElse(null));
        }
        SystemParamSpec spec = SystemParamSpec.findByCode(normalizedKey)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.params.not_found")));
        return SystemParameterItem.builder()
                .paramKey(spec.code())
                .paramName(spec.paramName())
                .paramValue(resolveEffectiveDefault(spec))
                .defaultValue(spec.defaultValue())
                .valueType(spec.type().name())
                .groupCode(spec.groupCode())
                .allowedValues(spec.allowedValues())
                .description(spec.description())
                .status(1)
                .fromDefault(true)
                .build();
    }

    @Transactional
    public SystemParameterItem createParameter(String tenantId, SystemParameterItem request) {
        if (request == null || request.getParamKey() == null || request.getParamKey().isBlank()
                || request.getParamValue() == null) {
            throw new LoyaltyException(
                    ErrorCode.VALIDATION_ERROR,
                    MessageUtils.getMessage("error.validation_error"));
        }

        String effectiveTenant = resolveTenantId(tenantId);
        String normalizedKey = request.getParamKey().trim().toUpperCase();
        if (systemParameterRepository.findByTenantIdAndParamKeyIgnoreCase(effectiveTenant, normalizedKey).isPresent()) {
            throw new LoyaltyException(
                    ErrorCode.TRANSACTION_DUPLICATE,
                    MessageUtils.getMessage("admin.params.key_exists"));
        }

        Optional<SystemParamSpec> specOpt = SystemParamSpec.findByCode(normalizedKey);
        String resolvedType = specOpt.map(s -> s.type().name())
                .orElseGet(() -> request.getValueType() != null && !request.getValueType().isBlank()
                        ? SystemParamSpec.ParamType.fromCode(request.getValueType()).name()
                        : LoyaltyProperties.get().getSystemParam().getDefaultValueType());
        String resolvedAllowed = request.getAllowedValues() != null && !request.getAllowedValues().isBlank()
                ? request.getAllowedValues().trim()
                : specOpt.map(SystemParamSpec::allowedValues).orElse(null);

        String validatedValue = SystemParamSpec.validateAndNormalize(
                normalizedKey, request.getParamValue(), resolvedType, resolvedAllowed);

        CommonStatus status = (request.getStatus() != null && request.getStatus() == 0)
                ? CommonStatus.INACTIVE
                : CommonStatus.ACTIVE;

        String resolvedGroup = request.getGroupCode() != null && !request.getGroupCode().isBlank()
                ? request.getGroupCode().trim().toUpperCase()
                : specOpt.map(SystemParamSpec::groupCode)
                        .orElse(LoyaltyProperties.get().getSystemParam().getDefaultGroupCode());
        String resolvedName = request.getParamName() != null && !request.getParamName().isBlank()
                ? request.getParamName().trim()
                : specOpt.map(SystemParamSpec::paramName).orElse(normalizedKey);
        String resolvedDesc = request.getDescription() != null && !request.getDescription().isBlank()
                ? request.getDescription().trim()
                : specOpt.map(SystemParamSpec::description).orElse(null);

        SystemParameterEntity saved = systemParameterRepository.save(SystemParameterEntity.builder()
                .tenantId(effectiveTenant)
                .paramKey(normalizedKey)
                .paramName(resolvedName)
                .paramValue(validatedValue)
                .valueType(resolvedType)
                .groupCode(resolvedGroup)
                .allowedValues(resolvedAllowed)
                .description(resolvedDesc)
                .status(status)
                .updatedBy(resolveCurrentActor())
                .build());

        syncCacheAfterMutation(saved);
        return toItem(saved, specOpt.orElse(null));
    }

    @Transactional
    public SystemParameterItem updateParameter(String tenantId, String paramKey, SystemParameterItem request) {
        String effectiveTenant = resolveTenantId(tenantId);
        String normalizedKey = paramKey != null ? paramKey.trim().toUpperCase() : "";
        Optional<SystemParamSpec> specOpt = SystemParamSpec.findByCode(normalizedKey);

        SystemParameterEntity existing = systemParameterRepository
                .findByTenantIdAndParamKeyIgnoreCase(effectiveTenant, normalizedKey)
                .orElseGet(() -> specOpt.map(spec -> SystemParameterEntity.builder()
                                .tenantId(effectiveTenant)
                                .paramKey(spec.code())
                                .paramName(spec.paramName())
                                .paramValue(resolveEffectiveDefault(spec))
                                .valueType(spec.type().name())
                                .groupCode(spec.groupCode())
                                .allowedValues(spec.allowedValues())
                                .description(spec.description())
                                .status(CommonStatus.ACTIVE)
                                .build())
                        .orElseThrow(() -> new LoyaltyException(
                                ErrorCode.RESOURCE_NOT_FOUND,
                                MessageUtils.getMessage("admin.params.not_found"))));

        if (request != null) {
            if (request.getValueType() != null && !request.getValueType().isBlank() && specOpt.isEmpty()) {
                existing.setValueType(SystemParamSpec.ParamType.fromCode(request.getValueType()).name());
            } else if (specOpt.isPresent()) {
                existing.setValueType(specOpt.get().type().name());
            }
            if (request.getAllowedValues() != null && !request.getAllowedValues().isBlank() && specOpt.isEmpty()) {
                existing.setAllowedValues(request.getAllowedValues().trim());
            }
            if (request.getParamName() != null && !request.getParamName().isBlank()) {
                existing.setParamName(request.getParamName().trim());
            }
            if (request.getDescription() != null) {
                existing.setDescription(request.getDescription().trim());
            }
            if (request.getGroupCode() != null && !request.getGroupCode().isBlank()) {
                existing.setGroupCode(request.getGroupCode().trim().toUpperCase());
            }
            if (request.getStatus() != null) {
                existing.setStatus(request.getStatus() == 0 ? CommonStatus.INACTIVE : CommonStatus.ACTIVE);
            }
            if (request.getParamValue() != null) {
                String validatedValue = SystemParamSpec.validateAndNormalize(
                        normalizedKey,
                        request.getParamValue(),
                        existing.getValueType(),
                        existing.getAllowedValues());
                existing.setParamValue(validatedValue);
            }
        }
        existing.setUpdatedBy(resolveCurrentActor());

        SystemParameterEntity saved = systemParameterRepository.save(existing);
        syncCacheAfterMutation(saved);
        return toItem(saved, specOpt.orElse(null));
    }

    @Transactional
    public void deleteParameter(String tenantId, String paramKey) {
        String effectiveTenant = resolveTenantId(tenantId);
        String normalizedKey = paramKey != null ? paramKey.trim().toUpperCase() : "";
        SystemParameterEntity existing = systemParameterRepository
                .findByTenantIdAndParamKeyIgnoreCase(effectiveTenant, normalizedKey)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.params.not_found")));
        systemParameterRepository.delete(existing);
        evictCache(effectiveTenant, normalizedKey);
    }

    @Transactional(readOnly = true)
    public int preloadTenantCache(String tenantId) {
        String effectiveTenant = resolveTenantId(tenantId);
        evictTenantLocalCache(effectiveTenant);
        if (systemParameterRepository == null) {
            return 0;
        }
        List<SystemParameterEntity> params = systemParameterRepository.findByTenantIdOrderByIdAsc(effectiveTenant);
        long ttlSeconds = DEFAULT_CACHE_TTL_SECONDS;
        for (SystemParameterEntity p : params) {
            if (SystemParamSpec.SYSTEM_CACHE_TTL_SECONDS.code().equalsIgnoreCase(p.getParamKey())
                    && p.getStatus() == CommonStatus.ACTIVE) {
                try {
                    ttlSeconds = Math.max(60L, Long.parseLong(p.getParamValue().trim()));
                } catch (Exception ignored) {
                    ttlSeconds = DEFAULT_CACHE_TTL_SECONDS;
                }
            }
        }
        int loaded = 0;
        for (SystemParameterEntity p : params) {
            if (p.getStatus() == CommonStatus.ACTIVE && p.getParamValue() != null) {
                writeCacheBothTiers(effectiveTenant, p.getParamKey().trim().toUpperCase(), p.getParamValue().trim(), ttlSeconds);
                loaded++;
            } else {
                evictCache(effectiveTenant, p.getParamKey().trim().toUpperCase());
            }
        }
        log.info("[SYS-PARAM-CACHE-PRELOAD] tenant={}, cachedCount={}, ttl={}s", effectiveTenant, loaded, ttlSeconds);
        return loaded;
    }

    public void evictCache(String tenantId, String paramKey) {
        String effectiveTenant = resolveTenantId(tenantId);
        String normalizedKey = paramKey != null ? paramKey.trim().toUpperCase() : "";
        localCache.remove(buildL1Key(effectiveTenant, normalizedKey));
        if (stringRedisTemplate != null) {
            try {
                stringRedisTemplate.delete(RedisKeys.getSystemParamKey(effectiveTenant, normalizedKey));
            } catch (Exception ex) {
                log.debug("[SYS-PARAM-REDIS-EVICT-FAIL] tenant={}, key={}, err={}", effectiveTenant, normalizedKey, ex.getMessage());
            }
        }
    }

    public List<Map<String, Object>> getSpecCatalog() {
        List<Map<String, Object>> catalog = new ArrayList<>();
        for (SystemParamSpec spec : SystemParamSpec.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("paramKey", spec.code());
            item.put("paramName", spec.paramName());
            item.put("groupCode", spec.groupCode());
            item.put("valueType", spec.type().name());
            item.put("defaultValue", spec.defaultValue());
            item.put("allowedValues", spec.allowedValues());
            item.put("description", spec.description());
            catalog.add(item);
        }
        return catalog;
    }

    // =========================================================================
    // HÀM NỘI BỘ BỘ NHỚ ĐỆM & ÁNH XẠ DỮ LIỆU
    // =========================================================================

    private void syncCacheAfterMutation(SystemParameterEntity saved) {
        String effectiveTenant = resolveTenantId(saved.getTenantId());
        String key = saved.getParamKey().trim().toUpperCase();
        if (saved.getStatus() == CommonStatus.ACTIVE) {
            long ttlSeconds = resolveCacheTtlSeconds(effectiveTenant, key);
            writeCacheBothTiers(effectiveTenant, key, saved.getParamValue(), ttlSeconds);
        } else {
            evictCache(effectiveTenant, key);
        }
    }

    private void writeCacheBothTiers(String tenantId, String key, String value, long ttlSeconds) {
        putL1Cache(buildL1Key(tenantId, key), value, ttlSeconds);
        if (stringRedisTemplate != null) {
            try {
                String redisVal = value != null ? value : CACHE_NULL_SENTINEL;
                stringRedisTemplate.opsForValue().set(
                        RedisKeys.getSystemParamKey(tenantId, key),
                        redisVal,
                        Duration.ofSeconds(Math.max(60L, ttlSeconds)));
            } catch (Exception ex) {
                log.debug("[SYS-PARAM-REDIS-WRITE-FAIL] tenant={}, key={}, err={}", tenantId, key, ex.getMessage());
            }
        }
    }

    private void putL1Cache(String l1Key, String value, long ttlSeconds) {
        long expiresAtMs = System.currentTimeMillis() + TimeUnit.SECONDS.toMillis(Math.max(60L, ttlSeconds));
        localCache.put(l1Key, new CachedParamEntry(value, expiresAtMs));
    }

    private void evictTenantLocalCache(String tenantId) {
        String prefix = tenantId + ":";
        localCache.keySet().removeIf(k -> k.startsWith(prefix));
    }

    private long resolveCacheTtlSeconds(String tenantId, String currentKey) {
        if (SystemParamSpec.SYSTEM_CACHE_TTL_SECONDS.code().equalsIgnoreCase(currentKey)) {
            return DEFAULT_CACHE_TTL_SECONDS;
        }
        String l1Key = buildL1Key(tenantId, SystemParamSpec.SYSTEM_CACHE_TTL_SECONDS.code());
        CachedParamEntry cached = localCache.get(l1Key);
        if (cached != null && !cached.isExpired(System.currentTimeMillis()) && cached.value != null) {
            try {
                return Math.max(60L, Long.parseLong(cached.value.trim()));
            } catch (Exception ignored) {
                return DEFAULT_CACHE_TTL_SECONDS;
            }
        }
        return DEFAULT_CACHE_TTL_SECONDS;
    }

    private String resolveTenantId(String tenantId) {
        if (tenantId != null && !tenantId.isBlank()) {
            return tenantId.trim();
        }
        String contextTenant = TenantContext.getTenantId();
        if (contextTenant != null && !contextTenant.isBlank()) {
            return contextTenant.trim();
        }
        return LoyaltyProperties.get().getTenant().getDefaultTenant();
    }

    private String buildL1Key(String tenantId, String key) {
        return tenantId + ":" + key;
    }

    private String resolveCurrentActor() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().isBlank()) {
                return auth.getName();
            }
        } catch (Exception ignored) {
            // Bỏ qua khi không có SecurityContext (ví dụ chạy batch/test)
        }
        return "SYSTEM";
    }

    /**
     * Đồng bộ dự phòng từ LoyaltyProperties (tệp etc/application.yml) sang SystemParamSpec khi DB chưa có bản ghi.
     */
    private String resolveEffectiveDefault(SystemParamSpec spec) {
        LoyaltyProperties props = LoyaltyProperties.get();
        return switch (spec) {
            case WALLET_DEFAULT_POINT_EXPIRATION_MONTHS ->
                    String.valueOf(props.getWallet().getDefaultPointExpirationMonths());
            case MAX_DAILY_BURN_PERCENTAGE ->
                    props.getWallet().getMaxBurnPercentPerBill().toPlainString();
            case REWARD_WALLET_DYNAMIC_QR_TTL_SECONDS ->
                    String.valueOf(props.getQr().getDefaultTtlSeconds());
            case HMAC_DRIFT_TOLERANCE_SECONDS ->
                    String.valueOf(props.getSecurity().getTimestampDriftToleranceSeconds());
            case REDISSON_LOCK_BURN_TIMEOUT_MS ->
                    String.valueOf(props.getLock().getWaitTimeMs());
            case REDISSON_LOCK_LEASE_TIME_MS ->
                    String.valueOf(props.getLock().getLeaseTimeMs());
            case REDISSON_LOCK_SHORT_LEASE_MS ->
                    String.valueOf(props.getLock().getShortLeaseTimeMs());
            case SESSION_TICKET_TTL_SECONDS ->
                    String.valueOf(props.getSession().getTicketTtlSeconds());
            case SESSION_ACCESS_TOKEN_TTL_SECONDS ->
                    String.valueOf(props.getSession().getAccessTokenTtlSeconds());
            case WEBHOOK_MAX_RETRIES ->
                    String.valueOf(props.getWebhook().getMaxRetries());
            case OUTBOX_BATCH_SIZE ->
                    String.valueOf(props.getOutbox().getBatchSize());
            case OUTBOX_PUBLISH_INTERVAL_MS ->
                    String.valueOf(props.getOutbox().getPublishIntervalMs());
            case ENGAGEMENT_QUIET_HOURS ->
                    String.format("%02d:00-%02d:00",
                            props.getEngagement().getQuietHoursStartHour(),
                            props.getEngagement().getQuietHoursEndHour());
            case ENGAGEMENT_TIMEZONE ->
                    props.getEngagement().getTimezone();
            case ENGAGEMENT_MAX_PUSH_PER_DAY ->
                    String.valueOf(props.getEngagement().getMaxPushPerDay());
            case ENGAGEMENT_MAX_PUSH_PER_WEEK ->
                    String.valueOf(props.getEngagement().getMaxPushPerWeek());
            case ENGAGEMENT_DEDUP_WINDOW_HOURS ->
                    String.valueOf(props.getEngagement().getDefaultDedupWindowHours());
            case BUDGET_ALERT_THRESHOLD_PERCENT ->
                    String.valueOf(props.getBudget().getAlertThresholdPercent());
            case BUDGET_HARD_STOP_PERCENT ->
                    String.valueOf(props.getBudget().getHardStopPercent());
            case PARTNER_API_KEY_GRACE_PERIOD_DAYS ->
                    String.valueOf(props.getPartner().getApiKeyGracePeriodDays());
            case PARTNER_LOOKBACK_DAYS ->
                    String.valueOf(props.getPartner().getLookbackDays());
            case PARTNER_TX_PAGE_SIZE ->
                    String.valueOf(props.getPartner().getTxPageSize());
            case PARTNER_RECENT_TX_LIMIT ->
                    String.valueOf(props.getPartner().getRecentTxLimit());
            case PARTNER_DEFAULT_MAX_BURN_PERCENT ->
                    props.getPartner().getDefaultMaxBurnPercent().toPlainString();
            case SETTLEMENT_CONFIRM_DEADLINE_DAYS ->
                    String.valueOf(props.getSettlement().getConfirmDeadlineDays());
            case SETTLEMENT_DEFAULT_MDR_FEE_PERCENT ->
                    props.getSettlement().getDefaultMdrFeePercent().toPlainString();
            case TIER_EXPIRY_WARNING_DAYS ->
                    String.valueOf(props.getTier().getExpiryWarningDays());
            case CAMPAIGN_DEFAULT_CONTROL_GROUP_PERCENT ->
                    String.valueOf(props.getCampaign().getDefaultControlGroupPercent());
            case LEARNING_TIER1_CORRECT ->
                    String.valueOf(props.getLearning().getTier1Correct());
            case LEARNING_TIER2_CORRECT ->
                    String.valueOf(props.getLearning().getTier2Correct());
            case LEARNING_TIER3_CORRECT ->
                    String.valueOf(props.getLearning().getTier3Correct());
            case AGENT_MONTHLY_NEW_CUSTOMER_TARGET ->
                    String.valueOf(props.getAgent().getMonthlyNewCustomerTarget());
            case AGENT_REWARD_HTG ->
                    String.valueOf(props.getAgent().getRewardHtg());
            case AGENT_SUPER_MIN_ACHIEVEMENT_PCT ->
                    String.valueOf(props.getAgent().getSuperAgentMinAchievementPct());
            case AGENT_SUPER_REWARD_HTG ->
                    String.valueOf(props.getAgent().getSuperAgentRewardHtg());
            case APPROVAL_POINT_ADJUSTMENT_MAX_LIMIT ->
                    props.getApproval().getDefaultPointAdjustmentMaxLimit().toPlainString();
            default -> spec.defaultValue();
        };
    }

    private SystemParameterItem toItem(SystemParameterEntity entity, SystemParamSpec spec) {
        return SystemParameterItem.builder()
                .id(entity.getId())
                .paramKey(entity.getParamKey())
                .paramName(entity.getParamName() != null && !entity.getParamName().isBlank()
                        ? entity.getParamName()
                        : (spec != null ? spec.paramName() : entity.getParamKey()))
                .paramValue(entity.getParamValue())
                .defaultValue(spec != null ? spec.defaultValue() : null)
                .valueType(spec != null ? spec.type().name() : entity.getValueType())
                .groupCode(entity.getGroupCode() != null && !entity.getGroupCode().isBlank()
                        ? entity.getGroupCode()
                        : (spec != null ? spec.groupCode() : LoyaltyProperties.get().getSystemParam().getDefaultGroupCode()))
                .allowedValues(entity.getAllowedValues() != null && !entity.getAllowedValues().isBlank()
                        ? entity.getAllowedValues()
                        : (spec != null ? spec.allowedValues() : null))
                .description(entity.getDescription() != null && !entity.getDescription().isBlank()
                        ? entity.getDescription()
                        : (spec != null ? spec.description() : null))
                .status(entity.getStatus() == CommonStatus.ACTIVE ? 1 : 0)
                .updatedBy(entity.getUpdatedBy())
                .fromDefault(false)
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null)
                .build();
    }

    private record CachedParamEntry(String value, long expiresAtMs) {
        boolean isExpired(long nowMs) {
            return nowMs >= expiresAtMs;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemParameterItem {
        private Long id;
        private String paramKey;
        private String paramName;
        private String paramValue;
        private String defaultValue;
        private String valueType;
        private String groupCode;
        private String allowedValues;
        private String description;
        private Integer status;
        private String updatedBy;
        private Boolean fromDefault;
        private String createdAt;
        private String updatedAt;
    }
}
