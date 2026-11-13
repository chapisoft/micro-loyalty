package com.natcash.loyalty.agent.controller;

import com.natcash.loyalty.agent.entity.AgentLoyaltyProgramEntity;
import com.natcash.loyalty.agent.entity.AgentMonthlyKpiEntity;
import com.natcash.loyalty.agent.entity.SupportPlaybookEntity;
import com.natcash.loyalty.agent.service.AgentLoyaltyService;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/loyalty/v1")
@RequiredArgsConstructor
@Tag(name = "Agent & Super Agent Loyalty API", description = "KPI Đại lý, Mạng lưới Tổng đại lý & Cẩm nang hỗ trợ (AG-01..03)")
public class AgentLoyaltyController {

    private final AgentLoyaltyService agentLoyaltyService;

    @GetMapping("/agents/me")
    @Operation(summary = "Dashboard KPI cá nhân của Đại lý / Tổng đại lý")
    public ResponseEntity<Map<String, Object>> getMyAgentDashboard(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam("externalUserId") String externalUserId,
            @RequestParam(value = "month", required = false) String month) {
        return ResponseEntity.ok(agentLoyaltyService.getAgentMe(resolveTenantId(headerTenantId), externalUserId, month));
    }

    @GetMapping("/admin/agents")
    @Operation(summary = "Danh sách Đại lý và Tổng đại lý")
    public ResponseEntity<List<AgentLoyaltyProgramEntity>> listAgents(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        return ResponseEntity.ok(agentLoyaltyService.listAgents(resolveTenantId(headerTenantId)));
    }

    @PostMapping("/admin/agents")
    @Operation(summary = "Tạo hoặc cập nhật Đại lý / Tổng đại lý")
    public ResponseEntity<AgentLoyaltyProgramEntity> saveAgent(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody AgentLoyaltyProgramEntity request) {
        return ResponseEntity.ok(agentLoyaltyService.saveAgent(resolveTenantId(headerTenantId), request));
    }

    @GetMapping("/admin/agents/targets")
    @Operation(summary = "Bảng tiến độ KPI hàng tháng của mạng lưới đại lý")
    public ResponseEntity<List<AgentMonthlyKpiEntity>> listTargets(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "month", required = false) String month) {
        return ResponseEntity.ok(agentLoyaltyService.listMonthlyTargets(resolveTenantId(headerTenantId), month));
    }

    @PostMapping("/admin/agents/targets")
    @Operation(summary = "Cập nhật chỉ tiêu và tính thưởng tự động cho Đại lý")
    public ResponseEntity<AgentMonthlyKpiEntity> saveTarget(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody AgentMonthlyKpiEntity request) {
        return ResponseEntity.ok(agentLoyaltyService.saveMonthlyTarget(resolveTenantId(headerTenantId), request));
    }

    @GetMapping("/admin/agents/playbooks")
    @Operation(summary = "Danh sách cẩm nang hỗ trợ khách hàng cho Đại lý")
    public ResponseEntity<List<SupportPlaybookEntity>> listPlaybooks(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        return ResponseEntity.ok(agentLoyaltyService.listPlaybooks(resolveTenantId(headerTenantId)));
    }

    @PostMapping("/admin/agents/playbooks")
    @Operation(summary = "Tạo hoặc cập nhật cẩm nang hỗ trợ Đại lý")
    public ResponseEntity<SupportPlaybookEntity> savePlaybook(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody SupportPlaybookEntity request) {
        return ResponseEntity.ok(agentLoyaltyService.savePlaybook(resolveTenantId(headerTenantId), request));
    }

    @PostMapping("/admin/agents/{agentId}/approve-reward")
    @Operation(summary = "Phê duyệt chi trả thưởng KPI tháng cho Đại lý")
    public ResponseEntity<AgentMonthlyKpiEntity> approveReward(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("agentId") String agentId,
            @RequestBody(required = false) Map<String, String> payload) {
        String month = payload != null ? payload.get("month") : null;
        return ResponseEntity.ok(agentLoyaltyService.approveAgentReward(
                resolveTenantId(headerTenantId), agentId, month));
    }

    private String resolveTenantId(String headerTenantId) {
        return headerTenantId != null && !headerTenantId.isBlank()
                ? headerTenantId.trim()
                : TenantContext.getTenantId();
    }
}
