package com.natcash.loyalty.wallet.controller;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.audit.event.AuditLogEvent;
import com.natcash.loyalty.audit.service.SystemAuditLogService;
import com.natcash.loyalty.codegeneration.domain.CodeType;
import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.SecurityConstants;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.PartnerType;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.util.MessageUtils;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = { "/loyalty/v1/partners", "/api/v1/partners", "/partners" })
@Tag(name = "Partner Management API", description = "Alliance Partners Management (CRUD)")
public class PartnerController {

    private final LoyaltyPartnerRepository partnerRepository;
    private final SystemAuditLogService auditLogService;

    public PartnerController(LoyaltyPartnerRepository partnerRepository, SystemAuditLogService auditLogService) {
        this.partnerRepository = partnerRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "Get alliance partners list", description = "Return partners list from DB filtered by tenant")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PartnerResponse>> getPartners(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<LoyaltyPartnerEntity> list = partnerRepository.findByTenantId(tenantId);
        List<PartnerResponse> responses = list.stream().map(this::mapToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get partner details", description = "Look up partner information by ID")
    @Transactional(readOnly = true)
    public ResponseEntity<PartnerResponse> getPartnerById(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        LoyaltyPartnerEntity entity = partnerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, MessageUtils.getMessage("partner.not_found_id", id)));
        return ResponseEntity.ok(mapToResponse(entity));
    }

    @PostMapping
    @Operation(summary = "Create alliance partner", description = "Create new partner profile in the loyalty ecosystem")
    @Transactional
    public ResponseEntity<PartnerResponse> createPartner(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody PartnerRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();

        String partnerCode = request.getPartnerCode() != null && !request.getPartnerCode().isBlank()
                ? request.getPartnerCode().toUpperCase().trim()
                : CentralizedCodeGeneratorService.get().generateCode(CodeType.PARTNER);

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
            } catch (Exception ignored) {
            }
        }

        CommonStatus status = CommonStatus.ACTIVE;
        if (request.getStatus() != null) {
            CommonStatus parsedStatus = CommonStatus.fromCode(String.valueOf(request.getStatus()).trim());
            if (parsedStatus != null) {
                status = parsedStatus;
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
                .ipWhitelist(request.getIpWhitelist())
                .status(status)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        LoyaltyPartnerEntity saved = partnerRepository.save(entity);

        // Automatically record system audit log
        auditLogService.recordActionAsync(AuditLogEvent.builder()
                .tenantId(tenantId)
                .module("PARTNER")
                .tableName("loyalty_partners")
                .operation("INSERT")
                .entityId(saved.getPartnerCode())
                .actorUsername(getActorUsername())
                .actorRole(SecurityConstants.ROLE_LOYALTY_ADMIN)
                .beforeData(null)
                .afterData(toPartnerJson(saved))
                .description(
                        MessageUtils.getMessage("partner.audit.create", saved.getPartnerName(), saved.getPartnerCode()))
                .status(CommonStatus.SUCCESS.name())
                .build());

        return ResponseEntity.ok(mapToResponse(saved));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update alliance partner", description = "Update partner information and settings")
    @Transactional
    public ResponseEntity<PartnerResponse> updatePartner(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody PartnerRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        LoyaltyPartnerEntity entity = partnerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, MessageUtils.getMessage("partner.not_found_id", id)));

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
            CommonStatus parsedStatus = CommonStatus.fromCode(String.valueOf(request.getStatus()).trim());
            entity.setStatus(parsedStatus != null ? parsedStatus : CommonStatus.ACTIVE);
        }

        entity.setUpdatedAt(Instant.now());
        LoyaltyPartnerEntity saved = partnerRepository.save(entity);

        // Automatically record system audit log
        auditLogService.recordActionAsync(AuditLogEvent.builder()
                .tenantId(tenantId)
                .module("PARTNER")
                .tableName("loyalty_partners")
                .operation("UPDATE")
                .entityId(saved.getPartnerCode())
                .actorUsername(getActorUsername())
                .actorRole(SecurityConstants.ROLE_LOYALTY_ADMIN)
                .beforeData(beforeJson)
                .afterData(toPartnerJson(saved))
                .description(MessageUtils.getMessage("partner.audit.update", saved.getPartnerName(), saved.getPartnerCode()))
                .status(CommonStatus.SUCCESS.name())
                .build());

        return ResponseEntity.ok(mapToResponse(saved));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete partner", description = "Remove or deactivate partner from system")
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
                    .actorRole(SecurityConstants.ROLE_LOYALTY_ADMIN)
                    .beforeData(toPartnerJson(p))
                    .afterData(null)
                    .description(
                            MessageUtils.getMessage("partner.audit.delete", p.getPartnerName(), p.getPartnerCode()))
                    .status(CommonStatus.SUCCESS.name())
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
        } catch (Exception ignored) {
        }
        return SecurityConstants.SYSTEM_ACTOR;
    }

    private String toPartnerJson(LoyaltyPartnerEntity p) {
        if (p == null)
            return null;
        return String.format(
                "{\"partnerCode\":\"%s\",\"partnerName\":\"%s\",\"partnerType\":\"%s\",\"apiKey\":\"%s\",\"status\":\"%s\",\"webhookUrl\":\"%s\"}",
                escapeJson(p.getPartnerCode()),
                escapeJson(p.getPartnerName()),
                p.getPartnerType() != null ? p.getPartnerType().name() : "",
                escapeJson(p.getApiKey()),
                p.getStatus() != null ? p.getStatus().name() : "",
                escapeJson(p.getWebhookUrl()));
    }

    private String escapeJson(String str) {
        if (str == null)
            return "";
        return str.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private PartnerResponse mapToResponse(LoyaltyPartnerEntity p) {
        return PartnerResponse.builder()
                .id(p.getId())
                .partnerCode(p.getPartnerCode())
                .partnerName(p.getPartnerName())
                .partnerType(p.getPartnerType() != null ? p.getPartnerType().name() : null)
                .apiKey(p.getApiKey())
                .secretKey(p.getSecretKey())
                .webhookUrl(p.getWebhookUrl())
                .webhookSecret(p.getWebhookSecret())
                .ipWhitelist(p.getIpWhitelist())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .createdAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null)
                .updatedAt(p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null)
                .build();
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
