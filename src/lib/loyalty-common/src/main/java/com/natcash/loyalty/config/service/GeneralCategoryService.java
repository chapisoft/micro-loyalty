package com.natcash.loyalty.config.service;

import com.natcash.loyalty.config.LoyaltyProperties;
import com.natcash.loyalty.config.entity.GeneralCategoryEntity;
import com.natcash.loyalty.config.repository.GeneralCategoryRepository;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeneralCategoryService {

    public static final String GROUP_CATEGORY_TYPE = "CATEGORY_GROUP";

    private final GeneralCategoryRepository categoryRepository;

    private final Map<String, List<GeneralCategoryDto>> categoryCache = new ConcurrentHashMap<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeneralCategoryDto implements Serializable {
        private String tenantId;
        private String categoryType;
        private String code;
        private String name;
        private String parentCode;
        private Integer displayOrder;
        private Integer status;
        private String description;
        private String metadata;
    }

    public List<GeneralCategoryDto> getCategoryGroups(String tenantId) {
        return getCategoriesByType(tenantId, GROUP_CATEGORY_TYPE);
    }

    public List<GeneralCategoryDto> getCategoriesByType(String tenantId, String categoryType) {
        if (tenantId == null || categoryType == null) {
            return Collections.emptyList();
        }
        String cacheKey = tenantId + ":" + categoryType;
        return categoryCache.computeIfAbsent(cacheKey, k -> {
            List<GeneralCategoryEntity> entities = findWithFallback(tenantId, categoryType);
            return entities.stream().map(this::toDto).toList();
        });
    }

    public List<GeneralCategoryDto> getAllCategories(String tenantId) {
        if (tenantId == null) {
            return Collections.emptyList();
        }
        List<GeneralCategoryEntity> entities = categoryRepository
                .findByTenantIdOrderByCategoryTypeAscDisplayOrderAscNameAsc(tenantId);
        if (entities.isEmpty()) {
            String defaultTenant = LoyaltyProperties.get().getTenant().getDefaultTenant();
            if (defaultTenant != null && !defaultTenant.isBlank() && !defaultTenant.equalsIgnoreCase(tenantId)) {
                entities = categoryRepository.findByTenantIdOrderByCategoryTypeAscDisplayOrderAscNameAsc(defaultTenant);
            }
        }
        if (entities.isEmpty() && !"SYSTEM".equalsIgnoreCase(tenantId)) {
            entities = categoryRepository.findByTenantIdOrderByCategoryTypeAscDisplayOrderAscNameAsc("SYSTEM");
        }
        if (entities.isEmpty() && !"DEFAULT".equalsIgnoreCase(tenantId)) {
            entities = categoryRepository.findByTenantIdOrderByCategoryTypeAscDisplayOrderAscNameAsc("DEFAULT");
        }
        return entities.stream().map(this::toDto).toList();
    }

    public Optional<GeneralCategoryDto> getCategory(String tenantId, String categoryType, String code) {
        if (tenantId == null || categoryType == null || code == null) {
            return Optional.empty();
        }
        Optional<GeneralCategoryEntity> entity = categoryRepository
                .findByTenantIdAndCategoryTypeAndCode(tenantId, categoryType, code);
        if (entity.isEmpty()) {
            String defaultTenant = LoyaltyProperties.get().getTenant().getDefaultTenant();
            if (defaultTenant != null && !defaultTenant.isBlank() && !defaultTenant.equalsIgnoreCase(tenantId)) {
                entity = categoryRepository.findByTenantIdAndCategoryTypeAndCode(defaultTenant, categoryType, code);
            }
        }
        if (entity.isEmpty() && !"SYSTEM".equalsIgnoreCase(tenantId)) {
            entity = categoryRepository.findByTenantIdAndCategoryTypeAndCode("SYSTEM", categoryType, code);
        }
        if (entity.isEmpty() && !"DEFAULT".equalsIgnoreCase(tenantId)) {
            entity = categoryRepository.findByTenantIdAndCategoryTypeAndCode("DEFAULT", categoryType, code);
        }
        return entity.map(this::toDto);
    }

    private List<GeneralCategoryEntity> findWithFallback(String tenantId, String categoryType) {
        List<GeneralCategoryEntity> entities = categoryRepository
                .findByTenantIdAndCategoryTypeOrderByDisplayOrderAscNameAsc(tenantId, categoryType);
        if (!entities.isEmpty()) {
            return entities;
        }
        String defaultTenant = LoyaltyProperties.get().getTenant().getDefaultTenant();
        if (defaultTenant != null && !defaultTenant.isBlank() && !defaultTenant.equalsIgnoreCase(tenantId)) {
            entities = categoryRepository
                    .findByTenantIdAndCategoryTypeOrderByDisplayOrderAscNameAsc(defaultTenant, categoryType);
            if (!entities.isEmpty()) {
                return entities;
            }
        }
        if (!"SYSTEM".equalsIgnoreCase(tenantId) && (defaultTenant == null || !"SYSTEM".equalsIgnoreCase(defaultTenant))) {
            entities = categoryRepository
                    .findByTenantIdAndCategoryTypeOrderByDisplayOrderAscNameAsc("SYSTEM", categoryType);
            if (!entities.isEmpty()) {
                return entities;
            }
        }
        if (!"DEFAULT".equalsIgnoreCase(tenantId) && (defaultTenant == null || !"DEFAULT".equalsIgnoreCase(defaultTenant))) {
            entities = categoryRepository
                    .findByTenantIdAndCategoryTypeOrderByDisplayOrderAscNameAsc("DEFAULT", categoryType);
        }
        return entities;
    }

    public boolean isValidCategoryCode(String tenantId, String categoryType, String code) {
        if (code == null || categoryType == null) {
            return false;
        }
        List<GeneralCategoryDto> list = getCategoriesByType(tenantId, categoryType);
        return list.stream().anyMatch(c -> c.getCode().equalsIgnoreCase(code) && (c.getStatus() == null || c.getStatus() == 1));
    }

    public String getCategoryName(String tenantId, String categoryType, String code, String defaultName) {
        if (code == null) {
            return defaultName;
        }
        return getCategory(tenantId, categoryType, code)
                .map(GeneralCategoryDto::getName)
                .orElse(defaultName != null ? defaultName : code);
    }

    @Transactional
    public GeneralCategoryDto createCategory(String tenantId, GeneralCategoryDto dto) {
        String effectiveTenant = (dto.getTenantId() != null && !dto.getTenantId().isBlank())
                ? dto.getTenantId() : tenantId;
        String categoryType = dto.getCategoryType();
        String code = dto.getCode().trim();

        GeneralCategoryEntity entity = GeneralCategoryEntity.builder()
                .tenantId(effectiveTenant)
                .categoryType(categoryType)
                .code(code)
                .name(dto.getName())
                .parentCode(dto.getParentCode())
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .status(dto.getStatus() != null ? dto.getStatus() : 1)
                .description(dto.getDescription())
                .metadata(dto.getMetadata())
                .build();

        GeneralCategoryEntity saved = categoryRepository.save(entity);
        evictCache(effectiveTenant, categoryType);
        log.info("Category created successfully: tenant={}, type={}, code={}", effectiveTenant, categoryType, code);
        return toDto(saved);
    }

    @Transactional
    public GeneralCategoryDto updateCategory(String tenantId, String categoryType, String code, GeneralCategoryDto dto) {
        String effectiveTenant = (dto.getTenantId() != null && !dto.getTenantId().isBlank())
                ? dto.getTenantId() : tenantId;

        GeneralCategoryEntity existing = categoryRepository
                .findByTenantIdAndCategoryTypeAndCode(effectiveTenant, categoryType, code)
                .orElseGet(() -> GeneralCategoryEntity.builder()
                        .tenantId(effectiveTenant)
                        .categoryType(categoryType)
                        .code(code)
                        .build());

        if (dto.getName() != null) {
            existing.setName(dto.getName());
        }
        if (dto.getParentCode() != null) {
            existing.setParentCode(dto.getParentCode());
        }
        if (dto.getDisplayOrder() != null) {
            existing.setDisplayOrder(dto.getDisplayOrder());
        }
        if (dto.getStatus() != null) {
            existing.setStatus(dto.getStatus());
        }
        if (dto.getDescription() != null) {
            existing.setDescription(dto.getDescription());
        }
        if (dto.getMetadata() != null) {
            existing.setMetadata(dto.getMetadata());
        }

        GeneralCategoryEntity saved = categoryRepository.save(existing);
        evictCache(effectiveTenant, categoryType);
        log.info("Category updated successfully: tenant={}, type={}, code={}", effectiveTenant, categoryType, code);
        return toDto(saved);
    }

    @Transactional
    public void deleteCategory(String tenantId, String categoryType, String code) {
        categoryRepository.deleteByTenantIdAndCategoryTypeAndCode(tenantId, categoryType, code);
        if (GROUP_CATEGORY_TYPE.equalsIgnoreCase(categoryType)) {
            // When deleting a category group, delete all child category items within this group
            categoryRepository.deleteByTenantIdAndCategoryType(tenantId, code);
            evictCache(tenantId, code);
        }
        evictCache(tenantId, categoryType);
        log.info("Category deleted: tenant={}, type={}, code={}", tenantId, categoryType, code);
    }

    public void evictCache(String tenantId, String categoryType) {
        if (tenantId != null && categoryType != null) {
            categoryCache.remove(tenantId + ":" + categoryType);
        } else {
            categoryCache.clear();
        }
    }

    public void clearAllCache() {
        categoryCache.clear();
    }

    private GeneralCategoryDto toDto(GeneralCategoryEntity entity) {
        return GeneralCategoryDto.builder()
                .tenantId(entity.getTenantId())
                .categoryType(entity.getCategoryType())
                .code(entity.getCode())
                .name(entity.getName())
                .parentCode(entity.getParentCode())
                .displayOrder(entity.getDisplayOrder())
                .status(entity.getStatus())
                .description(entity.getDescription())
                .metadata(entity.getMetadata())
                .build();
    }
}
