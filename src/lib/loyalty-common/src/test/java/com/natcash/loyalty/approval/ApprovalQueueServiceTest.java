package com.natcash.loyalty.approval;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.approval.dto.ApprovalDto.ApprovalItemResponse;
import com.natcash.loyalty.approval.entity.ApprovalRequestEntity;
import com.natcash.loyalty.approval.repository.ApprovalRequestRepository;
import com.natcash.loyalty.approval.service.ApprovalQueueService;
import com.natcash.loyalty.audit.service.SystemAuditLogService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.ApprovalActionType;
import com.natcash.loyalty.domain.enums.ApprovalStatus;
import com.natcash.loyalty.domain.enums.ApprovalTargetType;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.ledger.service.PointBucketFifoService;
import com.natcash.loyalty.lock.DistributedLockHelper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApprovalQueueServiceTest {

    private static final String TENANT_ID = "TENANT_NATCASH";

    @Mock
    private ApprovalRequestRepository approvalRepository;
    @Mock
    private SystemAuditLogService auditLogService;
    @Mock
    private DistributedLockHelper lockHelper;
    @Mock
    private LoyaltyAccountRepository accountRepository;
    @Mock
    private LoyaltyPointLedgerRepository ledgerRepository;
    @Mock
    private PointBucketFifoService fifoService;

    private ApprovalQueueService approvalQueueService;

    @BeforeEach
    void setUp() {
        approvalQueueService = new ApprovalQueueService(
                approvalRepository, auditLogService, lockHelper, new ObjectMapper());
        ReflectionTestUtils.setField(approvalQueueService, "accountRepository", accountRepository);
        ReflectionTestUtils.setField(approvalQueueService, "ledgerRepository", ledgerRepository);
        ReflectionTestUtils.setField(approvalQueueService, "fifoService", fifoService);

        lenient().when(lockHelper.executeWithLock(anyString(), ArgumentMatchers.<Supplier<?>>any()))
                .thenAnswer(inv -> ((Supplier<?>) inv.getArgument(1)).get());
    }

    @Test
    void approve_shouldThrowMakerCheckerViolationWhenSameUser() {
        ApprovalRequestEntity pending = ApprovalRequestEntity.builder()
                .id(1L)
                .requestCode("APR_001")
                .tenantId(TENANT_ID)
                .targetType(ApprovalTargetType.POLICY)
                .targetId("POL_1")
                .actionType(ApprovalActionType.UPDATE)
                .makerUsername("maker_alice")
                .status(ApprovalStatus.PENDING)
                .build();

        when(approvalRepository.findByIdAndTenantId(1L, TENANT_ID)).thenReturn(Optional.of(pending));

        LoyaltyException ex = assertThrows(LoyaltyException.class,
                () -> approvalQueueService.approve(TENANT_ID, 1L, "maker_alice", "self approve"));
        assertEquals(ErrorCode.MAKER_CHECKER_VIOLATION, ex.getErrorCode());
    }

    @Test
    void approve_shouldApplyPointAdjustmentAndWriteAuditLogWhenDifferentChecker() {
        ApprovalRequestEntity pending = ApprovalRequestEntity.builder()
                .id(2L)
                .requestCode("APR_002")
                .tenantId(TENANT_ID)
                .targetType(ApprovalTargetType.POINT_ADJUSTMENT)
                .targetId("50937123456")
                .actionType(ApprovalActionType.ADJUST)
                .payloadBefore("{\"currentPoints\":100}")
                .payloadAfter("{\"externalUserId\":\"50937123456\",\"delta\":250}")
                .makerUsername("maker_alice")
                .status(ApprovalStatus.PENDING)
                .reason("Compensate downtime")
                .build();

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .id(99L)
                .tenantId(TENANT_ID)
                .externalUserId("50937123456")
                .currentPoints(new BigDecimal("100.00"))
                .build();

        when(approvalRepository.findByIdAndTenantId(2L, TENANT_ID)).thenReturn(Optional.of(pending));
        when(accountRepository.findByTenantIdAndExternalUserIdForUpdate(TENANT_ID, "50937123456"))
                .thenReturn(Optional.of(account));
        when(approvalRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ApprovalItemResponse result = approvalQueueService.approve(TENANT_ID, 2L, "checker_bob", "Verified");

        assertEquals(ApprovalStatus.APPROVED, result.getStatus());
        assertEquals("checker_bob", result.getCheckerUsername());
        assertEquals(0, new BigDecimal("350.00").compareTo(account.getCurrentPoints()));
        verify(fifoService).createEarnBucket(any(), any(), any(), any(), any(), any());
        verify(ledgerRepository).save(any());
        verify(auditLogService).recordAction(any());
    }

    @Test
    void reject_shouldThrowIfAlreadyProcessed() {
        ApprovalRequestEntity approved = ApprovalRequestEntity.builder()
                .id(3L)
                .tenantId(TENANT_ID)
                .makerUsername("maker_alice")
                .status(ApprovalStatus.APPROVED)
                .build();

        when(approvalRepository.findByIdAndTenantId(3L, TENANT_ID)).thenReturn(Optional.of(approved));

        LoyaltyException ex = assertThrows(LoyaltyException.class,
                () -> approvalQueueService.reject(TENANT_ID, 3L, "checker_bob", "too late"));
        assertEquals(ErrorCode.APPROVAL_ALREADY_PROCESSED, ex.getErrorCode());
    }
}
