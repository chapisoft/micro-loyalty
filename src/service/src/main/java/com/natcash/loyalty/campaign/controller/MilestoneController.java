package com.natcash.loyalty.campaign.controller;

import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ActiveCampaignsRequest;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ActiveCampaignsResponse;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ClaimRewardRequest;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ClaimRewardResponse;
import com.natcash.loyalty.campaign.service.MilestoneService;
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
@RequestMapping("/loyalty/v1/milestones")
public class MilestoneController {

    private final MilestoneService milestoneService;

    public MilestoneController(MilestoneService milestoneService) {
        this.milestoneService = milestoneService;
    }

    @GetMapping("/active-campaigns")
    public ResponseEntity<ActiveCampaignsResponse> getActiveCampaignsGet(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "externalUserId", required = false, defaultValue = "84988888888") String externalUserId) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        ActiveCampaignsResponse response = milestoneService.getActiveCampaigns(tenantId, externalUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/list")
    public ResponseEntity<ActiveCampaignsResponse> getMilestonesList(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "externalUserId", required = false, defaultValue = "84988888888") String externalUserId) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        ActiveCampaignsResponse response = milestoneService.getActiveCampaigns(tenantId, externalUserId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/active-campaigns")
    public ResponseEntity<ActiveCampaignsResponse> getActiveCampaigns(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody ActiveCampaignsRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        ActiveCampaignsResponse response = milestoneService.getActiveCampaigns(tenantId, request.getExternalUserId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/claim-reward")
    public ResponseEntity<ClaimRewardResponse> claimReward(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody ClaimRewardRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        ClaimRewardResponse response = milestoneService.claimReward(tenantId, request);
        return ResponseEntity.ok(response);
    }
}
