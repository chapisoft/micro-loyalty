package com.natcash.loyalty.wallet.controller;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.PartnerType;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.natcash.loyalty.audit.event.AuditLogEvent;
import com.natcash.loyalty.audit.service.SystemAuditLogService;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = {"/loyalty/v1/partners", "/api/v1/partners", "/partners"})
@Tag(name = "Partner Management API", description = "Quản lý Đối Tác Liên Minh (CRUD)")
public class PartnerController {

    private final LoyaltyPartnerRepository partnerRepository;
    private final SystemAuditLogService auditLogService;

    public PartnerController(LoyaltyPartnerRepository partnerRepository, SystemAuditLogService auditLogService) {
        this.partnerRepository = partnerRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách đối tác liên minh", description = "Trả về danh sách đối tác từ DB theo tenant")
    @Transactional
    public ResponseEntity<List<PartnerResponse>> getPartners(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<LoyaltyPartnerEntity> list = partnerRepository.findByTenantId(tenantId);

        // Seed default partners if empty
        if (list.isEmpty()) {
            list = seedDefaultPartners(tenantId);
        }

        List<PartnerResponse> responses = list.stream().map(this::mapToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết đối tác", description = "Tra cứu thông tin đối tác theo ID")
    @Transactional(readOnly = true)
    public ResponseEntity<PartnerResponse> getPartnerById(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        LoyaltyPartnerEntity entity = partnerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, "Không tìm thấy đối tác #" + id));
        return ResponseEntity.ok(mapToResponse(entity));
    }

    @PostMapping
    @Operation(summary = "Thêm đối tác liên minh mới", description = "Dành cho Quản trị viên CMS tạo đối tác mới")
    @Transactional
    public ResponseEntity<PartnerResponse> createPartner(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody PartnerRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();

        String partnerCode = request.getPartnerCode() != null && !request.getPartnerCode().isBlank()
                ? request.getPartnerCode().toUpperCase().trim()
                : "PARTNER_" + System.currentTimeMillis();

        String apiKey = request.getApiKey() != null && !request.getApiKey().isBlank()
                ? request.getApiKey()
                : "pk_live_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        String secretKey = request.getSecretKey() != null && !request.getSecretKey().isBlank()
                ? request.getSecretKey()
                : "sk_live_" + UUID.randomUUID().toString().replace("-", "");

        PartnerType pType = PartnerType.RETAIL;
        if (request.getPartnerType() != null) {
            try {
                pType = PartnerType.valueOf(request.getPartnerType().toUpperCase().trim());
            } catch (Exception ignored) {}
        }

        CommonStatus status = CommonStatus.ACTIVE;
        if (request.getStatus() != null) {
            String s = String.valueOf(request.getStatus()).trim();
            if ("0".equals(s) || "INACTIVE".equalsIgnoreCase(s)) {
                status = CommonStatus.INACTIVE;
            }
        }

        LoyaltyPartnerEntity entity = LoyaltyPartnerEntity.builder()
                .tenantId(tenantId)
                .partnerCode(partnerCode)
                .partnerName(request.getPartnerName() != null ? request.getPartnerName() : partnerCode)
                .partnerType(pType)
                .apiKey(apiKey)
                .secretKey(secretKey)
                .webhookUrl(request.getWebhookUrl())
                .webhookSecret(request.getWebhookSecret())
                .ipWhitelist(request.getIpWhitelist() != null ? request.getIpWhitelist() : "0.0.0.0/0")
                .status(status)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        LoyaltyPartnerEntity saved = partnerRepository.save(entity);

        // Tự động ghi vết kiểm toán hệ thống
        auditLogService.recordActionAsync(AuditLogEvent.builder()
                .tenantId(tenantId)
                .module("PARTNER")
                .tableName("loyalty_partners")
                .operation("INSERT")
                .entityId(saved.getPartnerCode())
                .actorUsername(getActorUsername())
                .actorRole("ADMIN")
                .beforeData(null)
                .afterData(toPartnerJson(saved))
                .description("Thêm mới đối tác liên minh: " + saved.getPartnerName() + " (" + saved.getPartnerCode() + ")")
                .status("SUCCESS")
                .build());

        return ResponseEntity.ok(mapToResponse(saved));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin đối tác liên minh", description = "Dành cho Quản trị viên CMS")
    @Transactional
    public ResponseEntity<PartnerResponse> updatePartner(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody PartnerRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        LoyaltyPartnerEntity entity = partnerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, "Không tìm thấy đối tác #" + id));

        String beforeJson = toPartnerJson(entity);

        if (request.getPartnerName() != null) entity.setPartnerName(request.getPartnerName());
        if (request.getPartnerCode() != null) entity.setPartnerCode(request.getPartnerCode().toUpperCase().trim());
        if (request.getApiKey() != null && !request.getApiKey().isBlank()) entity.setApiKey(request.getApiKey());
        if (request.getSecretKey() != null && !request.getSecretKey().isBlank()) entity.setSecretKey(request.getSecretKey());
        if (request.getWebhookUrl() != null) entity.setWebhookUrl(request.getWebhookUrl());
        if (request.getWebhookSecret() != null) entity.setWebhookSecret(request.getWebhookSecret());
        if (request.getIpWhitelist() != null) entity.setIpWhitelist(request.getIpWhitelist());

        if (request.getPartnerType() != null) {
            try {
                entity.setPartnerType(PartnerType.valueOf(request.getPartnerType().toUpperCase().trim()));
            } catch (Exception ignored) {}
        }

        if (request.getStatus() != null) {
            String s = String.valueOf(request.getStatus()).trim();
            if ("0".equals(s) || "INACTIVE".equalsIgnoreCase(s)) {
                entity.setStatus(CommonStatus.INACTIVE);
            } else {
                entity.setStatus(CommonStatus.ACTIVE);
            }
        }

        entity.setUpdatedAt(Instant.now());
        LoyaltyPartnerEntity saved = partnerRepository.save(entity);

        // Tự động ghi vết kiểm toán hệ thống
        auditLogService.recordActionAsync(AuditLogEvent.builder()
                .tenantId(tenantId)
                .module("PARTNER")
                .tableName("loyalty_partners")
                .operation("UPDATE")
                .entityId(saved.getPartnerCode())
                .actorUsername(getActorUsername())
                .actorRole("ADMIN")
                .beforeData(beforeJson)
                .afterData(toPartnerJson(saved))
                .description("Cập nhật thông tin đối tác liên minh: " + saved.getPartnerName() + " (" + saved.getPartnerCode() + ")")
                .status("SUCCESS")
                .build());

        return ResponseEntity.ok(mapToResponse(saved));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa đối tác", description = "Xóa hoặc vô hiệu hóa đối tác")
    @Transactional
    public ResponseEntity<Void> deletePartner(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        partnerRepository.findByIdAndTenantId(id, tenantId).ifPresent(p -> {
            partnerRepository.delete(p);
            auditLogService.recordActionAsync(AuditLogEvent.builder()
                    .tenantId(tenantId)
                    .module("PARTNER")
                    .tableName("loyalty_partners")
                    .operation("DELETE")
                    .entityId(p.getPartnerCode())
                    .actorUsername(getActorUsername())
                    .actorRole("ADMIN")
                    .beforeData(toPartnerJson(p))
                    .afterData(null)
                    .description("Xóa đối tác liên minh: " + p.getPartnerName() + " (" + p.getPartnerCode() + ")")
                    .status("SUCCESS")
                    .build());
        });
        return ResponseEntity.noContent().build();
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

    private String toPartnerJson(LoyaltyPartnerEntity p) {
        if (p == null) return null;
        return String.format(
                "{\"partnerCode\":\"%s\",\"partnerName\":\"%s\",\"partnerType\":\"%s\",\"apiKey\":\"%s\",\"status\":\"%s\",\"webhookUrl\":\"%s\"}",
                escapeJson(p.getPartnerCode()),
                escapeJson(p.getPartnerName()),
                p.getPartnerType() != null ? p.getPartnerType().name() : "RETAIL",
                escapeJson(p.getApiKey()),
                p.getStatus() != null ? p.getStatus().name() : "ACTIVE",
                escapeJson(p.getWebhookUrl())
        );
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\").replace("\"", "\\\"");
    }


    private PartnerResponse mapToResponse(LoyaltyPartnerEntity p) {
        return PartnerResponse.builder()
                .id(p.getId())
                .partnerCode(p.getPartnerCode())
                .partnerName(p.getPartnerName())
                .partnerType(p.getPartnerType() != null ? p.getPartnerType().name() : "RETAIL")
                .apiKey(p.getApiKey())
                .secretKey(p.getSecretKey())
                .webhookUrl(p.getWebhookUrl())
                .webhookSecret(p.getWebhookSecret())
                .ipWhitelist(p.getIpWhitelist())
                .status(p.getStatus() != null ? p.getStatus().name() : "ACTIVE")
                .createdAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null)
                .updatedAt(p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null)
                .build();
    }

