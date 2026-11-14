package com.natcash.loyalty.codegeneration.service;

import com.natcash.loyalty.codegeneration.domain.CodeType;
import com.natcash.loyalty.codegeneration.entity.SysCodeTypeEntity;
import com.natcash.loyalty.codegeneration.port.GenerateCodeUseCase;
import com.natcash.loyalty.codegeneration.repository.SysCodeTypeRepository;
import com.natcash.loyalty.constant.ErrorCode;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Dịch vụ sinh mã nghiệp vụ có cấu trúc tập trung từ CSDL (sys_code_types) kết hợp Cache và Hi-Lo RAM Buffer.
 * Khi cấu trúc thay đổi từ CMS, cache cấu hình được làm mới tức thời.
 */
@Slf4j
@Service
public class CentralizedCodeGeneratorService implements GenerateCodeUseCase {

    private static final Pattern SEQ_PLACEHOLDER_PATTERN = Pattern.compile("\\{seq(?::(\\d+))?}");
    private static final CentralizedCodeGeneratorService DEFAULT_INSTANCE =
            new CentralizedCodeGeneratorService(null, new PostgresSequenceAllocator(null));
    private static volatile CentralizedCodeGeneratorService instance;

    private final SysCodeTypeRepository sysCodeTypeRepository;
    private final PostgresSequenceAllocator sequenceAllocator;
    private final ConcurrentHashMap<String, SysCodeTypeEntity> configCache = new ConcurrentHashMap<>();

    @Autowired
    public CentralizedCodeGeneratorService(
            SysCodeTypeRepository sysCodeTypeRepository,
            PostgresSequenceAllocator sequenceAllocator) {
        this.sysCodeTypeRepository = sysCodeTypeRepository;
        this.sequenceAllocator = sequenceAllocator != null
                ? sequenceAllocator
                : new PostgresSequenceAllocator(null);
    }

    @PostConstruct
    void registerInstance() {
        instance = this;
        try {
            preloadConfigCache();
        } catch (Exception ex) {
            log.warn("[CODE-GEN-PRELOAD-SKIP] Unable to preload sys_code_types at startup: {}", ex.getMessage());
        }
    }

    @PreDestroy
    void clearInstance() {
        if (instance == this) {
            instance = null;
        }
    }

    public static CentralizedCodeGeneratorService get() {
        return instance != null ? instance : DEFAULT_INSTANCE;
    }

    @Override
    public String generateCode(CodeType type) {
        return generateCode(type, Collections.emptyMap());
    }

