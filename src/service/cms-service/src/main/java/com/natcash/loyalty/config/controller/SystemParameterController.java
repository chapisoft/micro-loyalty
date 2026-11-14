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
@Tag(name = "System Parameters API", description = "Quản lý Tham số Cấu hình Hệ thống (Cache L1/Redis) & Bộ Sinh Mã Nghiệp Vụ")
public class SystemParameterController {

    private final SystemParameterService systemParameterService;
    private final CentralizedCodeGeneratorService codeGeneratorService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả tham số hệ thống", description = "Trả về danh sách tham số cấu hình đồng bộ với SystemParamSpec và Cache")
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
    @Operation(summary = "Lấy danh mục khai báo chuẩn SystemParamSpec", description = "Cung cấp siêu dữ liệu tham số chuẩn từ Backend sang CMS")
    public ResponseEntity<List<Map<String, Object>>> getParamSpecs() {
        return ResponseEntity.ok(systemParameterService.getSpecCatalog());
    }

    @PostMapping("/refresh-cache")
    @Operation(summary = "Làm mới bộ nhớ đệm cấu hình", description = "Nạp lại toàn bộ tham số hệ thống và cấu trúc sinh mã từ CSDL vào L1 Cache & Redis")
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
    @Operation(summary = "Lấy danh sách cấu hình sinh mã nghiệp vụ", description = "Danh sách các loại mã tự động sys_code_types kèm mã xem trước")
    public ResponseEntity<List<SysCodeTypeDto>> listCodeTypes() {
        return ResponseEntity.ok(codeGeneratorService.listAllCodeTypes());
    }

    @PutMapping("/code-types/{codeType}")
    @Operation(summary = "Cập nhật cấu trúc sinh mã nghiệp vụ", description = "Chỉnh sửa tiền tố, khuôn mẫu, định dạng ngày và làm mới cache tức thời")
    public ResponseEntity<SysCodeTypeDto> updateCodeType(
            @PathVariable("codeType") String codeType,
            @RequestBody SysCodeTypeDto request) {
        return ResponseEntity.ok(codeGeneratorService.updateCodeType(codeType, request));
    }

    @PostMapping("/code-types/{codeType}/preview")
    @Operation(summary = "Xem trước mã nghiệp vụ sinh tự động", description = "Kết xuất thử cấu trúc mã theo khuôn mẫu mà không tiêu hao PostgreSQL Sequence")
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
    @Operation(summary = "Lấy chi tiết một tham số", description = "Tra cứu giá trị tham số theo khóa paramKey")
    public ResponseEntity<SystemParameterDto> getParameter(@PathVariable("paramKey") String paramKey) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(toDto(systemParameterService.getParameter(tenantId, paramKey)));
    }

    @PostMapping
    @Operation(summary = "Thêm mới tham số hệ thống", description = "Tạo mới tham số cấu hình và nạp vào Cache L1/Redis")
    public ResponseEntity<SystemParameterDto> createParameter(@RequestBody SystemParameterDto request) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(toDto(systemParameterService.createParameter(tenantId, toItem(request))));
    }

    @PutMapping("/{paramKey}")
    @Operation(summary = "Cập nhật tham số hệ thống", description = "Kiểm tra hợp lệ kiểu dữ liệu, lưu CSDL và Write-Through vào Cache")
    public ResponseEntity<SystemParameterDto> updateParameter(
            @PathVariable("paramKey") String paramKey,
            @RequestBody SystemParameterDto request) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(toDto(systemParameterService.updateParameter(tenantId, paramKey, toItem(request))));
    }

    @DeleteMapping("/{paramKey}")
    @Operation(summary = "Xóa tham số hệ thống", description = "Loại bỏ tham số cấu hình khỏi CSDL và xóa khóa trong Cache")
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