    private List<LoyaltyPartnerEntity> seedDefaultPartners(String tenantId) {
        List<LoyaltyPartnerEntity> defaults = new ArrayList<>();
        defaults.add(LoyaltyPartnerEntity.builder()
                .tenantId(tenantId)
                .partnerCode("DELIMART_RETAIL")
                .partnerName("Hệ Thống Siêu Thị Delimart")
                .partnerType(PartnerType.RETAIL)
                .apiKey("pk_live_delimart_01")
                .secretKey("sk_live_delimart_secret_01")
                .ipWhitelist("0.0.0.0/0")
                .status(CommonStatus.ACTIVE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());
        defaults.add(LoyaltyPartnerEntity.builder()
                .tenantId(tenantId)
                .partnerCode("NATCOM_TELCO")
                .partnerName("Tổng Công Ty Viễn Thông Natcom")
                .partnerType(PartnerType.TELECOM)
                .apiKey("pk_live_natcom_01")
                .secretKey("sk_live_natcom_secret_01")
                .ipWhitelist("0.0.0.0/0")
                .status(CommonStatus.ACTIVE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());
        defaults.add(LoyaltyPartnerEntity.builder()
                .tenantId(tenantId)
                .partnerCode("NATCASH_WALLET")
                .partnerName("Ví Điện Tử Natcash Haïti")
                .partnerType(PartnerType.BANKING)
                .apiKey("pk_live_natcash_01")
                .secretKey("sk_live_natcash_secret_01")
                .ipWhitelist("0.0.0.0/0")
                .status(CommonStatus.ACTIVE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());
        return partnerRepository.saveAll(defaults);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerRequest {
        private String partnerCode;
        private String partnerName;
        private String partnerType;
        private String apiKey;
        private String secretKey;
        private String webhookUrl;
        private String webhookSecret;
        private String ipWhitelist;
        private Object status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerResponse {
        private Long id;
        private String partnerCode;
        private String partnerName;
        private String partnerType;
        private String apiKey;
        private String secretKey;
        private String webhookUrl;
        private String webhookSecret;
        private String ipWhitelist;
        private String status;
        private String createdAt;
        private String updatedAt;
    }
}
