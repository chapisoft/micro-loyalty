package com.natcash.loyalty.sso.controller;

import com.natcash.loyalty.sso.dto.SsoDto.SsoExchangeRequest;
import com.natcash.loyalty.sso.dto.SsoDto.SsoExchangeResponse;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketRequest;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketResponse;
import com.natcash.loyalty.sso.service.SsoTicketService;
import com.natcash.loyalty.tenant.TenantContext;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/loyalty/v1/sso")
public class SsoController {

    private final SsoTicketService ssoTicketService;

    public SsoController(SsoTicketService ssoTicketService) {
        this.ssoTicketService = ssoTicketService;
    }

    @PostMapping("/generate-session-ticket")
    public ResponseEntity<SsoTicketResponse> generateSessionTicket(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody SsoTicketRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = "DEFAULT";
        }

        SsoTicketResponse response = ssoTicketService.generateTicket(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/exchange-token")
    public ResponseEntity<SsoExchangeResponse> exchangeToken(
            @Valid @RequestBody SsoExchangeRequest request) {

        SsoExchangeResponse response = ssoTicketService.exchangeToken(request);
        return ResponseEntity.ok(response);
    }
}
