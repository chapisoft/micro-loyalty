package com.natcash.loyalty.partner.service;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.approval.dto.ApprovalDto.ApprovalItemResponse;
import com.natcash.loyalty.approval.dto.ApprovalDto.CreateApprovalRequest;
import com.natcash.loyalty.approval.service.ApprovalQueueService;
import com.natcash.loyalty.clearing.entity.ClearingPaymentBatchEntity;
import com.natcash.loyalty.clearing.entity.LoyaltyClearingDisputeEntity;
import com.natcash.loyalty.clearing.repository.ClearingPaymentBatchRepository;
import com.natcash.loyalty.clearing.repository.LoyaltyClearingDisputeRepository;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.ApprovalActionType;
import com.natcash.loyalty.domain.enums.ApprovalTargetType;
import com.natcash.loyalty.domain.enums.BatchSettlementStatus;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.DisputeStatus;
import com.natcash.loyalty.domain.enums.PartnerStaffRole;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.engagement.entity.PartnerNotificationEntity;
import com.natcash.loyalty.engagement.repository.PartnerNotificationRepository;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.partner.entity.PartnerBranchEntity;
import com.natcash.loyalty.partner.entity.PartnerProductGroupEntity;
import com.natcash.loyalty.partner.entity.PartnerStaffAccountEntity;
import com.natcash.loyalty.partner.repository.PartnerBranchRepository;
import com.natcash.loyalty.partner.repository.PartnerProductGroupRepository;
import com.natcash.loyalty.partner.repository.PartnerStaffAccountRepository;
import com.natcash.loyalty.partner.service.PartnerApiKeyService.PartnerApiKeyDto;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyAcceptancePolicyEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherRedemptionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyAcceptancePolicyRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRedemptionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PartnerPortalService {

    private final PartnerOwnershipGuard ownershipGuard;
    private final LoyaltyPartnerRepository partnerRepository;
    private final PartnerBranchRepository branchRepository;
    private final PartnerProductGroupRepository productGroupRepository;
    private final PartnerStaffAccountRepository staffRepository;
    private final PartnerApiKeyService apiKeyService;
    private final ApprovalQueueService approvalQueueService;
    private final LoyaltyAcceptancePolicyRepository policyRepository;
    private final LoyaltyVoucherRepository voucherRepository;
    private final LoyaltyVoucherRedemptionRepository redemptionRepository;
    private final ClearingTransactionRepository clearingRepository;
    private final ClearingPaymentBatchRepository batchRepository;
    private final LoyaltyClearingDisputeRepository disputeRepository;
    private final PartnerNotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboard(String tenantId, Long partnerId) {
        LoyaltyPartnerEntity partner = ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        List<PartnerBranchEntity> branches = branchRepository.findByTenantIdAndPartnerIdOrderByIdDesc(tenantId, partnerId);
        List<ClearingPaymentBatchEntity> batches = batchRepository.findByTenantIdAndPartnerIdOrderByCreatedAtDesc(tenantId, partnerId);
        long unreadNotifications = notificationRepository.countByTenantIdAndPartnerIdAndIsReadFalse(tenantId, partnerId);

        BigDecimal pendingPayable = batches.stream()
                .filter(b -> b.getStatus() == BatchSettlementStatus.PENDING_CONFIRM || b.getStatus() == BatchSettlementStatus.CONFIRMED)
                .map(b -> b.getNetPayableAmount() != null ? b.getNetPayableAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("partnerId", partner.getId());
        result.put("partnerCode", partner.getPartnerCode());
        result.put("partnerName", partner.getPartnerName());
        result.put("partnerType", partner.getPartnerType());
        result.put("branchCount", branches.size());
        result.put("batchCount", batches.size());
        result.put("pendingPayableAmount", pendingPayable);
        result.put("unreadNotifications", unreadNotifications);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PartnerBranchEntity> listBranches(String tenantId, Long partnerId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        return branchRepository.findByTenantIdAndPartnerIdOrderByIdDesc(tenantId, partnerId);
    }

    @Transactional
    public PartnerBranchEntity createBranch(String tenantId, Long partnerId, PartnerBranchEntity payload) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        String code = payload.getBranchCode() != null && !payload.getBranchCode().isBlank()
                ? payload.getBranchCode().trim()
                : "BR_" + partnerId + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        PartnerBranchEntity branch = PartnerBranchEntity.builder()
                .tenantId(tenantId)
                .partnerId(partnerId)
                .branchCode(code)
                .branchName(payload.getBranchName())
                .paymentPointCode(payload.getPaymentPointCode())
                .isNatcashOwn(Boolean.FALSE)
                .province(payload.getProvince())
                .address(payload.getAddress())
                .latitude(payload.getLatitude())
                .longitude(payload.getLongitude())
                .phoneNumber(payload.getPhoneNumber())
                .status(payload.getStatus() != null ? payload.getStatus() : CommonStatus.ACTIVE)
                .build();
        return branchRepository.save(branch);
    }

    @Transactional(readOnly = true)
    public List<PartnerProductGroupEntity> listProductGroups(String tenantId, Long partnerId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        return productGroupRepository.findByTenantIdAndPartnerIdOrderByIdDesc(tenantId, partnerId);
    }

    @Transactional
    public PartnerProductGroupEntity createProductGroup(String tenantId, Long partnerId, PartnerProductGroupEntity payload) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        String code = payload.getGroupCode() != null && !payload.getGroupCode().isBlank()
                ? payload.getGroupCode().trim()
                : "PG_" + partnerId + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        PartnerProductGroupEntity group = PartnerProductGroupEntity.builder()
                .tenantId(tenantId)
                .partnerId(partnerId)
                .groupCode(code)
                .groupName(payload.getGroupName())
                .description(payload.getDescription())
                .earnRatePercent(payload.getEarnRatePercent() != null ? payload.getEarnRatePercent() : BigDecimal.ONE)
                .maxBurnPercentage(payload.getMaxBurnPercentage() != null ? payload.getMaxBurnPercentage() : new BigDecimal("50.00"))
                .status(payload.getStatus() != null ? payload.getStatus() : CommonStatus.ACTIVE)
                .build();
        return productGroupRepository.save(group);
    }

    @Transactional(readOnly = true)
    public List<LoyaltyAcceptancePolicyEntity> listPolicies(String tenantId, Long partnerId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        return policyRepository.findByTenantId(tenantId).stream()
                .filter(p -> p.getPartner() != null && partnerId.equals(p.getPartner().getId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PartnerStaffAccountEntity> listStaff(String tenantId, Long partnerId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        return staffRepository.findByTenantIdAndPartnerIdOrderByIdDesc(tenantId, partnerId);
    }

    @Transactional
    public PartnerStaffAccountEntity createStaff(String tenantId, Long partnerId, PartnerStaffAccountEntity payload) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        PartnerStaffAccountEntity staff = PartnerStaffAccountEntity.builder()
                .tenantId(tenantId)
                .partnerId(partnerId)
                .branchId(payload.getBranchId())
                .username(payload.getUsername())
                .fullName(payload.getFullName())
                .email(payload.getEmail())
                .phoneNumber(payload.getPhoneNumber())
                .roleCode(payload.getRoleCode() != null ? payload.getRoleCode() : PartnerStaffRole.PARTNER_CASHIER)
                .status(payload.getStatus() != null ? payload.getStatus() : CommonStatus.ACTIVE)
                .build();
        return staffRepository.save(staff);
    }

    @Transactional
    public ApprovalItemResponse submitProposal(String tenantId, Long partnerId, CreateApprovalRequest request) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        CreateApprovalRequest scoped = CreateApprovalRequest.builder()
                .targetType(request.getTargetType() != null ? request.getTargetType() : ApprovalTargetType.POLICY)
                .targetId(request.getTargetId() != null ? request.getTargetId() : String.valueOf(partnerId))
                .actionType(request.getActionType() != null ? request.getActionType() : ApprovalActionType.UPDATE)
                .title(request.getTitle())
                .payloadBefore(request.getPayloadBefore())
                .payloadAfter(request.getPayloadAfter())
                .makerUsername(request.getMakerUsername())
                .reason(request.getReason())
                .build();
        return approvalQueueService.submitRequest(tenantId, scoped);
    }

    @Transactional(readOnly = true)
    public List<LoyaltyVoucherEntity> listPartnerVouchers(String tenantId, Long partnerId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        return voucherRepository.findByTenantId(tenantId).stream()
                .filter(v -> partnerId.equals(v.getPartnerId()))
                .toList();
    }

    @Transactional
    public Map<String, Object> redeemCounterVoucher(String tenantId, Long partnerId, String redemptionCode, Long branchId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        LoyaltyVoucherRedemptionEntity redemption = redemptionRepository
                .findByTenantIdAndRedemptionCode(tenantId, redemptionCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND));

        if (redemption.getVoucher() != null && redemption.getVoucher().getPartnerId() != null) {
            ownershipGuard.verifyRecordOwnership(partnerId, redemption.getVoucher().getPartnerId());
        }
        if (redemption.getStatus() != VoucherStatus.ACTIVE
                || (redemption.getExpiresAt() != null && redemption.getExpiresAt().isBefore(Instant.now()))) {
            throw new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND);
        }

        redemption.setStatus(VoucherStatus.USED);
        redemption.setUsedAt(Instant.now());
        redemption.setUsedPartnerId(partnerId);
        redemptionRepository.save(redemption);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("redemptionCode", redemption.getRedemptionCode());
        result.put("status", redemption.getStatus());
        result.put("usedAt", redemption.getUsedAt());
        result.put("usedPartnerId", partnerId);
        result.put("branchId", branchId);
        return result;
    }

    @Transactional(readOnly = true)
    public List<ClearingTransactionEntity> listPartnerTransactions(String tenantId, Long partnerId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        Instant from = Instant.now().minus(90, ChronoUnit.DAYS);
        return clearingRepository.findByPartnerAndPeriod(tenantId, partnerId, from, Instant.now());
    }

    @Transactional(readOnly = true)
    public List<ClearingPaymentBatchEntity> listSettlements(String tenantId, Long partnerId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        return batchRepository.findByTenantIdAndPartnerIdOrderByCreatedAtDesc(tenantId, partnerId);
    }

    @Transactional
    public ClearingPaymentBatchEntity confirmSettlement(String tenantId, Long partnerId, String batchCode, String actor) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        ClearingPaymentBatchEntity batch = batchRepository
                .findByTenantIdAndPartnerIdAndBatchCode(tenantId, partnerId, batchCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.IDOR_FORBIDDEN));
        batch.setStatus(BatchSettlementStatus.CONFIRMED);
        batch.setConfirmedAt(Instant.now());
        batch.setConfirmedBy(actor);
        return batchRepository.save(batch);
    }

    @Transactional
    public LoyaltyClearingDisputeEntity submitSettlementClaim(
            String tenantId, Long partnerId, String batchCode, String disputeType,
            BigDecimal partnerAmount, BigDecimal loyaltyAmount, String note) {
        LoyaltyPartnerEntity partner = ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        ClearingPaymentBatchEntity batch = batchRepository
                .findByTenantIdAndPartnerIdAndBatchCode(tenantId, partnerId, batchCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.IDOR_FORBIDDEN));
        batch.setStatus(BatchSettlementStatus.DISPUTED);
        batchRepository.save(batch);

        String disputeCode = "KN-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        LoyaltyClearingDisputeEntity dispute = LoyaltyClearingDisputeEntity.builder()
                .tenantId(tenantId)
                .disputeCode(disputeCode)
                .batchCode(batchCode)
                .partner(partner)
                .disputeType(disputeType != null && !disputeType.isBlank() ? disputeType : "AMOUNT_MISMATCH")
                .partnerAmount(partnerAmount != null ? partnerAmount : BigDecimal.ZERO)
                .loyaltyAmount(loyaltyAmount != null ? loyaltyAmount : BigDecimal.ZERO)
                .status(DisputeStatus.OPEN)
                .resolutionNote(note)
                .build();
        return disputeRepository.save(dispute);
    }

    @Transactional(readOnly = true)
    public List<PartnerNotificationEntity> listNotifications(String tenantId, Long partnerId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        return notificationRepository.findByTenantIdAndPartnerIdOrderByCreatedAtDesc(tenantId, partnerId);
    }

    @Transactional
    public PartnerNotificationEntity markNotificationRead(String tenantId, Long partnerId, Long notificationId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        PartnerNotificationEntity notif = notificationRepository
                .findByIdAndTenantIdAndPartnerId(notificationId, tenantId, partnerId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.IDOR_FORBIDDEN));
        notif.setIsRead(Boolean.TRUE);
        notif.setReadAt(Instant.now());
        return notificationRepository.save(notif);
    }

    @Transactional(readOnly = true)
    public List<PartnerApiKeyDto> listApiKeys(String tenantId, Long partnerId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        return apiKeyService.listApiKeys(tenantId, partnerId);
    }

    @Transactional
    public PartnerApiKeyDto rotateApiKey(String tenantId, Long partnerId, String keyName, String scopes, String createdBy) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        return apiKeyService.rotateKey(tenantId, partnerId, keyName, scopes, createdBy);
    }

    @Transactional
    public PartnerApiKeyDto revokeApiKey(String tenantId, Long partnerId, Long keyId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        return apiKeyService.revokeKey(tenantId, partnerId, keyId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getWebhookConfig(String tenantId, Long partnerId) {
        LoyaltyPartnerEntity partner = ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("partnerId", partner.getId());
        result.put("webhookUrl", partner.getWebhookUrl());
        result.put("ipWhitelist", partner.getIpWhitelist());
        result.put("webhookSecretConfigured", partner.getWebhookSecret() != null && !partner.getWebhookSecret().isBlank());
        return result;
    }

    @Transactional
    public Map<String, Object> updateWebhookConfig(
            String tenantId, Long partnerId, String webhookUrl, String webhookSecret, String ipWhitelist) {
        LoyaltyPartnerEntity partner = ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        if (webhookUrl != null) {
            partner.setWebhookUrl(webhookUrl);
        }
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            partner.setWebhookSecret(webhookSecret);
        }
        if (ipWhitelist != null) {
            partner.setIpWhitelist(ipWhitelist);
        }
        partnerRepository.save(partner);
        return getWebhookConfig(tenantId, partnerId);
    }
}
