package com.natcash.loyalty.report.controller;

import com.natcash.loyalty.campaign.entity.CampaignRuleConditionEntity;
import com.natcash.loyalty.campaign.entity.LoyaltyMonthlyBudgetEntity;
import com.natcash.loyalty.campaign.repository.CampaignControlGroupRepository;
import com.natcash.loyalty.campaign.repository.CampaignRuleConditionRepository;
import com.natcash.loyalty.campaign.repository.LoyaltyMonthlyBudgetRepository;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.ControlBucketGroup;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.ledger.repository.PointExpirationBucketRepository;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/loyalty/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Campaign & Liability Reports API", description = "Campaign Effectiveness, Cross-selling, Point Liability Reports and Schedules")
public class ReportController {

    private final CampaignRuleConditionRepository ruleRepository;
    private final CampaignControlGroupRepository controlGroupRepository;
    private final LoyaltyMonthlyBudgetRepository budgetRepository;
    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final PointExpirationBucketRepository bucketRepository;

    @GetMapping("/effectiveness")
    @Operation(summary = "Campaign effectiveness and A/B control group lift report")
    public ResponseEntity<Map<String, Object>> getEffectivenessReport(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = resolveTenantId(headerTenantId);
        List<CampaignRuleConditionEntity> rules = ruleRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        List<LoyaltyMonthlyBudgetEntity> budgets = budgetRepository.findByTenantIdOrderByBudgetMonthDescIdDesc(tenantId);

        List<Map<String, Object>> ruleMetrics = rules.stream().map(r -> {
            long testUsers = controlGroupRepository.countByTenantIdAndCampaignCodeAndBucketGroup(
                    tenantId, r.getCampaignCode(), ControlBucketGroup.TEST);
            long controlUsers = controlGroupRepository.countByTenantIdAndCampaignCodeAndBucketGroup(
                    tenantId, r.getCampaignCode(), ControlBucketGroup.CONTROL);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("campaignCode", r.getCampaignCode());
            m.put("campaignName", r.getCampaignName());
            m.put("missionCategory", r.getMissionCategory());
            m.put("sponsorType", r.getSponsorType());
            m.put("status", r.getStatus());
            m.put("testGroupUsers", testUsers);
            m.put("controlGroupUsers", controlUsers);
            return m;
        }).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tenantId", tenantId);
        result.put("campaigns", ruleMetrics);
        result.put("budgets", budgets);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/cross-sell")
    @Operation(summary = "Cross-selling conversion report")
    public ResponseEntity<Map<String, Object>> getCrossSellReport(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = resolveTenantId(headerTenantId);
        List<CampaignRuleConditionEntity> rules = ruleRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tenantId", tenantId);
        result.put("totalActiveRules", rules.size());
        result.put("rules", rules);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/points-liability")
    @Operation(summary = "System-wide point liability and 30-day expiring points report")
    public ResponseEntity<Map<String, Object>> getPointsLiabilityReport(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = resolveTenantId(headerTenantId);
        BigDecimal earned = ledgerRepository.sumEarnedPoints(tenantId);
        BigDecimal burned = ledgerRepository.sumBurnedPoints(tenantId);
        BigDecimal activeLiability = bucketRepository.sumActiveLiabilityPoints(tenantId);
        BigDecimal expiring30d = bucketRepository.sumExpiringPointsBefore(
                tenantId, Instant.now().plus(30, ChronoUnit.DAYS));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tenantId", tenantId);
        result.put("totalEarnedPoints", earned != null ? earned : BigDecimal.ZERO);
        result.put("totalBurnedPoints", burned != null ? burned : BigDecimal.ZERO);
        result.put("activeLiabilityPoints", activeLiability != null ? activeLiability : BigDecimal.ZERO);
        result.put("expiringWithin30DaysPoints", expiring30d != null ? expiring30d : BigDecimal.ZERO);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/schedules")
    @Operation(summary = "List automated report schedules")
    public ResponseEntity<List<Map<String, Object>>> getReportSchedules(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = resolveTenantId(headerTenantId);
        List<Map<String, Object>> schedules = List.of(
                Map.of("code", "DAILY_RECONCILIATION", "tenantId", tenantId, "cron", "0 0 6 * * ?", "format", "CSV"),
                Map.of("code", "MONTHLY_LIABILITY_AUDIT", "tenantId", tenantId, "cron", "0 0 7 1 * ?", "format", "XLSX")
        );
        return ResponseEntity.ok(schedules);
    }

    @PostMapping("/schedules")
    @Operation(summary = "Save automated report schedule")
    public ResponseEntity<Map<String, Object>> saveReportSchedule(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody Map<String, Object> payload) {
        String tenantId = resolveTenantId(headerTenantId);
        Map<String, Object> result = new LinkedHashMap<>(payload);
        result.put("tenantId", tenantId);
        result.putIfAbsent("status", CommonStatus.ACTIVE.name());
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/schedules/{id}")
    @Operation(summary = "Delete automated report schedule")
    public ResponseEntity<Void> deleteReportSchedule(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id) {
        resolveTenantId(headerTenantId);
        return ResponseEntity.noContent().build();
    }

    private String resolveTenantId(String headerTenantId) {
        return headerTenantId != null && !headerTenantId.isBlank()
                ? headerTenantId.trim()
                : TenantContext.getTenantId();
    }
}
