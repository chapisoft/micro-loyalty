package com.natcash.loyalty.campaign.controller;

import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ClaimRewardResponse;
import com.natcash.loyalty.campaign.entity.AiCampaignSuggestionEntity;
import com.natcash.loyalty.campaign.entity.CampaignRuleConditionEntity;
import com.natcash.loyalty.campaign.entity.LoyaltyMonthlyBudgetEntity;
import com.natcash.loyalty.campaign.service.AiCampaignCopilotService;
import com.natcash.loyalty.campaign.service.CampaignRuleEngineService;
import com.natcash.loyalty.campaign.service.MonthlyBudgetGuardService;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/loyalty/v1")
@RequiredArgsConstructor
@Tag(name = "Campaign Rules, Budgets & AI Copilot API", description = "Luật 4 tầng WHEN-IF-THEN-LIMITS, Ngân sách, Giới thiệu & AI Copilot")
public class CampaignRuleController {

    private final CampaignRuleEngineService ruleEngineService;
    private final MonthlyBudgetGuardService budgetGuardService;
    private final AiCampaignCopilotService aiCopilotService;

    @GetMapping("/campaigns/rules")
    @Operation(summary = "Danh sách luật chiến dịch 4 tầng")
    public ResponseEntity<List<CampaignRuleConditionEntity>> listRules(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        return ResponseEntity.ok(ruleEngineService.listRules(resolveTenantId(headerTenantId)));
    }

    @PostMapping("/campaigns/rules")
    @Operation(summary = "Tạo hoặc cập nhật luật chiến dịch kèm kiểm tra xung đột")
    public ResponseEntity<Map<String, Object>> saveRule(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody CampaignRuleConditionEntity request) {
        return ResponseEntity.ok(ruleEngineService.saveRule(resolveTenantId(headerTenantId), request));
    }

    @DeleteMapping("/campaigns/rules/{id}")
    @Operation(summary = "Xóa luật chiến dịch 4 tầng")
    public ResponseEntity<Void> deleteRule(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id) {
        ruleEngineService.deleteRule(resolveTenantId(headerTenantId), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/campaigns/milestones/{id}/claim")
    @Operation(summary = "Nhận thưởng cột mốc chiến dịch (kèm Control Group & Budget Guard)")
    public ResponseEntity<ClaimRewardResponse> claimMilestone(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id,
            @RequestBody MilestoneClaimPayload request) {
        return ResponseEntity.ok(ruleEngineService.claimMilestoneWithGuard(
                resolveTenantId(headerTenantId), id, request.getExternalUserId(), request.getCampaignCode()));
    }

    @GetMapping("/referrals/me")
    @Operation(summary = "Thông tin mã giới thiệu & thống kê eKYC bạn bè")
    public ResponseEntity<Map<String, Object>> getMyReferrals(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam("externalUserId") String externalUserId) {
        return ResponseEntity.ok(ruleEngineService.getMyReferrals(resolveTenantId(headerTenantId), externalUserId));
    }

    @GetMapping("/budgets")
    @Operation(summary = "Danh sách trần ngân sách theo tháng và nguồn tài trợ")
    public ResponseEntity<List<LoyaltyMonthlyBudgetEntity>> listBudgets(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "month", required = false) String month) {
        return ResponseEntity.ok(budgetGuardService.listBudgets(resolveTenantId(headerTenantId), month));
    }

    @PostMapping("/budgets")
    @Operation(summary = "Tạo hoặc cập nhật trần ngân sách tháng")
    public ResponseEntity<LoyaltyMonthlyBudgetEntity> saveBudget(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody LoyaltyMonthlyBudgetEntity request) {
        return ResponseEntity.ok(budgetGuardService.saveBudget(resolveTenantId(headerTenantId), request));
    }

    @PostMapping("/ai-copilot/suggest")
    @Operation(summary = "AI Copilot đề xuất cấu hình chiến dịch 4 tầng và dự báo ROI")
    public ResponseEntity<AiCampaignSuggestionEntity> suggestCampaign(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody AiSuggestRequest request) {
        return ResponseEntity.ok(aiCopilotService.suggestCampaign(
                resolveTenantId(headerTenantId),
                request.getObjective(),
                request.getTargetSegment(),
                request.getBudgetCap(),
                request.getCreatedBy()));
    }

    private String resolveTenantId(String headerTenantId) {
        return headerTenantId != null && !headerTenantId.isBlank()
                ? headerTenantId.trim()
                : TenantContext.getTenantId();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MilestoneClaimPayload {
        @NotBlank
        private String externalUserId;
        private String campaignCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiSuggestRequest {
        @NotBlank
        private String objective;
        private String targetSegment;
        private BigDecimal budgetCap;
        private String createdBy;
    }
}
