package com.natcash.loyalty.wallet.controller;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.audit.event.AuditLogEvent;
import com.natcash.loyalty.audit.service.SystemAuditLogService;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.constant.SecurityConstants;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.SettlementCycle;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.util.MessageUtils;
import com.natcash.loyalty.wallet.entity.LoyaltyAcceptancePolicyEntity;
import com.natcash.loyalty.wallet.repository.LoyaltyAcceptancePolicyRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping(value = {"/loyalty/v1/policies", "/policies", "/v1/policies", "/api/loyalty/v1/policies"})
@Tag(name = "Policy Configuration API", description = "Earn and Burn Policy Configuration Management")
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
    @Operation(summary = "Get point policy rules list", description = "Return earn and burn policy rules for merchant POS")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PolicyResponse>> getPolicies(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<LoyaltyAcceptancePolicyEntity> list = policyRepository.findByTenantId(tenantId);
        List<PolicyResponse> responses = list.stream().map(this::mapEntityToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get policy rule details", description = "Look up policy rule details by ID")
    @Transactional(readOnly = true)
    public ResponseEntity<PolicyResponse> getPolicyById(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        LoyaltyAcceptancePolicyEntity entity = policyRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, MessageUtils.getMessage("policy.not_found_id", id)));
        return ResponseEntity.ok(mapEntityToResponse(entity));
    }

    @PostMapping
    @Operation(summary = "Create or update policy rule", description = "Configure earn/burn rules for specific partner")
    @Transactional
    public ResponseEntity<PolicyResponse> savePolicy(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody PolicyRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();

        LoyaltyPartnerEntity partner = null;
        if (request.getPartnerId() != null) {
            partner = partnerRepository.findByIdAndTenantId(request.getPartnerId(), tenantId)
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, MessageUtils.getMessage("partner.not_found_id", request.getPartnerId())));
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
                    .pointExchangeRate(request.getExchangeRate() != null
                            ? request.getExchangeRate()
                            : SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.LOYALTY_POINT_EXCHANGE_RATE_HTG))
                    .maxBurnPercentage(request.getMaxBurnPercentage() != null
                            ? request.getMaxBurnPercentage()
                            : SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.MAX_DAILY_BURN_PERCENTAGE))
                    .minBurnPoints(request.getMinBillAmount() != null ? request.getMinBillAmount() : BigDecimal.TEN)
                    .maxBurnPointsPerDay(SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.MAX_BURN_POINTS_PER_DAY))
                    .maxBurnPointsPerTx(request.getMaxBurnPointsPerTx() != null
                            ? request.getMaxBurnPointsPerTx()
                            : SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.MAX_BURN_POINTS_PER_TX))
                    .commissionRatePercent(request.getCommissionRatePercent() != null ? request.getCommissionRatePercent() : BigDecimal.ZERO)
                    .fixedFeePerTx(request.getFixedFeePerTx() != null ? request.getFixedFeePerTx() : BigDecimal.ZERO)
                    .settlementCreditLimit(request.getSettlementCreditLimit() != null
                            ? request.getSettlementCreditLimit()
                            : SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.CLEARING_DEBT_LIMIT_HTG))
                    .settlementCycle(request.getSettlementCycle() != null ? SettlementCycle.fromCode(request.getSettlementCycle()) : SettlementCycle.DAILY)
                    .allowedPointTypes(LoyaltyConstants.FILTER_ALL)
                    .status(request.getStatus() != null ? request.getStatus() : CommonStatus.ACTIVE)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
        }

        if (request.getCommissionRatePercent() != null) entity.setCommissionRatePercent(request.getCommissionRatePercent());
        if (request.getFixedFeePerTx() != null) entity.setFixedFeePerTx(request.getFixedFeePerTx());
        if (request.getMaxBurnPointsPerTx() != null) entity.setMaxBurnPointsPerTx(request.getMaxBurnPointsPerTx());
        if (request.getSettlementCreditLimit() != null) entity.setSettlementCreditLimit(request.getSettlementCreditLimit());
        if (request.getSettlementCycle() != null) entity.setSettlementCycle(SettlementCycle.fromCode(request.getSettlementCycle()));

        LoyaltyAcceptancePolicyEntity saved = policyRepository.save(entity);

        auditLogService.recordActionAsync(AuditLogEvent.builder()
                .tenantId(tenantId)
                .module("POLICY")
                .tableName("loyalty_acceptance_policies")
                .operation(operation)
                .entityId("POL_" + saved.getId())
                .actorUsername(getActorUsername())
                .actorRole(SecurityConstants.ROLE_LOYALTY_ADMIN)
                .beforeData(beforeJson)
                .afterData(toPolicyJson(saved))
                .description(MessageUtils.getMessage(
                        "policy.audit.configure",
                        partner != null ? partner.getPartnerName() : LoyaltyConstants.FILTER_ALL))
                .status(CommonStatus.SUCCESS.name())
                .build());

        return ResponseEntity.ok(mapEntityToResponse(saved));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update policy rule", description = "Update policy rule details in database")
    @Transactional
    public ResponseEntity<PolicyResponse> updatePolicy(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody PolicyRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();

        LoyaltyAcceptancePolicyEntity entity = policyRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, MessageUtils.getMessage("policy.not_found_id", id)));

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
        if (request.getCommissionRatePercent() != null) {
            entity.setCommissionRatePercent(request.getCommissionRatePercent());
        }
        if (request.getFixedFeePerTx() != null) {
            entity.setFixedFeePerTx(request.getFixedFeePerTx());
        }
        if (request.getMaxBurnPointsPerTx() != null) {
            entity.setMaxBurnPointsPerTx(request.getMaxBurnPointsPerTx());
        }
        if (request.getSettlementCreditLimit() != null) {
            entity.setSettlementCreditLimit(request.getSettlementCreditLimit());
        }
        if (request.getSettlementCycle() != null) {
            entity.setSettlementCycle(SettlementCycle.fromCode(request.getSettlementCycle()));
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
                .actorRole(SecurityConstants.ROLE_LOYALTY_ADMIN)
                .beforeData(beforeJson)
                .afterData(toPolicyJson(updated))
                .description(MessageUtils.getMessage("policy.audit.update", updated.getId()))
                .status(CommonStatus.SUCCESS.name())
                .build());

        return ResponseEntity.ok(mapEntityToResponse(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete policy rule", description = "Delete policy rule from database")
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
                    .actorRole(SecurityConstants.ROLE_LOYALTY_ADMIN)
                    .beforeData(toPolicyJson(pol))
                    .afterData(null)
                    .description(MessageUtils.getMessage("policy.audit.delete", pol.getId()))
                    .status(CommonStatus.SUCCESS.name())
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
        return SecurityConstants.SYSTEM_ACTOR;
    }

    private String toPolicyJson(LoyaltyAcceptancePolicyEntity p) {
        if (p == null) return null;
        return String.format(
                "{\"id\":%d,\"exchangeRate\":%s,\"maxBurnPercentage\":%s,\"status\":\"%s\"}",
                p.getId(),
                p.getPointExchangeRate() != null ? p.getPointExchangeRate().toString() : "1.0",
                p.getMaxBurnPercentage() != null
                        ? p.getMaxBurnPercentage().toString()
                        : SystemParameterService.get().getDecimal(p.getTenantId(), SystemParamSpec.MAX_DAILY_BURN_PERCENTAGE).toString(),
                p.getStatus() != null ? p.getStatus().name() : ""
        );
    }

    private PolicyResponse mapEntityToResponse(LoyaltyAcceptancePolicyEntity entity) {
        String partnerCode = null;
        String partnerName = null;
        Long partnerId = null;
        if (entity.getPartner() != null) {
            partnerId = entity.getPartner().getId();
            partnerCode = entity.getPartner().getPartnerCode();
            partnerName = entity.getPartner().getPartnerName();
        }
        return PolicyResponse.builder()
                .id(entity.getId())
                .code("POLICY_" + entity.getId())
                .name(partnerName != null ? MessageUtils.getMessage("policy.default_name", partnerName) : "POLICY_" + entity.getId())
                .partnerId(partnerId)
                .partnerCode(partnerCode)
                .partnerName(partnerName)
                .type(PointActionType.BURN.name())
                .earnRatePercent(BigDecimal.ONE)
                .exchangeRate(entity.getPointExchangeRate())
                .minBillAmount(entity.getMinBurnPoints())
                .maxBurnPercentage(entity.getMaxBurnPercentage())
                .commissionRatePercent(entity.getCommissionRatePercent())
                .fixedFeePerTx(entity.getFixedFeePerTx())
                .maxBurnPointsPerTx(entity.getMaxBurnPointsPerTx())
                .settlementCreditLimit(entity.getSettlementCreditLimit())
                .settlementCycle(entity.getSettlementCycle() != null ? entity.getSettlementCycle().getCode() : null)
                .status(entity.getStatus())
                .description(entity.getMaxBurnPercentage() != null ? MessageUtils.getMessage("policy.max_burn_desc", entity.getMaxBurnPercentage()) : null)
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null)
                .build();
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
        private BigDecimal commissionRatePercent;
        private BigDecimal fixedFeePerTx;
        private BigDecimal maxBurnPointsPerTx;
        private BigDecimal settlementCreditLimit;
        private String settlementCycle;
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
        private BigDecimal commissionRatePercent;
        private BigDecimal fixedFeePerTx;
        private BigDecimal maxBurnPointsPerTx;
        private BigDecimal settlementCreditLimit;
        private String settlementCycle;
        private CommonStatus status;
        private String description;
        private String createdAt;
        private String updatedAt;
    }
}
