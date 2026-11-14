package com.natcash.loyalty.engagement.controller;

import com.natcash.loyalty.engagement.dto.NudgeDto.InAppNudgeRequest;
import com.natcash.loyalty.engagement.dto.NudgeDto.InAppNudgeResponse;
import com.natcash.loyalty.engagement.service.EngagementService;
import com.natcash.loyalty.tenant.TenantContext;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/loyalty/v1/engagement")
public class EngagementController {

    private final EngagementService engagementService;

    public EngagementController(EngagementService engagementService) {
        this.engagementService = engagementService;
    }

    @PostMapping("/in-app-nudges")
    public ResponseEntity<InAppNudgeResponse> getInAppNudges(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody InAppNudgeRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        InAppNudgeResponse response = engagementService.getInAppNudges(tenantId, request);
        return ResponseEntity.ok(response);
    }
}
