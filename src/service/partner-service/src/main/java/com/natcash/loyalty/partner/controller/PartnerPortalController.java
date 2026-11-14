package com.natcash.loyalty.partner.controller;

import com.natcash.loyalty.clearing.entity.ClearingPaymentBatchEntity;
import com.natcash.loyalty.clearing.entity.LoyaltyClearingDisputeEntity;
import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.engagement.entity.PartnerNotificationEntity;
import com.natcash.loyalty.partner.entity.PartnerBranchEntity;
import com.natcash.loyalty.partner.entity.PartnerProductGroupEntity;
import com.natcash.loyalty.partner.entity.PartnerStaffAccountEntity;
import com.natcash.loyalty.partner.service.PartnerApiKeyService.PartnerApiKeyDto;
import com.natcash.loyalty.partner.service.PartnerOwnershipGuard;
import com.natcash.loyalty.partner.service.PartnerPortalService;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;

import com.fasterxml.jackson.annotation.JsonAlias;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/loyalty/v1/partner-portal")
@RequiredArgsConstructor
@Tag(name = "Partner Portal API", description = "Cổng tự phục vụ Đối tác Liên minh (NS-04, LM-08..11, QT-03, QT-06, CN-08)")
public class PartnerPortalController {

    private final PartnerPortalService portalService;
    private final PartnerOwnershipGuard ownershipGuard;

