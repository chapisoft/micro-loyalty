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
import java.util.Map;

@RestController
@RequestMapping("/loyalty/v1/integrations")
@Tag(name = "Tenant Integration API", description = "Multi-tenant Payment Gateway, Wallet and SMS Integration Management")
public class TenantIntegrationController {

    private final TenantIntegrationService integrationService;

    public TenantIntegrationController(TenantIntegrationService integrationService) {
        this.integrationService = integrationService;
    }

    @GetMapping
    @Operation(summary = "Get tenant integrations list", description = "Return Payment Gateway and SMS Brandname configurations")
    public ResponseEntity<List<IntegrationConfigDto>> getTenantIntegrations(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<IntegrationConfigDto> dtos = integrationService.getTenantIntegrations(tenantId);
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    @Operation(summary = "Save or update integration configuration", description = "Save Payment Gateway or SMS connection settings per tenant")
    public ResponseEntity<IntegrationConfigDto> saveIntegration(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody SaveIntegrationRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        IntegrationConfigDto saved = integrationService.saveIntegration(tenantId, request);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/overview")
    @Operation(summary = "Overview of integrated systems status")
    public ResponseEntity<List<Map<String, Object>>> getOverview(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        return ResponseEntity.ok(integrationService.getIntegrationsOverview(tenantId));
    }

    @PostMapping("/test")
    @Operation(summary = "Test integration connection", description = "Ping partner endpoint and measure round-trip latency")
    public ResponseEntity<TestConnectionResponse> testConnection(
            @Valid @RequestBody TestConnectionRequest request) {
        TestConnectionResponse res = integrationService.testConnection(request);
        return ResponseEntity.ok(res);
    }
}
