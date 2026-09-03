package com.natcash.loyalty.wallet.controller;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.audit.event.AuditLogEvent;
import com.natcash.loyalty.audit.service.SystemAuditLogService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.PartnerType;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.wallet.entity.LoyaltyAcceptancePolicyEntity;
import com.natcash.loyalty.wallet.repository.LoyaltyAcceptancePolicyRepository;

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
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping(value = {"/loyalty/v1/policies", "/policies", "/v1/policies", "/api/loyalty/v1/policies"})
@Tag(name = "Policy Configuration API", description = "Quản lý Chính Sách Tích & Tiêu Điểm")
public class PolicyController {

    private final LoyaltyAcceptancePolicyRepository policyRepository;
    private final LoyaltyPartnerRepository partnerRepository;
    private final SystemAuditLogService auditLogService;

    public PolicyController(LoyaltyAcceptancePolicyRepository policyRepository,
                            LoyaltyPartnerRepository partnerRepository,
                            SystemAuditLogService auditLogService) {
        this.policyRepository = policyRepository;
        this.partnerRepository = partnerRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách chính sách tích tiêu điểm", description = "Trả về danh sách chính sách tích lũy và khấu trừ điểm tại các điểm bán")
    @Transactional
    public ResponseEntity<List<PolicyResponse>> getPolicies(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<LoyaltyAcceptancePolicyEntity> list = policyRepository.findByTenantId(tenantId);

        if (list.isEmpty()) {
            list = seedDefaultPolicies(tenantId);
        }

        List<PolicyResponse> responses = list.stream().map(this::mapEntityToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết chính sách", description = "Tra cứu thông tin chính sách theo ID")
    @Transactional(readOnly = true)
    public ResponseEntity<PolicyResponse> getPolicyById(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        LoyaltyAcceptancePolicyEntity entity = policyRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, "Không tìm thấy chính sách #" + id));
        return ResponseEntity.ok(mapEntityToResponse(entity));
    }

    @PostMapping
    @Operation(summary = "Tạo mới hoặc cập nhật chính sách theo đối tác", description = "Áp dụng cấu hình tích tiêu cho đối tác cụ thể")
    @Transactional
    public ResponseEntity<PolicyResponse> savePolicy(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody PolicyRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();

        LoyaltyPartnerEntity partner = null;
        if (request.getPartnerId() != null) {
            partner = partnerRepository.findByIdAndTenantId(request.getPartnerId(), tenantId)
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, "Không tìm thấy đối tác #" + request.getPartnerId()));
        } else if (request.getPartnerCode() != null) {
            partner = partnerRepository.findByTenantIdAndPartnerCode(tenantId, request.getPartnerCode())
                    .orElse(null);
        }

        Optional<LoyaltyAcceptancePolicyEntity> existingPolicyOpt = Optional.empty();
        if (partner != null) {
            existingPolicyOpt = policyRepository.findByTenantIdAndPartnerId(tenantId, partner.getId());
        }

        LoyaltyAcceptancePolicyEntity entity;
        String beforeJson = null;
        String operation = "INSERT";
        if (existingPolicyOpt.isPresent()) {
            entity = existingPolicyOpt.get();
            beforeJson = toPolicyJson(entity);
            operation = "UPDATE";
            if (request.getExchangeRate() != null) entity.setPointExchangeRate(request.getExchangeRate());
            if (request.getMaxBurnPercentage() != null) entity.setMaxBurnPercentage(request.getMaxBurnPercentage());
            if (request.getMinBillAmount() != null) entity.setMinBurnPoints(request.getMinBillAmount());
            if (request.getStatus() != null) entity.setStatus(request.getStatus());
            entity.setUpdatedAt(Instant.now());
        } else {
            entity = LoyaltyAcceptancePolicyEntity.builder()
                    .tenantId(tenantId)
                    .partner(partner)
                    .pointExchangeRate(request.getExchangeRate() != null ? request.getExchangeRate() : BigDecimal.ONE)
                    .maxBurnPercentage(request.getMaxBurnPercentage() != null ? request.getMaxBurnPercentage() : new BigDecimal("50.00"))
                    .minBurnPoints(request.getMinBillAmount() != null ? request.getMinBillAmount() : BigDecimal.TEN)
                    .maxBurnPointsPerDay(new BigDecimal("10000.00"))
                    .allowedPointTypes("ALL")
                    .status(request.getStatus() != null ? request.getStatus() : CommonStatus.ACTIVE)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
        }

