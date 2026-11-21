package com.natcash.loyalty.partner.service;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.approval.dto.ApprovalDto.ApprovalItemResponse;
import com.natcash.loyalty.approval.dto.ApprovalDto.CreateApprovalRequest;
import com.natcash.loyalty.approval.entity.ApprovalRequestEntity;
import com.natcash.loyalty.approval.repository.ApprovalRequestRepository;
import com.natcash.loyalty.approval.service.ApprovalQueueService;
import com.natcash.loyalty.clearing.entity.ClearingPaymentBatchEntity;
import com.natcash.loyalty.clearing.entity.LoyaltyClearingDisputeEntity;
import com.natcash.loyalty.clearing.repository.ClearingPaymentBatchRepository;
import com.natcash.loyalty.clearing.repository.LoyaltyClearingDisputeRepository;
import com.natcash.loyalty.codegeneration.domain.CodeType;
import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.constant.SecurityConstants;
import com.natcash.loyalty.domain.enums.ApprovalActionType;
import com.natcash.loyalty.domain.enums.ApprovalTargetType;
import com.natcash.loyalty.domain.enums.BatchSettlementStatus;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.DisputeStatus;
import com.natcash.loyalty.domain.enums.PartnerHierarchyLevel;
import com.natcash.loyalty.domain.enums.PartnerStaffRole;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.engagement.entity.PartnerNotificationEntity;
import com.natcash.loyalty.engagement.repository.PartnerNotificationRepository;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.partner.entity.PartnerBranchEntity;
import com.natcash.loyalty.partner.entity.PartnerProductGroupEntity;
import com.natcash.loyalty.partner.entity.PartnerStaffAccountEntity;
import com.natcash.loyalty.partner.repository.PartnerBranchRepository;
import com.natcash.loyalty.partner.repository.PartnerProductGroupRepository;
import com.natcash.loyalty.partner.repository.PartnerStaffAccountRepository;
import com.natcash.loyalty.partner.service.PartnerApiKeyService.PartnerApiKeyDto;
import com.natcash.loyalty.util.MessageUtils;
import com.natcash.loyalty.wallet.dto.VoucherDto.CheckVoucherRequest;
import com.natcash.loyalty.wallet.dto.VoucherDto.CheckVoucherResponse;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyAcceptancePolicyEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherRedemptionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyAcceptancePolicyRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRedemptionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRepository;
import com.natcash.loyalty.wallet.service.VoucherDynamicCodeService;
import com.natcash.loyalty.wallet.service.VoucherDynamicCodeService.ConsumedVoucherResult;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PartnerPortalService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE_REF = new TypeReference<>() {
    };

    private final PartnerOwnershipGuard ownershipGuard;
    private final LoyaltyPartnerRepository partnerRepository;
    private final PartnerBranchRepository branchRepository;
    private final PartnerProductGroupRepository productGroupRepository;
    private final PartnerStaffAccountRepository staffRepository;
    private final PartnerApiKeyService apiKeyService;
    private final ApprovalQueueService approvalQueueService;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final LoyaltyAcceptancePolicyRepository policyRepository;
    private final LoyaltyVoucherRepository voucherRepository;
    private final LoyaltyVoucherRedemptionRepository redemptionRepository;
    private final ClearingTransactionRepository clearingRepository;
    private final LoyaltyPointLedgerRepository pointLedgerRepository;
    private final ClearingPaymentBatchRepository batchRepository;
    private final LoyaltyClearingDisputeRepository disputeRepository;
    private final PartnerNotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private VoucherDynamicCodeService voucherDynamicCodeService;

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboard(String tenantId, Long partnerId) {
        LoyaltyPartnerEntity partner = ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        List<PartnerBranchEntity> branches = branchRepository.findByTenantIdAndPartnerIdOrderByIdDesc(tenantId, partnerId);
        List<ClearingPaymentBatchEntity> batches = batchRepository.findByTenantIdAndPartnerIdOrderByCreatedAtDesc(tenantId, partnerId);
        long unreadNotifications = notificationRepository.countByTenantIdAndPartnerIdAndIsReadFalse(tenantId, partnerId);

        Instant now = Instant.now();
        SystemParameterService paramService = SystemParameterService.get();
        int lookbackDays = paramService.getInt(tenantId, SystemParamSpec.PARTNER_LOOKBACK_DAYS);
        int txPageSize = paramService.getInt(tenantId, SystemParamSpec.PARTNER_TX_PAGE_SIZE);
        List<ClearingTransactionEntity> clearingTxs = clearingRepository.findByPartnerAndPeriod(
                tenantId, partnerId, now.minus(lookbackDays, ChronoUnit.DAYS), now.plus(1, ChronoUnit.DAYS));
        List<LoyaltyPointLedgerEntity> ledgerTxs = pointLedgerRepository.findLedgerWithFilters(
                tenantId, null, null, partnerId, null, PageRequest.of(0, txPageSize)).getContent();

        List<Map<String, Object>> mergedTxs = buildUnifiedTransactions(clearingTxs, ledgerTxs);

        Set<String> uniqueUsers = new HashSet<>();
        long earnTxCount = 0L;
        long burnTxCount = 0L;
        BigDecimal totalEarnAmount = BigDecimal.ZERO;
        BigDecimal totalBurnAmount = BigDecimal.ZERO;

        for (Map<String, Object> tx : mergedTxs) {
            Object uid = tx.get("externalUserId");
            if (uid != null && !String.valueOf(uid).isBlank()) {
                uniqueUsers.add(String.valueOf(uid));
            }
            String action = String.valueOf(tx.getOrDefault("actionType", ""));
            PointActionType actionType = PointActionType.fromCode(action);
            BigDecimal pts = toBigDecimal(tx.get("points")).abs();
            if (actionType == PointActionType.EARN || actionType == PointActionType.CASHBACK || actionType == PointActionType.ADJUST) {
                earnTxCount++;
                totalEarnAmount = totalEarnAmount.add(pts);
            } else {
                burnTxCount++;
                totalBurnAmount = totalBurnAmount.add(pts);
            }
        }

        BigDecimal pendingPayable = batches.stream()
                .filter(b -> b.getStatus() == BatchSettlementStatus.PENDING_CONFIRM || b.getStatus() == BatchSettlementStatus.CONFIRMED)
                .map(b -> b.getNetPayableAmount() != null ? b.getNetPayableAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal netSettlementTotal = batches.stream()
                .map(b -> b.getNetPayableAmount() != null ? b.getNetPayableAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long activeVouchers = voucherRepository.findByTenantId(tenantId).stream()
                .filter(v -> partnerId.equals(v.getPartnerId()) && v.getStatus() == VoucherStatus.ACTIVE)
                .count();
        long redeemedVouchers = redemptionRepository.findByTenantIdAndVoucher_PartnerId(tenantId, partnerId).stream()
                .filter(r -> r.getStatus() == VoucherStatus.USED)
                .count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("partnerId", partner.getId());
        result.put("partnerCode", partner.getPartnerCode());
        result.put("partnerName", partner.getPartnerName());
        result.put("partnerType", partner.getPartnerType());
        result.put("branchCount", branches.size());
        result.put("batchCount", batches.size());
        result.put("pendingPayableAmount", pendingPayable);
        result.put("pendingSettlementAmount", pendingPayable);
        result.put("netSettlementAmount", netSettlementTotal);
        result.put("unreadNotifications", unreadNotifications);
        result.put("payingCustomersCount", uniqueUsers.size());
        result.put("activeMembersCount", uniqueUsers.size());
        result.put("newMembersCount", uniqueUsers.size());
        result.put("newMembersAcquired", uniqueUsers.size());
        result.put("totalEarnTransactions", earnTxCount);
        result.put("totalBurnTransactions", burnTxCount);
        result.put("burnTransactionsCount", burnTxCount);
        result.put("burnTxCount", burnTxCount);
        result.put("totalEarnAmount", totalEarnAmount);
        result.put("totalBurnAmount", totalBurnAmount);
        result.put("activeVouchersCount", activeVouchers);
        result.put("totalVoucherRedeemed", redeemedVouchers);
        int recentLimit = SystemParameterService.get().getInt(tenantId, SystemParamSpec.PARTNER_RECENT_TX_LIMIT);
        result.put("recentTransactions", mergedTxs.stream().limit(recentLimit).toList());
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
        if (payload.getId() != null) {
            PartnerBranchEntity existing = branchRepository
                    .findByIdAndTenantIdAndPartnerId(payload.getId(), tenantId, partnerId)
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.IDOR_FORBIDDEN));
            if (payload.getBranchCode() != null && !payload.getBranchCode().isBlank()) {
                existing.setBranchCode(payload.getBranchCode().trim());
            }
            if (payload.getBranchName() != null) {
                existing.setBranchName(payload.getBranchName());
            }
            if (payload.getPaymentPointCode() != null) {
                existing.setPaymentPointCode(payload.getPaymentPointCode());
            }
            if (payload.getProvince() != null) {
                existing.setProvince(payload.getProvince());
            }
            if (payload.getAddress() != null) {
                existing.setAddress(payload.getAddress());
            }
            if (payload.getLatitude() != null) {
                existing.setLatitude(payload.getLatitude());
            }
            if (payload.getLongitude() != null) {
                existing.setLongitude(payload.getLongitude());
            }
            if (payload.getPhoneNumber() != null) {
                existing.setPhoneNumber(payload.getPhoneNumber());
            }
            if (payload.getStatus() != null) {
                existing.setStatus(payload.getStatus());
            }
            return branchRepository.save(existing);
        }

        String code = payload.getBranchCode() != null && !payload.getBranchCode().isBlank()
                ? payload.getBranchCode().trim()
                : CentralizedCodeGeneratorService.get().generateCode(
                        CodeType.PARTNER_BRANCH,
                        Map.of("scope", String.valueOf(partnerId)));
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

    @Transactional
    public void deleteBranch(String tenantId, Long partnerId, Long branchId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        PartnerBranchEntity branch = branchRepository.findByIdAndTenantId(branchId, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        if (!partnerId.equals(branch.getPartnerId())) {
            throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
        }
        branchRepository.delete(branch);
    }

    @Transactional(readOnly = true)
    public List<PartnerProductGroupEntity> listProductGroups(String tenantId, Long partnerId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        List<PartnerProductGroupEntity> groups = productGroupRepository
                .findByTenantIdAndPartnerIdOrderByIdDesc(tenantId, partnerId);
        groups.forEach(g -> g.setAllowBurn(
                g.getMaxBurnPercentage() != null && g.getMaxBurnPercentage().compareTo(BigDecimal.ZERO) > 0));
        return groups;
    }

    @Transactional
    public PartnerProductGroupEntity createProductGroup(String tenantId, Long partnerId, PartnerProductGroupEntity payload) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        BigDecimal resolvedMaxBurn = resolveMaxBurnPercentage(payload.getAllowBurn(), payload.getMaxBurnPercentage());

        if (payload.getId() != null) {
            PartnerProductGroupEntity existing = productGroupRepository
                    .findByIdAndTenantIdAndPartnerId(payload.getId(), tenantId, partnerId)
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.IDOR_FORBIDDEN));
            if (payload.getGroupCode() != null && !payload.getGroupCode().isBlank()) {
                existing.setGroupCode(payload.getGroupCode().trim());
            }
            if (payload.getGroupName() != null) {
                existing.setGroupName(payload.getGroupName());
            }
            if (payload.getDescription() != null) {
                existing.setDescription(payload.getDescription());
            }
            if (payload.getEarnRatePercent() != null) {
                existing.setEarnRatePercent(payload.getEarnRatePercent());
            }
            if (payload.getAllowBurn() != null || payload.getMaxBurnPercentage() != null) {
                existing.setMaxBurnPercentage(resolvedMaxBurn);
            }
            if (payload.getStatus() != null) {
                existing.setStatus(payload.getStatus());
            }
            PartnerProductGroupEntity saved = productGroupRepository.save(existing);
            saved.setAllowBurn(saved.getMaxBurnPercentage() != null && saved.getMaxBurnPercentage().compareTo(BigDecimal.ZERO) > 0);
            return saved;
        }

        String code = payload.getGroupCode() != null && !payload.getGroupCode().isBlank()
                ? payload.getGroupCode().trim()
                : CentralizedCodeGeneratorService.get().generateCode(
                        CodeType.PARTNER_GROUP,
                        Map.of("scope", String.valueOf(partnerId)));
        PartnerProductGroupEntity group = PartnerProductGroupEntity.builder()
                .tenantId(tenantId)
                .partnerId(partnerId)
                .groupCode(code)
                .groupName(payload.getGroupName())
                .description(payload.getDescription())
                .earnRatePercent(payload.getEarnRatePercent() != null ? payload.getEarnRatePercent() : BigDecimal.ONE)
                .maxBurnPercentage(resolvedMaxBurn)
                .status(payload.getStatus() != null ? payload.getStatus() : CommonStatus.ACTIVE)
                .build();
        PartnerProductGroupEntity saved = productGroupRepository.save(group);
        saved.setAllowBurn(saved.getMaxBurnPercentage() != null && saved.getMaxBurnPercentage().compareTo(BigDecimal.ZERO) > 0);
        return saved;
    }

    @Transactional
    public void deleteProductGroup(String tenantId, Long partnerId, Long groupId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        PartnerProductGroupEntity group = productGroupRepository.findByIdAndTenantIdAndPartnerId(groupId, tenantId, partnerId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        productGroupRepository.delete(group);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listPolicies(String tenantId, Long partnerId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        return policyRepository.findByTenantId(tenantId).stream()
                .filter(p -> p.getPartner() != null && partnerId.equals(p.getPartner().getId()))
                .map(this::toPolicyMap)
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
        if (payload.getId() != null) {
            PartnerStaffAccountEntity existing = staffRepository
                    .findByIdAndTenantIdAndPartnerId(payload.getId(), tenantId, partnerId)
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.IDOR_FORBIDDEN));
            if (payload.getBranchId() != null) {
                existing.setBranchId(payload.getBranchId());
            }
            if (payload.getFullName() != null) {
                existing.setFullName(payload.getFullName());
            }
            if (payload.getEmail() != null) {
                existing.setEmail(payload.getEmail());
            }
            if (payload.getPhoneNumber() != null) {
                existing.setPhoneNumber(payload.getPhoneNumber());
            }
            if (payload.getRoleCode() != null) {
                existing.setRoleCode(payload.getRoleCode());
            }
            if (payload.getStatus() != null) {
                existing.setStatus(payload.getStatus());
            }
            return staffRepository.save(existing);
        }

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
    public PartnerStaffAccountEntity toggleStaffLock(String tenantId, Long partnerId, Long staffId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        PartnerStaffAccountEntity staff = staffRepository.findByIdAndTenantIdAndPartnerId(staffId, tenantId, partnerId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        if (staff.getStatus() == CommonStatus.LOCKED || staff.getStatus() == CommonStatus.INACTIVE) {
            staff.setStatus(CommonStatus.ACTIVE);
        } else {
            staff.setStatus(CommonStatus.LOCKED);
        }
        return staffRepository.save(staff);
    }

    @Transactional
    public void deleteStaff(String tenantId, Long partnerId, Long staffId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        PartnerStaffAccountEntity staff = staffRepository.findByIdAndTenantIdAndPartnerId(staffId, tenantId, partnerId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        staffRepository.delete(staff);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listProposals(String tenantId, Long partnerId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        Set<String> partnerStaffUsernames = staffRepository.findByTenantIdAndPartnerIdOrderByIdDesc(tenantId, partnerId)
                .stream()
                .map(PartnerStaffAccountEntity::getUsername)
                .collect(Collectors.toSet());

        return approvalRequestRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .filter(req -> belongsToPartner(req, partnerId, partnerStaffUsernames))
                .map(this::toProposalMap)
                .toList();
    }

    @Transactional
    public Map<String, Object> submitProposal(String tenantId, Long partnerId, Map<String, Object> rawRequest) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        Map<String, Object> requestMap = rawRequest != null ? rawRequest : Map.of();

        Object rawTargetId = requestMap.get("targetId");
        if (rawTargetId != null && !String.valueOf(rawTargetId).isBlank()) {
            String targetIdStr = String.valueOf(rawTargetId).trim();
            if (!targetIdStr.equals(String.valueOf(partnerId))) {
                throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
            }
        }

        ApprovalTargetType targetType = resolveProposalTargetType(requestMap.get("targetType"));
        ApprovalActionType actionType = resolveProposalActionType(requestMap.get("actionType"));
        String title = firstNonBlank(requestMap.get("programName"), requestMap.get("title"),
                MessageUtils.getMessage("partner.portal.proposal_default_title", partnerId));
        String reason = firstNonBlank(requestMap.get("description"), requestMap.get("reason"), title);
        String makerUsername = firstNonBlank(requestMap.get("makerUsername"), resolveCurrentUsername(), "partner_" + partnerId);

        String payloadAfterJson;
        Object suppliedPayloadAfter = requestMap.get("payloadAfter");
        if (suppliedPayloadAfter instanceof String str && !str.isBlank()) {
            payloadAfterJson = str;
        } else {
            Map<String, Object> proposalPayload = new LinkedHashMap<>(requestMap);
            proposalPayload.put("partnerId", partnerId);
            proposalPayload.putIfAbsent("programName", title);
            proposalPayload.putIfAbsent("description", reason);
            payloadAfterJson = serializeJson(proposalPayload);
        }

        CreateApprovalRequest scoped = CreateApprovalRequest.builder()
                .targetType(targetType)
                .targetId(String.valueOf(partnerId))
                .actionType(actionType)
                .title(title)
                .payloadBefore(requestMap.get("payloadBefore") != null ? String.valueOf(requestMap.get("payloadBefore")) : null)
                .payloadAfter(payloadAfterJson)
                .makerUsername(makerUsername)
                .reason(reason)
                .build();

        ApprovalItemResponse saved = approvalQueueService.submitRequest(tenantId, scoped);
        return toProposalMapFromResponse(saved, partnerId);
    }

    @Transactional(readOnly = true)
    public List<LoyaltyVoucherEntity> listPartnerVouchers(String tenantId, Long partnerId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        return voucherRepository.findByTenantId(tenantId).stream()
                .filter(v -> partnerId.equals(v.getPartnerId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public CheckVoucherResponse checkCounterVoucher(
            String tenantId, Long partnerId, String code, String branchCode, BigDecimal billAmount) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        if (voucherDynamicCodeService == null) {
            throw new LoyaltyException(ErrorCode.SYSTEM_ERROR, MessageUtils.getMessage("error.system_error"));
        }
        return voucherDynamicCodeService.checkVoucher(tenantId, CheckVoucherRequest.builder()
                .code(code)
                .partnerId(partnerId)
                .branchCode(branchCode)
                .billAmount(billAmount)
                .build());
    }

    @Transactional
    public Map<String, Object> redeemCounterVoucher(
            String tenantId, Long partnerId, String redemptionCode, Long branchId, String branchCode,
            String customerPhone) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        String code = redemptionCode != null ? redemptionCode.trim() : "";
        if (code.isBlank()) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR);
        }

        Long effectiveBranchId = branchId;
        if (effectiveBranchId == null && branchCode != null && !branchCode.isBlank()) {
            Optional<PartnerBranchEntity> branchOpt = branchRepository.findByTenantIdAndBranchCode(tenantId,
                    branchCode.trim());
            if (branchOpt.isPresent()) {
                ownershipGuard.verifyRecordOwnership(partnerId, branchOpt.get().getPartnerId());
                effectiveBranchId = branchOpt.get().getId();
            }
        }

        // Bắt buộc xác thực và tiêu thụ mã động 6-8 ký tự (cấm sử dụng mã cố định tại quầy)
        if (voucherDynamicCodeService == null) {
            throw new LoyaltyException(ErrorCode.SYSTEM_ERROR, MessageUtils.getMessage("error.system_error"));
        }
        ConsumedVoucherResult consumed = voucherDynamicCodeService.consumeDynamicCode(
                tenantId,
                code,
                partnerId,
                null,
                branchCode,
                null,
                customerPhone != null && !customerPhone.isBlank() ? customerPhone.trim() : null);

        LoyaltyVoucherRedemptionEntity redemption = consumed.getRedemption();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("dynamicCode", consumed.getDynamicCode());
        result.put("redemptionId", redemption.getId());
        result.put("voucherCode", redemption.getVoucher() != null ? redemption.getVoucher().getVoucherCode() : null);
        result.put("voucherTitle", redemption.getVoucher() != null ? redemption.getVoucher().getTitle() : null);
        result.put("status", redemption.getStatus());
        result.put("usedAt", redemption.getUsedAt());
        result.put("usedPartnerId", partnerId);
        result.put("branchId", effectiveBranchId);
        result.put("branchCode", branchCode);
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listPartnerTransactions(
            String tenantId, Long partnerId, String actionType, String keyword, String fromDate, String toDate) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        Instant now = Instant.now();
        SystemParameterService paramService = SystemParameterService.get();
        int lookbackDays = paramService.getInt(tenantId, SystemParamSpec.PARTNER_LOOKBACK_DAYS);
        int txPageSize = paramService.getInt(tenantId, SystemParamSpec.PARTNER_TX_PAGE_SIZE);
        Instant from = parseInstantBound(fromDate, now.minus(lookbackDays, ChronoUnit.DAYS), true);
        Instant to = parseInstantBound(toDate, now.plus(1, ChronoUnit.DAYS), false);

        List<ClearingTransactionEntity> clearingTxs = clearingRepository.findByPartnerAndPeriod(tenantId, partnerId, from, to);
        List<LoyaltyPointLedgerEntity> ledgerTxs = pointLedgerRepository.findLedgerWithFilters(
                tenantId, null, null, partnerId, null, PageRequest.of(0, txPageSize)).getContent();

        String normalizedAction = actionType != null && !actionType.isBlank()
                && !LoyaltyConstants.FILTER_ALL.equalsIgnoreCase(actionType)
                ? actionType.trim().toUpperCase()
                : null;
        String normalizedKw = keyword != null && !keyword.isBlank() ? keyword.trim().toLowerCase() : null;

        return buildUnifiedTransactions(clearingTxs, ledgerTxs).stream()
                .filter(tx -> normalizedAction == null
                        || String.valueOf(tx.getOrDefault("actionType", "")).toUpperCase().contains(normalizedAction))
                .filter(tx -> matchesKeyword(tx, normalizedKw))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listSettlements(String tenantId, Long partnerId) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        return batchRepository.findByTenantIdAndPartnerIdOrderByCreatedAtDesc(tenantId, partnerId).stream()
                .map(this::toSettlementMap)
                .toList();
    }

    @Transactional
    public ClearingPaymentBatchEntity confirmSettlement(String tenantId, Long partnerId, String batchCode,
            String actor) {
        ownershipGuard.verifyPartnerAccess(tenantId, partnerId);
        ClearingPaymentBatchEntity batch = batchRepository
                .findByTenantIdAndPartnerIdAndBatchCode(tenantId, partnerId, batchCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.IDOR_FORBIDDEN));
        batch.setStatus(BatchSettlementStatus.CONFIRMED);
        batch.setConfirmedAt(Instant.now());
        batch.setConfirmedBy(actor != null && !actor.isBlank() ? actor : resolveCurrentUsername());
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

        String disputeCode = CentralizedCodeGeneratorService.get().generateCode(CodeType.PARTNER_CLAIM);
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
    public PartnerApiKeyDto rotateApiKey(String tenantId, Long partnerId, String keyName, String scopes,
            String createdBy) {
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
        result.put("webhookSecretConfigured",
                partner.getWebhookSecret() != null && !partner.getWebhookSecret().isBlank());
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

    private List<Map<String, Object>> buildUnifiedTransactions(
            List<ClearingTransactionEntity> clearingTxs, List<LoyaltyPointLedgerEntity> ledgerTxs) {
        List<Map<String, Object>> merged = new ArrayList<>();
        Set<String> seenRefs = new HashSet<>();

        for (ClearingTransactionEntity c : clearingTxs) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", c.getId());
            item.put("transactionId", c.getTransactionCode());
            item.put("transactionCode", c.getTransactionCode());
            item.put("externalUserId", c.getExternalUserId());
            item.put("actionType", PointActionType.BURN.name());
            item.put("points", c.getPointsRedeemed());
            item.put("pointsRedeemed", c.getPointsRedeemed());
            item.put("fiatAmount", c.getFiatAmount());
            item.put("commissionAmount", c.getCommissionAmount());
            item.put("netPayoutAmount", c.getNetPayoutAmount());
            item.put("partnerId", c.getRedeemerPartnerId());
            item.put("referenceId", c.getPartnerOrderId() != null ? c.getPartnerOrderId() : c.getTransactionCode());
            item.put("description", MessageUtils.getMessage("partner.portal.clearing_desc",
                    (c.getPartnerOrderId() != null ? c.getPartnerOrderId() : c.getTransactionCode())));
            item.put("status", c.getStatus() != null ? c.getStatus().name() : ClearingStatus.SETTLED.name());
            item.put("createdAt", c.getCreatedAt());
            merged.add(item);
            if (c.getTransactionCode() != null) {
                seenRefs.add(c.getTransactionCode());
            }
            if (c.getPartnerOrderId() != null) {
                seenRefs.add(c.getPartnerOrderId());
            }
        }

        for (LoyaltyPointLedgerEntity l : ledgerTxs) {
            if (l.getReferenceCode() != null && seenRefs.contains(l.getReferenceCode())) {
                continue;
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", l.getId());
            item.put("transactionId", l.getReferenceCode());
            item.put("transactionCode", l.getReferenceCode());
            item.put("externalUserId", l.getAccount() != null ? l.getAccount().getExternalUserId() : "");
            item.put("actionType", l.getChangeType() != null ? l.getChangeType().name() : PointActionType.EARN.name());
            item.put("points", l.getPointChange());
            item.put("balanceAfter", l.getBalanceAfter());
            item.put("partnerId", l.getPartnerId());
            item.put("referenceId", l.getReferenceCode());
            item.put("description", l.getDescription());
            item.put("status", CommonStatus.SUCCESS.name());
            item.put("createdAt", l.getCreatedAt());
            merged.add(item);
        }

        merged.sort(Comparator.comparing(
                m -> m.get("createdAt") instanceof Instant inst ? inst : Instant.EPOCH,
                Comparator.reverseOrder()));
        return merged;
    }

    private Map<String, Object> toPolicyMap(LoyaltyAcceptancePolicyEntity p) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", p.getId());
        map.put("policyCode", "POL_" + p.getId());
        map.put("code", "POL_" + p.getId());
        map.put("name",
                (p.getPartner() != null ? p.getPartner().getPartnerName() : "Partner") + " · " + p.getHierarchyLevel());
        map.put("partnerId", p.getPartner() != null ? p.getPartner().getId() : null);
        map.put("partnerCode", p.getPartner() != null ? p.getPartner().getPartnerCode() : null);
        map.put("partnerName", p.getPartner() != null ? p.getPartner().getPartnerName() : null);
        map.put("hierarchyLevel", p.getHierarchyLevel());
        map.put("branchId", p.getBranchId());
        map.put("productGroupId", p.getProductGroupId());
        map.put("productId", p.getProductId());
        map.put("type",
                p.getHierarchyLevel() != null ? p.getHierarchyLevel().name() : PartnerHierarchyLevel.PARTNER.name());
        map.put("pointExchangeRate", p.getPointExchangeRate());
        map.put("exchangeRate", p.getPointExchangeRate());
        map.put("maxBurnPercentage", p.getMaxBurnPercentage());
        map.put("maxBurnPercent", p.getMaxBurnPercentage());
        map.put("burnRatio", p.getMaxBurnPercentage());
        map.put("minBurnPoints", p.getMinBurnPoints());
        map.put("minBillAmount", p.getMinBurnPoints());
        map.put("maxBurnPointsPerTx", p.getMaxBurnPointsPerTx());
        map.put("maxBurnPointsPerDay", p.getMaxBurnPointsPerDay());
        map.put("commissionRatePercent", p.getCommissionRatePercent());
        map.put("settlementCycle", p.getSettlementCycle());
        map.put("settlementCreditLimit", p.getSettlementCreditLimit());
        map.put("allowedPointTypes", p.getAllowedPointTypes());
        map.put("burnEnabled",
                p.getMaxBurnPercentage() != null && p.getMaxBurnPercentage().compareTo(BigDecimal.ZERO) > 0);
        map.put("status", p.getStatus());
        map.put("updatedAt", p.getUpdatedAt());
        return map;
    }

    private Map<String, Object> toSettlementMap(ClearingPaymentBatchEntity b) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", b.getId());
        map.put("batchCode", b.getBatchCode());
        map.put("partnerId", b.getPartnerId());
        map.put("period", b.getPeriod());
        map.put("periodFrom", b.getPeriod());
        map.put("periodTo", b.getPeriod());
        map.put("grossAmount", b.getGrossAmount());
        map.put("discountAmount", b.getDiscountAmount());
        map.put("mdrFeeAmount", b.getMdrFeeAmount());
        map.put("mdrFee", b.getMdrFeeAmount());
        map.put("netPayableAmount", b.getNetPayableAmount());
        map.put("netPayable", b.getNetPayableAmount());
        map.put("txCount", b.getTxCount());
        map.put("status", b.getStatus());
        map.put("confirmDeadlineAt", b.getConfirmDeadlineAt());
        map.put("confirmedAt", b.getConfirmedAt());
        map.put("confirmedBy", b.getConfirmedBy());
        map.put("paidAt", b.getPaidAt());
        map.put("bankRefCode", b.getBankRefCode());
        map.put("createdAt", b.getCreatedAt());
        return map;
    }

    private boolean belongsToPartner(ApprovalRequestEntity req, Long partnerId, Set<String> partnerStaffUsernames) {
        if (req.getTargetId() != null && req.getTargetId().equals(String.valueOf(partnerId))) {
            return true;
        }
        if (req.getMakerUsername() != null && partnerStaffUsernames.contains(req.getMakerUsername())) {
            return true;
        }
        Map<String, Object> parsed = parseJsonMap(req.getPayloadAfter());
        Object pId = parsed.get("partnerId");
        return pId != null && String.valueOf(partnerId).equals(String.valueOf(pId));
    }

    private Map<String, Object> toProposalMap(ApprovalRequestEntity req) {
        Map<String, Object> payload = parseJsonMap(req.getPayloadAfter());
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", req.getId());
        map.put("proposalCode", req.getRequestCode());
        map.put("requestCode", req.getRequestCode());
        map.put("partnerId", payload.getOrDefault("partnerId", req.getTargetId()));
        map.put("targetType", req.getTargetType());
        map.put("fundingType", payload.getOrDefault("fundingType", "CO_FUNDED"));
        map.put("proposalType",
                req.getTargetType() != null ? req.getTargetType().name() : ApprovalTargetType.PROGRAM.name());
        map.put("programName", payload.getOrDefault("programName", req.getTitle()));
        map.put("title", req.getTitle());
        map.put("description", payload.getOrDefault("description", req.getReason()));
        map.put("reason", req.getReason());
        map.put("proposedBudget", payload.get("proposedBudget"));
        map.put("natcashCoFundPercent", payload.get("natcashCoFundPercent"));
        map.put("earnRateBoostPercent", payload.get("earnRateBoostPercent"));
        map.put("budgetCap", payload.get("proposedBudget"));
        map.put("startDate", payload.get("startDate"));
        map.put("endDate", payload.get("endDate"));
        map.put("status", req.getStatus());
        map.put("reviewerNote", req.getRejectReason());
        map.put("createdAt", req.getCreatedAt());
        return map;
    }

    private Map<String, Object> toProposalMapFromResponse(ApprovalItemResponse resp, Long partnerId) {
        Map<String, Object> payload = parseJsonMap(resp.getPayloadAfter());
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", resp.getId());
        map.put("proposalCode", resp.getRequestCode());
        map.put("requestCode", resp.getRequestCode());
        map.put("partnerId", partnerId);
        map.put("targetType", resp.getTargetType());
        map.put("fundingType", payload.getOrDefault("fundingType", "CO_FUNDED"));
        map.put("proposalType",
                resp.getTargetType() != null ? resp.getTargetType().name() : ApprovalTargetType.PROGRAM.name());
        map.put("programName", payload.getOrDefault("programName", resp.getTitle()));
        map.put("title", resp.getTitle());
        map.put("description", payload.getOrDefault("description", resp.getReason()));
        map.put("proposedBudget", payload.get("proposedBudget"));
        map.put("natcashCoFundPercent", payload.get("natcashCoFundPercent"));
        map.put("earnRateBoostPercent", payload.get("earnRateBoostPercent"));
        map.put("startDate", payload.get("startDate"));
        map.put("endDate", payload.get("endDate"));
        map.put("status", resp.getStatus());
        map.put("reviewerNote", resp.getRejectReason());
        map.put("createdAt", resp.getCreatedAt());
        return map;
    }

    private BigDecimal resolveMaxBurnPercentage(Boolean allowBurn, BigDecimal maxBurnPercentage) {
        if (Boolean.FALSE.equals(allowBurn)) {
            return BigDecimal.ZERO;
        }
        return maxBurnPercentage != null
                ? maxBurnPercentage
                : SystemParameterService.get().getDecimal(SystemParamSpec.PARTNER_DEFAULT_MAX_BURN_PERCENT);
    }

    private ApprovalTargetType resolveProposalTargetType(Object raw) {
        if (raw == null) {
            return ApprovalTargetType.PROGRAM;
        }
        String code = String.valueOf(raw).trim().toUpperCase();
        ApprovalTargetType parsed = ApprovalTargetType.fromCode(code);
        return parsed != null ? parsed : ApprovalTargetType.PROGRAM;
    }

    private ApprovalActionType resolveProposalActionType(Object raw) {
        if (raw == null) {
            return ApprovalActionType.CREATE;
        }
        ApprovalActionType parsed = ApprovalActionType.fromCode(String.valueOf(raw).trim());
        return parsed != null ? parsed : ApprovalActionType.CREATE;
    }

    private String resolveCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.getName() != null && !SecurityConstants.PRINCIPAL_ANONYMOUS.equals(auth.getName()))
                ? auth.getName()
                : null;
    }

    private String firstNonBlank(Object a, Object b, String fallback) {
        if (a != null && !String.valueOf(a).isBlank()) {
            return String.valueOf(a).trim();
        }
        if (b != null && !String.valueOf(b).isBlank()) {
            return String.valueOf(b).trim();
        }
        return fallback;
    }

    private Map<String, Object> parseJsonMap(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, MAP_TYPE_REF);
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private String serializeJson(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception ignored) {
            return "{}";
        }
    }

    private boolean matchesKeyword(Map<String, Object> tx, String kw) {
        if (kw == null || kw.isBlank()) {
            return true;
        }
        return containsLower(tx.get("transactionId"), kw)
                || containsLower(tx.get("externalUserId"), kw)
                || containsLower(tx.get("referenceId"), kw)
                || containsLower(tx.get("description"), kw)
                || containsLower(tx.get("actionType"), kw);
    }

    private boolean containsLower(Object value, String kw) {
        return value != null && String.valueOf(value).toLowerCase().contains(kw);
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val instanceof BigDecimal bd) {
            return bd;
        }
        if (val instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        return BigDecimal.ZERO;
    }

    private Instant parseInstantBound(String dateStr, Instant fallback, boolean startOfDay) {
        if (dateStr == null || dateStr.isBlank()) {
            return fallback;
        }
        try {
            if (dateStr.length() == SystemParameterService.get().getInt(null, SystemParamSpec.ISO_LOCAL_DATE_LENGTH)) {
                LocalDate d = LocalDate.parse(dateStr);
                return startOfDay ? d.atStartOfDay().toInstant(ZoneOffset.UTC)
                        : d.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
            }
            return Instant.parse(dateStr);
        } catch (Exception ignored) {
            return fallback;
        }
    }
}
