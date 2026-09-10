package com.natcash.loyalty.account.controller;

import com.natcash.loyalty.account.entity.LoyaltyTierEntity;
import com.natcash.loyalty.account.repository.LoyaltyTierRepository;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.TierLevel;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import com.natcash.loyalty.audit.event.AuditLogEvent;
import com.natcash.loyalty.audit.service.SystemAuditLogService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/loyalty/v1/tiers")
@Tag(name = "Tier Management API", description = "Quản lý Cấu Hình Phân Hạng Hội Viên")
public class TierController {

    private final LoyaltyTierRepository tierRepository;
    private final SystemAuditLogService auditLogService;

    public TierController(LoyaltyTierRepository tierRepository, SystemAuditLogService auditLogService) {
        this.tierRepository = tierRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách hạng hội viên", description = "Trả về toàn bộ cấu hình 4 hạng hội viên từ cơ sở dữ liệu")
    public ResponseEntity<List<TierResponse>> getTiers(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<LoyaltyTierEntity> entities = tierRepository.findByTenantIdOrderByTierLevelAsc(tenantId);
        List<TierResponse> responses = entities.stream().map(e -> TierResponse.builder()
                .id(e.getId())
                .code(e.getCode())
                .name(e.getName())
                .tierLevel(e.getTierLevel())
                .minPoints(e.getMinPoints())
                .pointMultiplier(e.getPointMultiplier())
                .freeDailyTurns(e.getFreeDailyTurns())
                .description(e.getDescription())
                .status(e.getStatus())
                .build()
        ).collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @PostMapping
    @Operation(summary = "Cập nhật hoặc tạo mới hạng hội viên", description = "Dành cho Quản trị viên CMS điều chỉnh chính sách hạng")
    public ResponseEntity<TierResponse> saveTier(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody TierRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();

        LoyaltyTierEntity entity;
        String beforeJson = null;
        String operation = "INSERT";
        if (request.getId() != null) {
            entity = tierRepository.findById(request.getId()).orElse(new LoyaltyTierEntity());
            if (entity.getId() != null) {
                beforeJson = toTierJson(entity);
                operation = "UPDATE";
            }
        } else {
            entity = new LoyaltyTierEntity();
        }

        entity.setTenantId(tenantId);
        entity.setCode(request.getCode());
        entity.setName(request.getName());
        entity.setTierLevel(request.getTierLevel());
        entity.setMinPoints(request.getMinPoints());
        entity.setPointMultiplier(request.getPointMultiplier());
        entity.setFreeDailyTurns(request.getFreeDailyTurns());
        entity.setDescription(request.getDescription());
        entity.setStatus(request.getStatus() != null ? request.getStatus() : CommonStatus.ACTIVE);

        LoyaltyTierEntity saved = tierRepository.save(entity);

        auditLogService.recordActionAsync(AuditLogEvent.builder()
                .tenantId(tenantId)
                .module("TIER")
                .tableName("loyalty_tiers")
                .operation(operation)
                .entityId(saved.getCode() != null ? saved.getCode().name() : "TIER_" + saved.getId())
                .actorUsername(getActorUsername())
                .actorRole("ADMIN")
                .beforeData(beforeJson)
                .afterData(toTierJson(saved))
                .description("Cập nhật cấu hình hạng hội viên: " + saved.getName())
                .status("SUCCESS")
                .build());

        return ResponseEntity.ok(TierResponse.builder()
                .id(saved.getId())
                .code(saved.getCode())
                .name(saved.getName())
                .tierLevel(saved.getTierLevel())
                .minPoints(saved.getMinPoints())
                .pointMultiplier(saved.getPointMultiplier())
                .freeDailyTurns(saved.getFreeDailyTurns())
                .description(saved.getDescription())
                .status(saved.getStatus())
                .build());
    }

    private String getActorUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().isBlank()) {
                return auth.getName();
            }
        } catch (Exception ignored) {}
        return "admin";
    }

    private String toTierJson(LoyaltyTierEntity t) {
        if (t == null) return null;
        return String.format(
                "{\"code\":\"%s\",\"name\":\"%s\",\"tierLevel\":\"%s\",\"minPoints\":%s,\"pointMultiplier\":%s,\"status\":\"%s\"}",
                t.getCode() != null ? t.getCode().name() : "",
                t.getName() != null ? t.getName() : "",
                t.getTierLevel() != null ? String.valueOf(t.getTierLevel()) : "1",
                t.getMinPoints() != null ? t.getMinPoints().toString() : "0",
                t.getPointMultiplier() != null ? t.getPointMultiplier().toString() : "1.0",
                t.getStatus() != null ? t.getStatus().name() : "ACTIVE"
        );
    }


    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TierResponse {
        private Long id;
        private TierLevel code;
        private String name;
        private Integer tierLevel;
        private BigDecimal minPoints;
        private BigDecimal pointMultiplier;
        private Integer freeDailyTurns;
        private String description;
        private CommonStatus status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TierRequest {
        private Long id;
        private TierLevel code;
        private String name;
        private Integer tierLevel;
        private BigDecimal minPoints;
        private BigDecimal pointMultiplier;
        private Integer freeDailyTurns;
        private String description;
        private CommonStatus status;
    }
}
