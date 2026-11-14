package com.natcash.loyalty.campaign.controller;

import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ActiveCampaignsRequest;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ActiveCampaignsResponse;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ClaimRewardRequest;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ClaimRewardResponse;
import com.natcash.loyalty.campaign.entity.CampaignMilestoneEntity;
import com.natcash.loyalty.campaign.service.MilestoneService;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/loyalty/v1/milestones")
@Tag(name = "Campaign Milestone API", description = "Quản lý Chiến Dịch Cột Mốc")
public class MilestoneController {

    private final MilestoneService milestoneService;

    public MilestoneController(MilestoneService milestoneService) {
        this.milestoneService = milestoneService;
    }

    @GetMapping("/admin-list")
    @Operation(summary = "Lấy danh sách cột mốc cho CMS", description = "Dành cho Quản trị viên CMS quản lý chiến dịch")
    public ResponseEntity<List<CampaignMilestoneEntity>> getAllMilestonesForAdmin(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<CampaignMilestoneEntity> list = milestoneService.getAllMilestones(tenantId);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @Operation(summary = "Tạo mới cột mốc chiến dịch", description = "Thêm mới chiến dịch cột mốc lưu vào cơ sở dữ liệu")
    public ResponseEntity<CampaignMilestoneEntity> createMilestone(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody CampaignMilestoneEntity request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        CampaignMilestoneEntity created = milestoneService.createMilestone(tenantId, request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật cột mốc chiến dịch", description = "Cập nhật thông tin cột mốc trong cơ sở dữ liệu")
    public ResponseEntity<CampaignMilestoneEntity> updateMilestone(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody CampaignMilestoneEntity request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        CampaignMilestoneEntity updated = milestoneService.updateMilestone(tenantId, id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa cột mốc chiến dịch", description = "Xóa cột mốc khỏi cơ sở dữ liệu")
    public ResponseEntity<Void> deleteMilestone(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        milestoneService.deleteMilestone(tenantId, id);
        return ResponseEntity.ok().build();
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