    @GetMapping("/dashboard")
    @Operation(summary = "Dashboard đối tác")
    public ResponseEntity<Map<String, Object>> getDashboard(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.getDashboard(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @GetMapping("/branches")
    public ResponseEntity<List<PartnerBranchEntity>> listBranches(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listBranches(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/branches")
    public ResponseEntity<PartnerBranchEntity> createBranch(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @RequestBody PartnerBranchEntity request) {
        return ResponseEntity.ok(portalService.createBranch(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId), request));
    }

    @GetMapping("/product-groups")
    public ResponseEntity<List<PartnerProductGroupEntity>> listProductGroups(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listProductGroups(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/product-groups")
    public ResponseEntity<PartnerProductGroupEntity> createProductGroup(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @RequestBody PartnerProductGroupEntity request) {
        return ResponseEntity.ok(portalService.createProductGroup(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId), request));
    }

    @GetMapping("/policies")
    public ResponseEntity<List<Map<String, Object>>> listPolicies(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listPolicies(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @GetMapping("/staff")
    public ResponseEntity<List<PartnerStaffAccountEntity>> listStaff(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listStaff(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/staff")
    public ResponseEntity<PartnerStaffAccountEntity> createStaff(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @RequestBody PartnerStaffAccountEntity request) {
        return ResponseEntity.ok(portalService.createStaff(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId), request));
    }

    @GetMapping("/proposals")
    public ResponseEntity<List<Map<String, Object>>> listProposals(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listProposals(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/proposals")
    public ResponseEntity<Map<String, Object>> submitProposal(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(portalService.submitProposal(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId), request));
    }

    @GetMapping("/vouchers")
    public ResponseEntity<List<LoyaltyVoucherEntity>> listVouchers(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listPartnerVouchers(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/vouchers/redeem-counter")
    public ResponseEntity<Map<String, Object>> redeemCounterVoucher(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @RequestBody CounterRedeemRequest request) {
        String code = (request.getRedemptionCode() != null && !request.getRedemptionCode().isBlank())
                ? request.getRedemptionCode()
                : request.getVoucherCode();
        return ResponseEntity.ok(portalService.redeemCounterVoucher(
                resolveTenantId(headerTenantId),
                resolvePartnerId(headerPartnerId, paramPartnerId),
                code,
                request.getBranchId(),
                request.getBranchCode(),
                request.getCustomerPhone()));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<Map<String, Object>>> listTransactions(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @RequestParam(value = "actionType", required = false) String actionType,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "fromDate", required = false) String fromDate,
            @RequestParam(value = "toDate", required = false) String toDate) {
        String effectiveKw = (keyword != null && !keyword.isBlank()) ? keyword : search;
        return ResponseEntity.ok(portalService.listPartnerTransactions(
                resolveTenantId(headerTenantId),
                resolvePartnerId(headerPartnerId, paramPartnerId),
                actionType,
                effectiveKw,
                fromDate,
                toDate));
    }

    @GetMapping("/settlements")
    public ResponseEntity<List<Map<String, Object>>> listSettlements(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listSettlements(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/settlements/{batchCode}/confirm")
    public ResponseEntity<ClearingPaymentBatchEntity> confirmSettlement(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @PathVariable("batchCode") String batchCode,
            @RequestBody(required = false) ConfirmSettlementRequest request) {
        String actor = request != null ? request.getConfirmedBy() : null;
        return ResponseEntity.ok(portalService.confirmSettlement(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId), batchCode, actor));
    }

    @PostMapping("/settlements/{batchCode}/claim")
    public ResponseEntity<LoyaltyClearingDisputeEntity> submitClaim(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @PathVariable("batchCode") String batchCode,
            @RequestBody SettlementClaimRequest request) {
        return ResponseEntity.ok(portalService.submitSettlementClaim(
                resolveTenantId(headerTenantId),
                resolvePartnerId(headerPartnerId, paramPartnerId),
                batchCode,
                request.getDisputeType(),
                request.getPartnerAmount(),
                request.getLoyaltyAmount(),
                request.getResolutionNote()));
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<PartnerNotificationEntity>> listNotifications(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listNotifications(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/notifications/{id}/read")
    public ResponseEntity<PartnerNotificationEntity> markNotificationRead(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(portalService.markNotificationRead(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId), id));
    }

    @GetMapping("/api-keys")
    public ResponseEntity<List<PartnerApiKeyDto>> listApiKeys(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listApiKeys(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/api-keys/rotate")
    public ResponseEntity<PartnerApiKeyDto> rotateApiKey(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @RequestBody(required = false) RotateApiKeyRequest request) {
        String keyName = request != null ? request.getKeyName() : null;
        String scopes = request != null ? request.getScopes() : null;
        String createdBy = request != null ? request.getCreatedBy() : null;
        return ResponseEntity.ok(portalService.rotateApiKey(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId),
                keyName, scopes, createdBy));
    }

    @PostMapping("/api-keys/{id}/revoke")
    public ResponseEntity<PartnerApiKeyDto> revokeApiKey(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(portalService.revokeApiKey(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId), id));
    }

    @GetMapping("/webhook-config")
    public ResponseEntity<Map<String, Object>> getWebhookConfig(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.getWebhookConfig(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @RequestMapping(value = "/webhook-config", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<Map<String, Object>> updateWebhookConfig(
            @RequestHeader(value = LoyaltyConstants.TENANT_HEADER, required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @RequestBody WebhookConfigRequest request) {
        return ResponseEntity.ok(portalService.updateWebhookConfig(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId),
                request.getWebhookUrl(), request.getWebhookSecret(), request.getIpWhitelist()));
    }

    private String resolveTenantId(String headerTenantId) {
        return ownershipGuard.resolveEffectiveTenantId(headerTenantId);
    }

    private Long resolvePartnerId(Long headerPartnerId, Long paramPartnerId) {
        return ownershipGuard.resolveEffectivePartnerId(headerPartnerId, paramPartnerId);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CounterRedeemRequest {
        @JsonAlias({"voucherCode", "code"})
        private String redemptionCode;
        private String voucherCode;
        private String branchCode;
        private Long branchId;
        private String customerPhone;
        private BigDecimal billAmount;
        private String note;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfirmSettlementRequest {
        private String confirmedBy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SettlementClaimRequest {
        private String disputeType;
        private BigDecimal partnerAmount;
        private BigDecimal loyaltyAmount;
        @JsonAlias("reason")
        private String resolutionNote;
        private String attachmentUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RotateApiKeyRequest {
        @JsonAlias("label")
        private String keyName;
        private String scopes;
        private String createdBy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WebhookConfigRequest {
        private String webhookUrl;
        private String webhookSecret;
        private String ipWhitelist;
    }
}
