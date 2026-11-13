package com.natcash.loyalty.approval.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.approval.dto.ApprovalDto.ApprovalItemResponse;
import com.natcash.loyalty.approval.dto.ApprovalDto.ApprovalPageResponse;
import com.natcash.loyalty.approval.dto.ApprovalDto.CreateApprovalRequest;
import com.natcash.loyalty.approval.entity.ApprovalRequestEntity;
import com.natcash.loyalty.approval.repository.ApprovalRequestRepository;
import com.natcash.loyalty.audit.event.AuditLogEvent;
import com.natcash.loyalty.audit.service.SystemAuditLogService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.ApprovalActionType;
import com.natcash.loyalty.domain.enums.ApprovalStatus;
import com.natcash.loyalty.domain.enums.ApprovalTargetType;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.CurrencyAssetType;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.ledger.service.PointBucketFifoService;
import com.natcash.loyalty.lock.DistributedLockHelper;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ApprovalQueueService {

    private static final String AUDIT_MODULE = "APPROVAL_QUEUE";
    private static final String AUDIT_TABLE = "approval_requests";
    private static final String DEFAULT_SYSTEM_ACTOR = "system_operator";

    private final ApprovalRequestRepository approvalRepository;
    private final SystemAuditLogService auditLogService;
    private final DistributedLockHelper lockHelper;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private LoyaltyAccountRepository accountRepository;

    @Autowired(required = false)
    private LoyaltyPointLedgerRepository ledgerRepository;

    @Autowired(required = false)
    private PointBucketFifoService fifoService;

    public ApprovalQueueService(ApprovalRequestRepository approvalRepository,
                                SystemAuditLogService auditLogService,
                                DistributedLockHelper lockHelper,
                                ObjectMapper objectMapper) {
        this.approvalRepository = approvalRepository;
        this.auditLogService = auditLogService;
        this.lockHelper = lockHelper;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    @Transactional(readOnly = true)
    public ApprovalPageResponse listApprovals(String tenantId, ApprovalStatus status, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = size > 0 ? Math.min(size, 100) : 20;
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Page<ApprovalRequestEntity> pageResult = status != null
                ? approvalRepository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, status, pageable)
                : approvalRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);

        List<ApprovalItemResponse> items = pageResult != null && pageResult.hasContent()
                ? pageResult.getContent().stream().map(this::toDto).collect(Collectors.toList())
                : Collections.emptyList();

        long pendingCount = approvalRepository.countByTenantIdAndStatus(tenantId, ApprovalStatus.PENDING);

        return ApprovalPageResponse.builder()
                .items(items)
                .content(items)
                .totalElements(pageResult != null ? pageResult.getTotalElements() : 0L)
                .totalPages(pageResult != null ? pageResult.getTotalPages() : 0)
                .currentPage(safePage)
                .pageSize(safeSize)
                .pendingCount(pendingCount)
                .build();
    }

    @Transactional
    public ApprovalItemResponse submitRequest(String tenantId, CreateApprovalRequest request) {
        String maker = resolveActor(request.getMakerUsername());
        String requestCode = "APR_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();

        ApprovalRequestEntity entity = ApprovalRequestEntity.builder()
                .requestCode(requestCode)
                .tenantId(tenantId)
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .actionType(request.getActionType())
                .title(request.getTitle())
                .payloadBefore(toJsonString(request.getPayloadBefore()))
                .payloadAfter(toJsonString(request.getPayloadAfter()))
                .makerUsername(maker)
                .status(ApprovalStatus.PENDING)
                .reason(request.getReason())
                .build();

        ApprovalRequestEntity saved = approvalRepository.save(entity);
        recordAudit(tenantId, "SUBMIT", String.valueOf(saved.getId()), maker,
                saved.getPayloadBefore(), saved.getPayloadAfter(),
                "Submitted maker-checker request " + saved.getRequestCode());
        return toDto(saved);
    }

    @Transactional
    public ApprovalItemResponse approve(String tenantId, Long id, String checkerUsernameInput, String note) {
        String checker = resolveActor(checkerUsernameInput);
        String lockKey = RedisKeys.getApprovalLockKey(tenantId, id);
        if (lockHelper != null) {
            return lockHelper.executeWithLock(lockKey, () -> executeApprove(tenantId, id, checker, note));
        }
        return executeApprove(tenantId, id, checker, note);
    }

    private ApprovalItemResponse executeApprove(String tenantId, Long id, String checker, String note) {
        ApprovalRequestEntity entity = approvalRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));

        if (entity.getStatus() != ApprovalStatus.PENDING) {
            throw new LoyaltyException(ErrorCode.APPROVAL_ALREADY_PROCESSED);
        }

        if (entity.getMakerUsername() != null && entity.getMakerUsername().equalsIgnoreCase(checker)) {
            throw new LoyaltyException(ErrorCode.MAKER_CHECKER_VIOLATION);
        }

        String beforeAuditJson = toJsonString(entity);
        entity.setStatus(ApprovalStatus.APPROVED);
        entity.setCheckerUsername(checker);
        entity.setReviewedAt(Instant.now());
        if (note != null && !note.isBlank()) {
            entity.setReason((entity.getReason() != null ? entity.getReason() + " | " : "") + note.trim());
        }

        applyApprovedSideEffect(tenantId, entity);
        ApprovalRequestEntity saved = approvalRepository.save(entity);

        recordAudit(tenantId, "APPROVE", String.valueOf(saved.getId()), checker,
                entity.getPayloadBefore() != null ? entity.getPayloadBefore() : beforeAuditJson,
                entity.getPayloadAfter() != null ? entity.getPayloadAfter() : toJsonString(saved),
                "Approved request " + saved.getRequestCode() + " by checker " + checker);

        return toDto(saved);
    }

    @Transactional
    public ApprovalItemResponse reject(String tenantId, Long id, String checkerUsernameInput, String rejectReason) {
        String checker = resolveActor(checkerUsernameInput);
        String lockKey = RedisKeys.getApprovalLockKey(tenantId, id);
        if (lockHelper != null) {
            return lockHelper.executeWithLock(lockKey, () -> executeReject(tenantId, id, checker, rejectReason));
        }
        return executeReject(tenantId, id, checker, rejectReason);
    }

    private ApprovalItemResponse executeReject(String tenantId, Long id, String checker, String rejectReason) {
        ApprovalRequestEntity entity = approvalRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));

        if (entity.getStatus() != ApprovalStatus.PENDING) {
            throw new LoyaltyException(ErrorCode.APPROVAL_ALREADY_PROCESSED);
        }

        if (entity.getMakerUsername() != null && entity.getMakerUsername().equalsIgnoreCase(checker)) {
            throw new LoyaltyException(ErrorCode.MAKER_CHECKER_VIOLATION);
        }

        String beforeAuditJson = toJsonString(entity);
        entity.setStatus(ApprovalStatus.REJECTED);
        entity.setCheckerUsername(checker);
        entity.setRejectReason(rejectReason);
        entity.setReviewedAt(Instant.now());

        ApprovalRequestEntity saved = approvalRepository.save(entity);

        recordAudit(tenantId, "REJECT", String.valueOf(saved.getId()), checker,
                beforeAuditJson, toJsonString(saved),
                "Rejected request " + saved.getRequestCode() + ": " + rejectReason);

        return toDto(saved);
    }

    private void applyApprovedSideEffect(String tenantId, ApprovalRequestEntity entity) {
        if (accountRepository == null || entity.getPayloadAfter() == null) {
            return;
        }
        try {
            JsonNode payload = objectMapper.readTree(entity.getPayloadAfter());
            if (entity.getTargetType() == ApprovalTargetType.POINT_ADJUSTMENT) {
                applyPointAdjustment(tenantId, entity, payload);
            } else if (entity.getTargetType() == ApprovalTargetType.ACCOUNT_LOCK) {
                applyAccountLock(tenantId, entity, payload);
            }
        } catch (JsonProcessingException ex) {
            log.warn("Unable to parse approval payloadAfter JSON for request {}: {}", entity.getRequestCode(), ex.getMessage());
        }
    }

    private void applyPointAdjustment(String tenantId, ApprovalRequestEntity entity, JsonNode payload) {
        String externalUserId = payload.hasNonNull("externalUserId")
                ? payload.get("externalUserId").asText()
                : entity.getTargetId();
        if (!payload.hasNonNull("delta")) {
            return;
        }
        BigDecimal delta = new BigDecimal(payload.get("delta").asText());
        BigDecimal maxLimit = new BigDecimal(LoyaltyConstants.DEFAULT_POINT_ADJUSTMENT_MAX_LIMIT);
        if (delta.abs().compareTo(maxLimit) > 0) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Point adjustment exceeds configured max limit");
        }

        LoyaltyAccountEntity account = accountRepository.findByTenantIdAndExternalUserIdForUpdate(tenantId, externalUserId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND));

        BigDecimal current = account.getCurrentPoints() != null ? account.getCurrentPoints() : BigDecimal.ZERO;
        BigDecimal next = current.add(delta);
        if (next.compareTo(BigDecimal.ZERO) < 0) {
            throw new LoyaltyException(ErrorCode.INSUFFICIENT_POINTS);
        }

        account.setCurrentPoints(next);
        accountRepository.save(account);

        if (fifoService != null) {
            if (delta.compareTo(BigDecimal.ZERO) > 0) {
                Instant expiredAt = Instant.now().plus(LoyaltyConstants.DEFAULT_POINT_EXPIRATION_MONTHS * 30L, ChronoUnit.DAYS);
                fifoService.createEarnBucket(tenantId, account.getId(), delta, expiredAt,
                        entity.getRequestCode(), CurrencyAssetType.LOYALTY_COIN);
            } else if (delta.compareTo(BigDecimal.ZERO) < 0) {
                fifoService.consumeFifo(tenantId, account.getId(), delta.abs(), CurrencyAssetType.LOYALTY_COIN);
            }
        }

        if (ledgerRepository != null) {
            LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                    .tenantId(tenantId)
                    .account(account)
                    .pointChange(delta)
                    .balanceAfter(next)
                    .changeType(PointActionType.ADJUST)
                    .referenceCode(entity.getRequestCode())
                    .description(entity.getReason() != null ? entity.getReason() : entity.getTitle())
                    .createdAt(Instant.now())
                    .build();
            ledgerRepository.save(ledger);
        }
    }

    private void applyAccountLock(String tenantId, ApprovalRequestEntity entity, JsonNode payload) {
        String externalUserId = payload.hasNonNull("externalUserId")
                ? payload.get("externalUserId").asText()
                : entity.getTargetId();
        LoyaltyAccountEntity account = accountRepository.findByTenantIdAndExternalUserIdForUpdate(tenantId, externalUserId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND));

        boolean lock = entity.getActionType() == ApprovalActionType.LOCK
                || (payload.has("lock") && payload.get("lock").asBoolean(true));
        account.setStatus(lock ? CommonStatus.LOCKED : CommonStatus.ACTIVE);
        account.setLockReason(lock ? entity.getReason() : null);
        accountRepository.save(account);
    }

    private void recordAudit(String tenantId,
                             String operation,
                             String entityId,
                             String actor,
                             String beforeData,
                             String afterData,
                             String description) {
        if (auditLogService == null) {
            return;
        }
        auditLogService.recordAction(AuditLogEvent.builder()
                .tenantId(tenantId)
                .module(AUDIT_MODULE)
                .tableName(AUDIT_TABLE)
                .operation(operation)
                .entityId(entityId)
                .actorUsername(actor)
                .beforeData(beforeData)
                .afterData(afterData)
                .description(description)
                .status(LoyaltyConstants.STATUS_SUCCESS)
                .build());
    }

    private String resolveActor(String suppliedActor) {
        if (suppliedActor != null && !suppliedActor.isBlank()) {
            return suppliedActor.trim();
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        return DEFAULT_SYSTEM_ACTOR;
    }

    private String toJsonString(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof String str) {
            return str;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return "{}";
        }
    }

    private ApprovalItemResponse toDto(ApprovalRequestEntity entity) {
        return ApprovalItemResponse.builder()
                .id(entity.getId())
                .requestCode(entity.getRequestCode())
                .tenantId(entity.getTenantId())
                .targetType(entity.getTargetType())
                .targetId(entity.getTargetId())
                .actionType(entity.getActionType())
                .title(entity.getTitle())
                .payloadBefore(entity.getPayloadBefore())
                .payloadAfter(entity.getPayloadAfter())
                .makerUsername(entity.getMakerUsername())
                .checkerUsername(entity.getCheckerUsername())
                .status(entity.getStatus())
                .reason(entity.getReason())
                .rejectReason(entity.getRejectReason())
                .reviewedAt(entity.getReviewedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
