package com.natcash.loyalty.integration.controller;

import com.natcash.loyalty.integration.dto.TenantIntegrationDto.IntegrationConfigDto;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.SaveIntegrationRequest;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.TestConnectionRequest;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.TestConnectionResponse;
import com.natcash.loyalty.integration.service.TenantIntegrationService;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/loyalty/v1/integrations")
@Tag(name = "Tenant Integration API", description = "Quản lý Cấu hình Cổng Ngân hàng, Ví & SMS Đa Thuê bao")
public class TenantIntegrationController {

    private final TenantIntegrationService integrationService;

    public TenantIntegrationController(TenantIntegrationService integrationService) {
        this.integrationService = integrationService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách cấu hình tích hợp của bên thuê", description = "Trả về danh sách cấu hình Payment Gateway và SMS Brandname")
    public ResponseEntity<List<IntegrationConfigDto>> getTenantIntegrations(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<IntegrationConfigDto> dtos = integrationService.getTenantIntegrations(tenantId);
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    @Operation(summary = "Lưu hoặc cập nhật cấu hình tích hợp", description = "Lưu thông số kết nối Cổng Ngân hàng hoặc SMS riêng biệt theo bên thuê")
    public ResponseEntity<IntegrationConfigDto> saveIntegration(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody SaveIntegrationRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        IntegrationConfigDto saved = integrationService.saveIntegration(tenantId, request);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/test")
    @Operation(summary = "Kiểm tra kết nối thử nghiệm", description = "Thử nghiệm kết nối tới Endpoint đối tác và đo độ trễ")
    public ResponseEntity<TestConnectionResponse> testConnection(
            @Valid @RequestBody TestConnectionRequest request) {
        TestConnectionResponse res = integrationService.testConnection(request);
        return ResponseEntity.ok(res);
    }
}