        LoyaltyAcceptancePolicyEntity saved = policyRepository.save(entity);

        auditLogService.recordActionAsync(AuditLogEvent.builder()
                .tenantId(tenantId)
                .module("POLICY")
                .tableName("loyalty_acceptance_policies")
                .operation(operation)
                .entityId("POL_" + saved.getId())
                .actorUsername(getActorUsername())
                .actorRole("ADMIN")
                .beforeData(beforeJson)
                .afterData(toPolicyJson(saved))
                .description("Cấu hình chính sách tích/tiêu điểm đối tác #" + (partner != null ? partner.getPartnerName() : "ALL"))
                .status("SUCCESS")
                .build());

        return ResponseEntity.ok(mapEntityToResponse(saved));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật chính sách tích tiêu điểm", description = "Cập nhật thông tin chính sách trong cơ sở dữ liệu")
    @Transactional
    public ResponseEntity<PolicyResponse> updatePolicy(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody PolicyRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();

        LoyaltyAcceptancePolicyEntity entity = policyRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, "Không tìm thấy chính sách #" + id));

        String beforeJson = toPolicyJson(entity);

        if (request.getMaxBurnPercentage() != null) {
            entity.setMaxBurnPercentage(request.getMaxBurnPercentage());
        }
        if (request.getExchangeRate() != null) {
            entity.setPointExchangeRate(request.getExchangeRate());
        }
        if (request.getMinBillAmount() != null) {
            entity.setMinBurnPoints(request.getMinBillAmount());
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }
        entity.setUpdatedAt(Instant.now());

        LoyaltyAcceptancePolicyEntity updated = policyRepository.save(entity);

        auditLogService.recordActionAsync(AuditLogEvent.builder()
                .tenantId(tenantId)
                .module("POLICY")
                .tableName("loyalty_acceptance_policies")
                .operation("UPDATE")
                .entityId("POL_" + updated.getId())
                .actorUsername(getActorUsername())
                .actorRole("ADMIN")
                .beforeData(beforeJson)
                .afterData(toPolicyJson(updated))
                .description("Cập nhật chính sách tích/tiêu điểm #" + updated.getId())
                .status("SUCCESS")
                .build());

        return ResponseEntity.ok(mapEntityToResponse(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa chính sách", description = "Xóa chính sách khỏi cơ sở dữ liệu")
    @Transactional
    public ResponseEntity<Void> deletePolicy(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        policyRepository.findByIdAndTenantId(id, tenantId).ifPresent(pol -> {
            policyRepository.delete(pol);
            auditLogService.recordActionAsync(AuditLogEvent.builder()
                    .tenantId(tenantId)
                    .module("POLICY")
                    .tableName("loyalty_acceptance_policies")
                    .operation("DELETE")
                    .entityId("POL_" + pol.getId())
                    .actorUsername(getActorUsername())
                    .actorRole("ADMIN")
                    .beforeData(toPolicyJson(pol))
                    .afterData(null)
                    .description("Xóa chính sách tích/tiêu điểm #" + pol.getId())
                    .status("SUCCESS")
                    .build());
        });
        return ResponseEntity.ok().build();
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

    private String toPolicyJson(LoyaltyAcceptancePolicyEntity p) {
        if (p == null) return null;
        return String.format(
                "{\"id\":%d,\"exchangeRate\":%s,\"maxBurnPercentage\":%s,\"status\":\"%s\"}",
                p.getId(),
                p.getPointExchangeRate() != null ? p.getPointExchangeRate().toString() : "1.0",
                p.getMaxBurnPercentage() != null ? p.getMaxBurnPercentage().toString() : "50.0",
                p.getStatus() != null ? p.getStatus().name() : "ACTIVE"
        );
    }

    private PolicyResponse mapEntityToResponse(LoyaltyAcceptancePolicyEntity entity) {
        String partnerCode = "N/A";
        String partnerName = "N/A";
        Long partnerId = null;
        if (entity.getPartner() != null) {
            partnerId = entity.getPartner().getId();
            partnerCode = entity.getPartner().getPartnerCode() != null ? entity.getPartner().getPartnerCode() : "N/A";
            partnerName = entity.getPartner().getPartnerName() != null ? entity.getPartner().getPartnerName() : "N/A";
        }
        return PolicyResponse.builder()
                .id(entity.getId())
                .code("POLICY_" + entity.getId())
                .name("Chính Sách Tiêu Điểm " + partnerName)
                .partnerId(partnerId)
                .partnerCode(partnerCode)
                .partnerName(partnerName)
                .type("BURN")
                .earnRatePercent(BigDecimal.ONE)
                .exchangeRate(entity.getPointExchangeRate() != null ? entity.getPointExchangeRate() : BigDecimal.ONE)
                .minBillAmount(entity.getMinBurnPoints() != null ? entity.getMinBurnPoints() : BigDecimal.TEN)
                .maxBurnPercentage(entity.getMaxBurnPercentage() != null ? entity.getMaxBurnPercentage() : new BigDecimal("50.00"))
                .status(entity.getStatus() != null ? entity.getStatus() : CommonStatus.ACTIVE)
                .description(entity.getMaxBurnPercentage() != null ? "Quy định khấu trừ tối đa " + entity.getMaxBurnPercentage() + "% hóa đơn" : "Chính sách điểm")
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : Instant.now().toString())
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : Instant.now().toString())
                .build();
    }

    private List<LoyaltyAcceptancePolicyEntity> seedDefaultPolicies(String tenantId) {
        List<LoyaltyPartnerEntity> partners = partnerRepository.findByTenantId(tenantId);
        if (partners.isEmpty()) {
            partners = new ArrayList<>();
            partners.add(partnerRepository.save(LoyaltyPartnerEntity.builder()
                    .tenantId(tenantId)
                    .partnerCode("DELIMART_RETAIL")
                    .partnerName("Hệ Thống Siêu Thị Delimart")
                    .partnerType(PartnerType.RETAIL)
                    .apiKey("pk_live_delimart_" + System.currentTimeMillis())
                    .secretKey("sk_live_delimart_secret")
                    .status(CommonStatus.ACTIVE)
                    .build()));
            partners.add(partnerRepository.save(LoyaltyPartnerEntity.builder()
                    .tenantId(tenantId)
                    .partnerCode("NATCOM_TELCO")
                    .partnerName("Tổng Công Ty Viễn Thông Natcom")
                    .partnerType(PartnerType.TELECOM)
                    .apiKey("pk_live_natcom_" + System.currentTimeMillis())
                    .secretKey("sk_live_natcom_secret")
                    .status(CommonStatus.ACTIVE)
                    .build()));
        }

        List<LoyaltyAcceptancePolicyEntity> defaults = new ArrayList<>();
        for (LoyaltyPartnerEntity partner : partners) {
            Optional<LoyaltyAcceptancePolicyEntity> exist = policyRepository.findByTenantIdAndPartnerId(tenantId, partner.getId());
            if (exist.isEmpty()) {
                BigDecimal maxBurn = "NATCOM_TELCO".equalsIgnoreCase(partner.getPartnerCode()) ? new BigDecimal("100.00") : new BigDecimal("50.00");
                defaults.add(LoyaltyAcceptancePolicyEntity.builder()
                        .tenantId(tenantId)
                        .partner(partner)
                        .pointExchangeRate(BigDecimal.ONE)
                        .maxBurnPercentage(maxBurn)
                        .minBurnPoints(new BigDecimal("10.00"))
                        .maxBurnPointsPerDay(new BigDecimal("10000.00"))
                        .allowedPointTypes("ALL")
                        .status(CommonStatus.ACTIVE)
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build());
            }
        }
        if (!defaults.isEmpty()) {
            return policyRepository.saveAll(defaults);
        }
        return policyRepository.findByTenantId(tenantId);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PolicyRequest {
        private Long partnerId;
        private String partnerCode;
        private String partnerName;
        private BigDecimal earnRatePercent;
        private BigDecimal exchangeRate;
        private BigDecimal minBillAmount;
        private BigDecimal maxBurnPercentage;
        private CommonStatus status;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PolicyResponse {
        private Long id;
        private String code;
        private String name;
        private Long partnerId;
        private String partnerCode;
        private String partnerName;
        private String type;
        private BigDecimal earnRatePercent;
        private BigDecimal exchangeRate;
        private BigDecimal minBillAmount;
        private BigDecimal maxBurnPercentage;
        private CommonStatus status;
        private String description;
        private String createdAt;
        private String updatedAt;
    }
}
