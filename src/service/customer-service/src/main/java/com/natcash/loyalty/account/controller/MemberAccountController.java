package com.natcash.loyalty.account.controller;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.approval.dto.ApprovalDto.ApprovalItemResponse;
import com.natcash.loyalty.approval.dto.ApprovalDto.CreateApprovalRequest;
import com.natcash.loyalty.approval.service.ApprovalQueueService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.ApprovalActionType;
import com.natcash.loyalty.domain.enums.ApprovalTargetType;
import com.natcash.loyalty.domain.enums.BucketStatus;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.TierLevel;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.entity.PointExpirationBucketEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.ledger.repository.PointExpirationBucketRepository;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherRedemptionEntity;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRedemptionRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/loyalty/v1/accounts")
@RequiredArgsConstructor
@Tag(name = "Member 360 API", description = "Hồ sơ hội viên 360 độ và Yêu cầu khóa/mở khóa tài khoản (HV-06, HV-08, HV-09)")
public class MemberAccountController {

    private final LoyaltyAccountRepository accountRepository;
    private final PointExpirationBucketRepository bucketRepository;
    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final LoyaltyVoucherRedemptionRepository redemptionRepository;
    private final ApprovalQueueService approvalQueueService;

    @GetMapping("/{externalUserId}/profile-360")
    @Operation(summary = "Truy vấn hồ sơ hội viên 360 độ")
    public ResponseEntity<Profile360Response> getProfile360(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("externalUserId") String externalUserId) {
        String tenantId = resolveTenantId(headerTenantId);
        LoyaltyAccountEntity account = accountRepository.findByTenantIdAndExternalUserId(tenantId, externalUserId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND));

        List<PointExpirationBucketEntity> activeBuckets = bucketRepository
                .findByTenantIdAndAccountIdAndStatusOrderByExpiredAtAsc(tenantId, account.getId(), BucketStatus.ACTIVE);

        Page<LoyaltyPointLedgerEntity> recentLedger = ledgerRepository
                .findByTenantIdAndAccount_ExternalUserIdOrderByCreatedAtDesc(tenantId, externalUserId, PageRequest.of(0, 10));

        List<LoyaltyVoucherRedemptionEntity> vouchers = redemptionRepository
                .findByTenantIdAndAccount_Id(tenantId, account.getId());

        List<LedgerSummaryItem> ledgerItems = recentLedger != null && recentLedger.hasContent()
                ? recentLedger.getContent().stream().map(l -> LedgerSummaryItem.builder()
                        .id(l.getId())
                        .referenceCode(l.getReferenceCode())
                        .pointChange(l.getPointChange())
                        .balanceAfter(l.getBalanceAfter())
                        .changeType(l.getChangeType() != null ? l.getChangeType().name() : null)
                        .description(l.getDescription())
                        .createdAt(l.getCreatedAt())
                        .build()).toList()
                : Collections.emptyList();

        return ResponseEntity.ok(Profile360Response.builder()
                .accountId(account.getId())
                .tenantId(tenantId)
                .externalUserId(account.getExternalUserId())
                .fullName(account.getFullName())
                .phoneNumber(account.getPhoneNumber())
                .currentPoints(account.getCurrentPoints())
                .tierPoints(account.getTierPoints())
                .tierCode(account.getTier() != null ? account.getTier().getCode() : TierLevel.SILVER)
                .tierName(account.getTier() != null ? account.getTier().getName() : TierLevel.SILVER.name())
                .keepTierPoints(account.getTier() != null ? account.getTier().getKeepTierPoints() : BigDecimal.ZERO)
                .cycleEndAt(account.getCycleEndAt())
                .tierLockedUntil(account.getTierLockedUntil())
                .lockReason(account.getLockReason())
                .status(account.getStatus())
                .activeBuckets(activeBuckets != null ? activeBuckets : Collections.emptyList())
                .recentLedger(ledgerItems)
                .voucherCount(vouchers != null ? vouchers.size() : 0)
                .build());
    }

    @PostMapping("/{externalUserId}/lock-request")
    @Operation(summary = "Gửi yêu cầu khóa hoặc mở khóa tài khoản qua hàng đợi Maker-Checker")
    public ResponseEntity<ApprovalItemResponse> submitLockRequest(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("externalUserId") String externalUserId,
            @Valid @RequestBody AccountLockRequest request) {
        String tenantId = resolveTenantId(headerTenantId);
        LoyaltyAccountEntity account = accountRepository.findByTenantIdAndExternalUserId(tenantId, externalUserId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND));

        boolean lock = request.getLock() == null || Boolean.TRUE.equals(request.getLock());
        Map<String, Object> beforeMap = new LinkedHashMap<>();
        beforeMap.put("externalUserId", externalUserId);
        beforeMap.put("status", account.getStatus() != null ? account.getStatus().name() : CommonStatus.ACTIVE.name());

        Map<String, Object> afterMap = new LinkedHashMap<>();
        afterMap.put("externalUserId", externalUserId);
        afterMap.put("lock", lock);
        afterMap.put("status", lock ? CommonStatus.LOCKED.name() : CommonStatus.ACTIVE.name());
        afterMap.put("reason", request.getReason());

        CreateApprovalRequest approvalReq = CreateApprovalRequest.builder()
                .targetType(ApprovalTargetType.ACCOUNT_LOCK)
                .targetId(externalUserId)
                .actionType(lock ? ApprovalActionType.LOCK : ApprovalActionType.UNLOCK)
                .title((lock ? "Lock account: " : "Unlock account: ") + externalUserId)
                .payloadBefore(beforeMap)
                .payloadAfter(afterMap)
                .makerUsername(request.getMakerUsername())
                .reason(request.getReason())
                .build();

        return ResponseEntity.ok(approvalQueueService.submitRequest(tenantId, approvalReq));
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
    public static class AccountLockRequest {
        private Boolean lock;
        @NotBlank
        private String reason;
        private String makerUsername;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LedgerSummaryItem {
        private Long id;
        private String referenceCode;
        private BigDecimal pointChange;
        private BigDecimal balanceAfter;
        private String changeType;
        private String description;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Profile360Response {
        private Long accountId;
        private String tenantId;
        private String externalUserId;
        private String fullName;
        private String phoneNumber;
        private BigDecimal currentPoints;
        private BigDecimal tierPoints;
        private TierLevel tierCode;
        private String tierName;
        private BigDecimal keepTierPoints;
        private Instant cycleEndAt;
        private Instant tierLockedUntil;
        private String lockReason;
        private CommonStatus status;
        private List<PointExpirationBucketEntity> activeBuckets;
        private List<LedgerSummaryItem> recentLedger;
        private int voucherCount;
    }
}
