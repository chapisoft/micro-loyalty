package com.natcash.loyalty.partner.controller;

import com.natcash.loyalty.approval.dto.ApprovalDto.ApprovalItemResponse;
import com.natcash.loyalty.approval.dto.ApprovalDto.CreateApprovalRequest;
import com.natcash.loyalty.clearing.entity.ClearingPaymentBatchEntity;
import com.natcash.loyalty.clearing.entity.LoyaltyClearingDisputeEntity;
import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.engagement.entity.PartnerNotificationEntity;
import com.natcash.loyalty.partner.entity.PartnerBranchEntity;
import com.natcash.loyalty.partner.entity.PartnerProductGroupEntity;
import com.natcash.loyalty.partner.entity.PartnerStaffAccountEntity;
import com.natcash.loyalty.partner.service.PartnerApiKeyService.PartnerApiKeyDto;
import com.natcash.loyalty.partner.service.PartnerPortalService;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyAcceptancePolicyEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
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

    @GetMapping("/dashboard")
    @Operation(summary = "Dashboard đối tác")
    public ResponseEntity<Map<String, Object>> getDashboard(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.getDashboard(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @GetMapping("/branches")
    public ResponseEntity<List<PartnerBranchEntity>> listBranches(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listBranches(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/branches")
    public ResponseEntity<PartnerBranchEntity> createBranch(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @RequestBody PartnerBranchEntity request) {
        return ResponseEntity.ok(portalService.createBranch(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId), request));
    }

    @GetMapping("/product-groups")
    public ResponseEntity<List<PartnerProductGroupEntity>> listProductGroups(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listProductGroups(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/product-groups")
    public ResponseEntity<PartnerProductGroupEntity> createProductGroup(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @RequestBody PartnerProductGroupEntity request) {
        return ResponseEntity.ok(portalService.createProductGroup(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId), request));
    }

    @GetMapping("/policies")
    public ResponseEntity<List<LoyaltyAcceptancePolicyEntity>> listPolicies(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listPolicies(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @GetMapping("/staff")
    public ResponseEntity<List<PartnerStaffAccountEntity>> listStaff(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listStaff(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/staff")
    public ResponseEntity<PartnerStaffAccountEntity> createStaff(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @RequestBody PartnerStaffAccountEntity request) {
        return ResponseEntity.ok(portalService.createStaff(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId), request));
    }

    @PostMapping("/proposals")
    public ResponseEntity<ApprovalItemResponse> submitProposal(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @RequestBody CreateApprovalRequest request) {
        return ResponseEntity.ok(portalService.submitProposal(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId), request));
    }

    @GetMapping("/vouchers")
    public ResponseEntity<List<LoyaltyVoucherEntity>> listVouchers(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listPartnerVouchers(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/vouchers/redeem-counter")
    public ResponseEntity<Map<String, Object>> redeemCounterVoucher(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @Valid @RequestBody CounterRedeemRequest request) {
        return ResponseEntity.ok(portalService.redeemCounterVoucher(
                resolveTenantId(headerTenantId),
                resolvePartnerId(headerPartnerId, paramPartnerId),
                request.getRedemptionCode(),
                request.getBranchId()));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<ClearingTransactionEntity>> listTransactions(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listPartnerTransactions(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @GetMapping("/settlements")
    public ResponseEntity<List<ClearingPaymentBatchEntity>> listSettlements(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listSettlements(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/settlements/{batchCode}/confirm")
    public ResponseEntity<ClearingPaymentBatchEntity> confirmSettlement(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
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
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
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
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listNotifications(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/notifications/{id}/read")
    public ResponseEntity<PartnerNotificationEntity> markNotificationRead(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(portalService.markNotificationRead(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId), id));
    }

    @GetMapping("/api-keys")
    public ResponseEntity<List<PartnerApiKeyDto>> listApiKeys(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.listApiKeys(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PostMapping("/api-keys/rotate")
    public ResponseEntity<PartnerApiKeyDto> rotateApiKey(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
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
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(portalService.revokeApiKey(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId), id));
    }

    @GetMapping("/webhook-config")
    public ResponseEntity<Map<String, Object>> getWebhookConfig(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId) {
        return ResponseEntity.ok(portalService.getWebhookConfig(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId)));
    }

    @PutMapping("/webhook-config")
    public ResponseEntity<Map<String, Object>> updateWebhookConfig(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = LoyaltyConstants.PARTNER_ID_HEADER, required = false) Long headerPartnerId,
            @RequestParam(value = "partnerId", required = false) Long paramPartnerId,
            @RequestBody WebhookConfigRequest request) {
        return ResponseEntity.ok(portalService.updateWebhookConfig(
                resolveTenantId(headerTenantId), resolvePartnerId(headerPartnerId, paramPartnerId),
                request.getWebhookUrl(), request.getWebhookSecret(), request.getIpWhitelist()));
    }

    private String resolveTenantId(String headerTenantId) {
        return headerTenantId != null && !headerTenantId.isBlank()
                ? headerTenantId.trim()
                : TenantContext.getTenantId();
    }

    private Long resolvePartnerId(Long headerPartnerId, Long paramPartnerId) {
        return headerPartnerId != null ? headerPartnerId : paramPartnerId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CounterRedeemRequest {
        @NotBlank
        private String redemptionCode;
        private Long branchId;
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
        private String resolutionNote;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RotateApiKeyRequest {
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
