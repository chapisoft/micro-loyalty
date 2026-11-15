package com.natcash.loyalty.config.controller;

import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService;
import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService.SysCodeTypeDto;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.config.service.SystemParameterService.SystemParameterItem;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.Serializable;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = {"/api/v1/system-parameters", "/loyalty/v1/system-parameters", "/system-parameters"})
@RequiredArgsConstructor
@Tag(name = "System Parameters API", description = "System Configuration Parameters (L1/Redis Cache) and Business Code Generation Management")
public class SystemParameterController {

    private final SystemParameterService systemParameterService;
    private final CentralizedCodeGeneratorService codeGeneratorService;

    @GetMapping
    @Operation(summary = "Get all system parameters", description = "Query configuration parameters synchronized with SystemParamSpec and cache")
    public ResponseEntity<List<SystemParameterDto>> getAllParameters(
            @RequestParam(value = "groupCode", required = false) String groupCode,
            @RequestParam(value = "keyword", required = false) String keyword) {
        String tenantId = TenantContext.getTenantId();
        List<SystemParameterDto> list = systemParameterService.listParameters(tenantId, groupCode, keyword)
                .stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/specs")
    @Operation(summary = "Get SystemParamSpec specifications", description = "Provide parameter metadata specifications to CMS")
    public ResponseEntity<List<Map<String, Object>>> getParamSpecs() {
        return ResponseEntity.ok(systemParameterService.getSpecCatalog());
    }

    @PostMapping("/refresh-cache")
    @Operation(summary = "Refresh configuration cache", description = "Reload all system parameters and code generator templates from DB into L1 and Redis cache")
    public ResponseEntity<Map<String, Object>> refreshCache() {
        String tenantId = TenantContext.getTenantId();
        int paramsCached = systemParameterService.preloadTenantCache(tenantId);
        int codeTypesCached = codeGeneratorService.preloadConfigCache();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tenantId", tenantId);
        result.put("parametersCached", paramsCached);
        result.put("codeTypesCached", codeTypesCached);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/code-types")
    @Operation(summary = "Get business code configurations", description = "List automated sys_code_types with preview codes")
    public ResponseEntity<List<SysCodeTypeDto>> listCodeTypes() {
        return ResponseEntity.ok(codeGeneratorService.listAllCodeTypes());
    }

    @PutMapping("/code-types/{codeType}")
    @Operation(summary = "Update business code configuration", description = "Edit prefix, template pattern, date format and refresh cache")
    public ResponseEntity<SysCodeTypeDto> updateCodeType(
            @PathVariable("codeType") String codeType,
            @RequestBody SysCodeTypeDto request) {
        return ResponseEntity.ok(codeGeneratorService.updateCodeType(codeType, request));
    }

    @PostMapping("/code-types/{codeType}/preview")
    @Operation(summary = "Preview generated business code", description = "Render preview code without consuming PostgreSQL sequence")
    public ResponseEntity<Map<String, String>> previewCodeType(
            @PathVariable("codeType") String codeType,
            @RequestBody(required = false) CodePreviewRequest request) {
        SysCodeTypeDto override = request != null ? request.getConfig() : null;
        Map<String, String> params = request != null && request.getSampleParams() != null
                ? request.getSampleParams()
                : Collections.emptyMap();
        String preview = codeGeneratorService.previewCode(codeType, override, params);
        return ResponseEntity.ok(Map.of("codeType", codeType.toUpperCase(), "preview", preview));
    }

    @GetMapping("/{paramKey}")
    @Operation(summary = "Get single parameter details", description = "Look up parameter value by paramKey")
    public ResponseEntity<SystemParameterDto> getParameter(@PathVariable("paramKey") String paramKey) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(toDto(systemParameterService.getParameter(tenantId, paramKey)));
    }

    @PostMapping
    @Operation(summary = "Create system parameter", description = "Create configuration parameter and write through to L1/Redis cache")
    public ResponseEntity<SystemParameterDto> createParameter(@RequestBody SystemParameterDto request) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(toDto(systemParameterService.createParameter(tenantId, toItem(request))));
    }

    @PutMapping("/{paramKey}")
    @Operation(summary = "Update system parameter", description = "Validate data type, save to DB and write through to cache")
    public ResponseEntity<SystemParameterDto> updateParameter(
            @PathVariable("paramKey") String paramKey,
            @RequestBody SystemParameterDto request) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(toDto(systemParameterService.updateParameter(tenantId, paramKey, toItem(request))));
    }

    @DeleteMapping("/{paramKey}")
    @Operation(summary = "Delete system parameter", description = "Remove parameter from DB and evict from cache")
    public ResponseEntity<Void> deleteParameter(@PathVariable("paramKey") String paramKey) {
        String tenantId = TenantContext.getTenantId();
        systemParameterService.deleteParameter(tenantId, paramKey);
        return ResponseEntity.noContent().build();
    }

    private SystemParameterDto toDto(SystemParameterItem item) {
        return SystemParameterDto.builder()
                .id(item.getId())
                .paramKey(item.getParamKey())
                .paramName(item.getParamName())
                .paramValue(item.getParamValue())
                .defaultValue(item.getDefaultValue())
                .valueType(item.getValueType())
                .groupCode(item.getGroupCode())
                .allowedValues(item.getAllowedValues())
                .description(item.getDescription())
                .status(item.getStatus())
                .updatedBy(item.getUpdatedBy())
                .fromDefault(item.getFromDefault())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private SystemParameterItem toItem(SystemParameterDto dto) {
        if (dto == null) {
            return null;
        }
        return SystemParameterItem.builder()
                .id(dto.getId())
                .paramKey(dto.getParamKey())
                .paramName(dto.getParamName())
                .paramValue(dto.getParamValue())
                .valueType(dto.getValueType())
                .groupCode(dto.getGroupCode())
                .allowedValues(dto.getAllowedValues())
                .description(dto.getDescription())
                .status(dto.getStatus())
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemParameterDto implements Serializable {
        private static final long serialVersionUID = 1L;

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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodePreviewRequest {
        private SysCodeTypeDto config;
        private Map<String, String> sampleParams;
    }
}
