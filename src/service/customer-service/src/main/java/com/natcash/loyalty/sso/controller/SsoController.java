package com.natcash.loyalty.sso.controller;

import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.security.SecurityContextUtils;
import com.natcash.loyalty.sso.dto.SsoDto.SsoExchangeRequest;
import com.natcash.loyalty.sso.dto.SsoDto.SsoExchangeResponse;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketRequest;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketResponse;
import com.natcash.loyalty.sso.dto.SsoDto.TenantAccountSummary;
import com.natcash.loyalty.sso.dto.SsoDto.TenantUserAuthRequest;
import com.natcash.loyalty.sso.dto.SsoDto.TenantUserContextResponse;
import com.natcash.loyalty.sso.service.SsoTicketService;
import com.natcash.loyalty.tenant.TenantContext;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/loyalty/v1/sso")
public class SsoController {

    private final SsoTicketService ssoTicketService;

    public SsoController(SsoTicketService ssoTicketService) {
        this.ssoTicketService = ssoTicketService;
    }

    @PostMapping("/generate-session-ticket")
    public ResponseEntity<SsoTicketResponse> generateSessionTicket(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.API_KEY_HEADER, required = false) String apiKey,
            @RequestHeader(value = LoyaltyConstants.TIMESTAMP_HEADER, required = false) String timestamp,
            @RequestHeader(value = LoyaltyConstants.SIGNATURE_HEADER, required = false) String signature,
            @Valid @RequestBody SsoTicketRequest request) {

        String tenantId = resolveTenantId(headerTenantId, null);
        SsoTicketResponse response = ssoTicketService.generateTicket(tenantId, request, apiKey, timestamp, signature);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/exchange-token")
    public ResponseEntity<SsoExchangeResponse> exchangeToken(
            @Valid @RequestBody SsoExchangeRequest request) {

        SsoExchangeResponse response = ssoTicketService.exchangeToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/authenticate-tenant-user")
    public ResponseEntity<TenantUserContextResponse> authenticateTenantUser(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody TenantUserAuthRequest request) {

        TenantUserContextResponse response = ssoTicketService.authenticateTenantUser(headerTenantId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me-context")
    public ResponseEntity<TenantUserContextResponse> getMeContext(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "externalUserId", required = false) String externalUserId) {

        String resolvedUserId = SecurityContextUtils.resolveAuthenticatedUserId(externalUserId);
        String tenantId = SecurityContextUtils.getAuthenticatedTenantId()
                .orElseGet(() -> resolveTenantId(headerTenantId, null));
        String rawToken = (authHeader != null && authHeader.startsWith("Bearer "))
                ? authHeader.substring(7).trim()
                : null;

        return ResponseEntity.ok(ssoTicketService.getUserContext(tenantId, resolvedUserId, rawToken));
    }

    @GetMapping("/tenant-accounts")
    public ResponseEntity<List<TenantAccountSummary>> getTenantAccounts(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "tenantId", required = false) String paramTenantId) {

        String tenantId = resolveTenantId(headerTenantId, paramTenantId);
        return ResponseEntity.ok(ssoTicketService.listTenantAccounts(tenantId));
    }

    private String resolveTenantId(String headerTenantId, String paramTenantId) {
        if (paramTenantId != null && !paramTenantId.isBlank()) {
            return paramTenantId.trim();
        }
        if (headerTenantId != null && !headerTenantId.isBlank()) {
            return headerTenantId.trim();
        }
        String ctx = TenantContext.getTenantId();
        return (ctx != null && !ctx.isBlank()) ? ctx : "DEFAULT";
    }
}