    @Override
    public String generateCode(CodeType type, Map<String, String> params) {
        if (type == null) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, MessageUtils.getMessage("error.validation_error"));
        }
        SysCodeTypeEntity config = resolveConfig(type);
        int batchSize = config.getBatchAllocationSize() != null && config.getBatchAllocationSize() > 0
                ? config.getBatchAllocationSize()
                : 50;
        long seqValue = sequenceAllocator.nextSequence(config.getSeqName(), batchSize);
        return renderTemplate(config, seqValue, params);
    }

    /**
     * Xem trước cấu trúc mã theo dữ liệu mẫu (không tiêu hao Sequence trong CSDL).
     */
    public String previewCode(String codeTypeCode, SysCodeTypeDto overrideRequest, Map<String, String> sampleParams) {
        CodeType type = CodeType.fromCode(codeTypeCode)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.codetype.not_found")));

        SysCodeTypeEntity base = resolveConfig(type);
        SysCodeTypeEntity effective = SysCodeTypeEntity.builder()
                .codeType(base.getCodeType())
                .description(base.getDescription())
                .formatTemplate(overrideRequest != null && hasText(overrideRequest.getFormatTemplate())
                        ? overrideRequest.getFormatTemplate().trim()
                        : base.getFormatTemplate())
                .staticPrefix(overrideRequest != null && hasText(overrideRequest.getStaticPrefix())
                        ? overrideRequest.getStaticPrefix().trim().toUpperCase()
                        : base.getStaticPrefix())
                .dateFormat(overrideRequest != null && hasText(overrideRequest.getDateFormat())
                        ? overrideRequest.getDateFormat().trim()
                        : base.getDateFormat())
                .seqPadding(overrideRequest != null && overrideRequest.getSeqPadding() != null
                        ? Math.max(1, Math.min(overrideRequest.getSeqPadding(), 12))
                        : base.getSeqPadding())
                .seqName(base.getSeqName())
                .batchAllocationSize(base.getBatchAllocationSize())
                .build();

        return renderTemplate(effective, 1L, sampleParams);
    }

    // =========================================================================
    // QUẢN TRỊ CẤU TRÚC SINH MÃ CHO CMS & ĐỒNG BỘ CACHE
    // =========================================================================

    @Transactional(readOnly = true)
    public List<SysCodeTypeDto> listAllCodeTypes() {
        Map<String, SysCodeTypeEntity> merged = new LinkedHashMap<>();
        if (sysCodeTypeRepository != null) {
            for (SysCodeTypeEntity entity : sysCodeTypeRepository.findAllByOrderByCodeTypeAsc()) {
                merged.put(entity.getCodeType(), entity);
                configCache.put(entity.getCodeType(), entity);
            }
        }
        for (CodeType type : CodeType.values()) {
            merged.computeIfAbsent(type.name(), k -> defaultEntity(type));
        }

        List<SysCodeTypeDto> result = new ArrayList<>(merged.size());
        for (SysCodeTypeEntity entity : merged.values()) {
            result.add(toDto(entity));
        }
        return result;
    }

    @Transactional
    public SysCodeTypeDto updateCodeType(String codeTypeCode, SysCodeTypeDto request) {
        CodeType enumType = CodeType.fromCode(codeTypeCode)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.codetype.not_found")));

        SysCodeTypeEntity entity = sysCodeTypeRepository.findByCodeTypeIgnoreCase(enumType.name())
                .orElseGet(() -> defaultEntity(enumType));

        if (request != null) {
            if (hasText(request.getDescription())) {
                entity.setDescription(request.getDescription().trim());
            }
            if (hasText(request.getFormatTemplate())) {
                String template = request.getFormatTemplate().trim();
                if (!template.contains("{seq")) {
                    throw new LoyaltyException(
                            ErrorCode.VALIDATION_ERROR,
                            MessageUtils.getMessage("admin.codetype.template_missing_seq"));
                }
                entity.setFormatTemplate(template);
            }
            if (hasText(request.getStaticPrefix())) {
                entity.setStaticPrefix(request.getStaticPrefix().trim().toUpperCase());
            }
            if (hasText(request.getDateFormat())) {
                String df = request.getDateFormat().trim();
                try {
                    DateTimeFormatter.ofPattern(df).withZone(ZoneOffset.UTC).format(Instant.now());
                } catch (Exception ex) {
                    throw new LoyaltyException(
                            ErrorCode.VALIDATION_ERROR,
                            MessageUtils.getMessage("admin.codetype.invalid_date_format", df));
                }
                entity.setDateFormat(df);
            }
            if (request.getSeqPadding() != null) {
                int padding = Math.max(1, Math.min(request.getSeqPadding(), 12));
                entity.setSeqPadding(padding);
            }
            if (request.getBatchAllocationSize() != null) {
                int batchSize = Math.max(1, Math.min(request.getBatchAllocationSize(), 50));
                entity.setBatchAllocationSize(batchSize);
            }
            if (request.getStatus() != null) {
                entity.setStatus(request.getStatus() == 0 ? CommonStatus.INACTIVE : CommonStatus.ACTIVE);
            }
        }

        SysCodeTypeEntity saved = sysCodeTypeRepository.save(entity);
        configCache.put(saved.getCodeType().toUpperCase(), saved);
        log.info("[CODE-TYPE-UPDATED] codeType={}, prefix={}, template={}",
                saved.getCodeType(), saved.getStaticPrefix(), saved.getFormatTemplate());
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public int preloadConfigCache() {
        configCache.clear();
        if (sysCodeTypeRepository == null) {
            return 0;
        }
        List<SysCodeTypeEntity> all = sysCodeTypeRepository.findAllByOrderByCodeTypeAsc();
        for (SysCodeTypeEntity entity : all) {
            if (entity.getCodeType() != null) {
                configCache.put(entity.getCodeType().toUpperCase(), entity);
            }
        }
        log.info("[CODE-TYPE-CACHE-PRELOAD] cachedCount={}", configCache.size());
        return configCache.size();
    }

    // =========================================================================
    // KẾT XUẤT KHUÔN MẪU & CẤP PHÁT NỘI BỘ
    // =========================================================================

    private SysCodeTypeEntity resolveConfig(CodeType type) {
        String key = type.name();
        SysCodeTypeEntity cached = configCache.get(key);
        if (cached != null) {
            return cached;
        }

        SysCodeTypeEntity loaded = null;
        if (sysCodeTypeRepository != null) {
            try {
                Optional<SysCodeTypeEntity> opt = sysCodeTypeRepository.findByCodeTypeIgnoreCase(key);
                if (opt.isPresent() && opt.get().getStatus() == CommonStatus.ACTIVE) {
                    loaded = opt.get();
                }
            } catch (Exception ex) {
                log.warn("[CODE-TYPE-DB-READ-FAIL] codeType={}, err={}", key, ex.getMessage());
            }
        }

        SysCodeTypeEntity effective = loaded != null ? loaded : defaultEntity(type);
        configCache.put(key, effective);
        return effective;
    }

    private SysCodeTypeEntity defaultEntity(CodeType type) {
        return SysCodeTypeEntity.builder()
                .codeType(type.name())
                .description(type.getDefaultDescription())
                .formatTemplate(type.getDefaultTemplate())
                .staticPrefix(type.getDefaultPrefix())
                .dateFormat(type.getDefaultDateFormat())
                .seqPadding(type.getDefaultPadding())
                .seqName(type.getDefaultSeqName())
                .seqIsParamScoped(Boolean.FALSE)
                .batchAllocationSize(50)
                .immutableAfterCreate(Boolean.TRUE)
                .status(CommonStatus.ACTIVE)
                .build();
    }

    private String renderTemplate(SysCodeTypeEntity config, long seqValue, Map<String, String> params) {
        Map<String, String> safeParams = params != null ? params : Collections.emptyMap();
        Instant now = Instant.now();

        String datePattern = hasText(config.getDateFormat()) ? config.getDateFormat() : "yyyyMMdd";
        String formattedDate;
        try {
            formattedDate = DateTimeFormatter.ofPattern(datePattern).withZone(ZoneOffset.UTC).format(now);
        } catch (Exception ex) {
            formattedDate = DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneOffset.UTC).format(now);
        }

        String periodRaw = safeParams.get("period");
        String periodValue = hasText(periodRaw)
                ? sanitizeToken(periodRaw.replace("-", ""))
                : DateTimeFormatter.ofPattern("yyyyMM").withZone(ZoneOffset.UTC).format(now);

        String tenantRaw = safeParams.get("tenant");
        String tenantValue = hasText(tenantRaw)
                ? sanitizeToken(tenantRaw)
                : sanitizeToken(TenantContext.getTenantId());

        String scopeValue = hasText(safeParams.get("scope"))
                ? sanitizeToken(safeParams.get("scope"))
                : "DEFAULT";

        String kindValue = hasText(safeParams.get("kind"))
                ? sanitizeToken(safeParams.get("kind"))
                : "STD";

        String result = config.getFormatTemplate()
                .replace("{prefix}", config.getStaticPrefix() != null ? config.getStaticPrefix() : "")
                .replace("{date}", formattedDate)
                .replace("{period}", periodValue)
                .replace("{tenant}", tenantValue)
                .replace("{scope}", scopeValue)
                .replace("{kind}", kindValue);

        int defaultPadding = config.getSeqPadding() != null && config.getSeqPadding() > 0
                ? config.getSeqPadding()
                : 6;

        Matcher matcher = SEQ_PLACEHOLDER_PATTERN.matcher(result);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            int padding = matcher.group(1) != null ? Integer.parseInt(matcher.group(1)) : defaultPadding;
            String seqFormatted = String.format("%0" + padding + "d", seqValue);
            matcher.appendReplacement(sb, Matcher.quoteReplacement(seqFormatted));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private String sanitizeToken(String raw) {
        if (raw == null || raw.isBlank()) {
            return "STD";
        }
        return raw.trim().toUpperCase().replaceAll("[^A-Z0-9_-]", "");
    }

    private boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private SysCodeTypeDto toDto(SysCodeTypeEntity entity) {
        String sample = renderTemplate(entity, 1L, Map.of(
                "period", "202611",
                "scope", "SCOPE1",
                "kind", "STD",
                "tenant", "NATCASH"));
        return SysCodeTypeDto.builder()
                .id(entity.getId())
                .codeType(entity.getCodeType())
                .description(entity.getDescription())
                .formatTemplate(entity.getFormatTemplate())
                .staticPrefix(entity.getStaticPrefix())
                .dateFormat(entity.getDateFormat())
                .seqPadding(entity.getSeqPadding())
                .seqName(entity.getSeqName())
                .batchAllocationSize(entity.getBatchAllocationSize())
                .immutableAfterCreate(entity.getImmutableAfterCreate())
                .status(entity.getStatus() == CommonStatus.ACTIVE ? 1 : 0)
                .samplePreview(sample)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null)
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SysCodeTypeDto {
        private Long id;
        private String codeType;
        private String description;
        private String formatTemplate;
        private String staticPrefix;
        private String dateFormat;
        private Integer seqPadding;
        private String seqName;
        private Integer batchAllocationSize;
        private Boolean immutableAfterCreate;
        private Integer status;
        private String samplePreview;
        private String updatedAt;
    }
}
