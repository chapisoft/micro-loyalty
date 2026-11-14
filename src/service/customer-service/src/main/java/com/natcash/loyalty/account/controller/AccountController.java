package com.natcash.loyalty.account.controller;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileRequest;
import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;
import com.natcash.loyalty.account.service.AccountService;
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

@RestController
@RequestMapping("/loyalty/v1/profile")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfileGet(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "externalUserId", required = false, defaultValue = "84988888888") String externalUserId) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        ProfileRequest request = ProfileRequest.builder()
                .externalUserId(externalUserId)
                .build();
        ProfileResponse response = accountService.getOrCreateProfile(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ProfileResponse> getProfile(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody ProfileRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        ProfileResponse response = accountService.getOrCreateProfile(tenantId, request);
        return ResponseEntity.ok(response);
    }
}
