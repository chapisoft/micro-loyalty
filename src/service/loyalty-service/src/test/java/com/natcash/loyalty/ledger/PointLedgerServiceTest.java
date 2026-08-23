package com.natcash.loyalty.ledger;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyTierEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.TierLevel;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.EarnPointRequest;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.EarnPointResponse;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.PointHistoryRequest;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.PointHistoryResponse;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.ledger.service.PointLedgerService;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.stream.LoyaltyStreamEvent;
import com.natcash.loyalty.stream.LoyaltyStreamProducer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PointLedgerServiceTest {

    @Mock
    private LoyaltyPointLedgerRepository ledgerRepository;

    @Mock
    private LoyaltyAccountRepository accountRepository;

    @Mock
    private AccountService accountService;

    @Mock
    private DistributedLockHelper lockHelper;

    @Mock
    private LoyaltyStreamProducer streamProducer;

    private PointLedgerService pointLedgerService;

    @BeforeEach
    void setUp() {
        pointLedgerService = new PointLedgerService(
                ledgerRepository,
                accountRepository,
                accountService,
                lockHelper,
                streamProducer
        );
    }

    @Test
    @DisplayName("BE-10.1: Tích điểm với hệ số nhân hạng Vàng (x1.2)")
    void testEarnPointsWithMultiplier() {
        when(ledgerRepository.existsByTenantIdAndReferenceCode("TENANT_DELIMART", "TXN_001"))
                .thenReturn(false);

        when(lockHelper.executeWithLock(anyString(), anyLong(), anyLong(), any()))
                .thenAnswer(invocation -> {
                    Supplier<?> supplier = invocation.getArgument(3);
                    return supplier.get();
                });

        LoyaltyTierEntity goldTier = LoyaltyTierEntity.builder()
                .code(TierLevel.GOLD)
                .pointMultiplier(new BigDecimal("1.20"))
                .build();

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("USER_001")
                .tier(goldTier)
                .currentPoints(new BigDecimal("100.00"))
                .tierPoints(new BigDecimal("100.00"))
                .build();

        when(accountService.getAccountForUpdate("TENANT_DELIMART", "USER_001"))
                .thenReturn(account);

        EarnPointRequest request = EarnPointRequest.builder()
                .externalUserId("USER_001")
                .billAmount(new BigDecimal("500.00"))
                .transactionCode("TXN_001")
                .partnerCode("DELIMART")
                .description("Mua hàng tạp hóa")
                .build();

        EarnPointResponse response = pointLedgerService.earnPoints("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals("TXN_001", response.getTransactionCode());
        // 500 * 1.2 = 600 points
        assertEquals(new BigDecimal("600.00"), response.getPointsEarned());
        // 100 + 600 = 700 points
        assertEquals(new BigDecimal("700.00"), response.getCurrentPoints());

        verify(ledgerRepository, times(1)).save(any(LoyaltyPointLedgerEntity.class));
        verify(streamProducer, times(1)).publishEvent(any(LoyaltyStreamEvent.class));
    }

    @Test
    @DisplayName("BE-10.2: Từ chối giao dịch trùng lặp mã (Idempotency)")
    void testRejectDuplicateTransaction() {
        when(ledgerRepository.existsByTenantIdAndReferenceCode("TENANT_DELIMART", "TXN_EXISTING"))
                .thenReturn(true);

        EarnPointRequest request = EarnPointRequest.builder()
                .externalUserId("USER_001")
                .billAmount(new BigDecimal("100.00"))
                .transactionCode("TXN_EXISTING")
                .build();

        assertThrows(LoyaltyException.class, () ->
                pointLedgerService.earnPoints("TENANT_DELIMART", request));

        verify(accountRepository, never()).save(any());
        verify(ledgerRepository, never()).save(any());
    }

    @Test
    @DisplayName("BE-10.3: Phân trang lịch sử sổ cái điểm")
    void testGetPointHistory() {
        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .id(1L)
                .externalUserId("USER_001")
                .build();

        LoyaltyPointLedgerEntity item1 = LoyaltyPointLedgerEntity.builder()
                .id(101L)
                .account(account)
                .pointChange(new BigDecimal("50.00"))
                .balanceAfter(new BigDecimal("150.00"))
                .changeType(PointActionType.EARN)
                .referenceCode("TXN_01")
                .createdAt(Instant.now())
                .build();

        Page<LoyaltyPointLedgerEntity> page = new PageImpl<>(List.of(item1));
        when(ledgerRepository.findByTenantIdAndAccount_ExternalUserIdOrderByCreatedAtDesc(
                eq("TENANT_DELIMART"), eq("USER_001"), any(Pageable.class)))
                .thenReturn(page);

        PointHistoryRequest request = PointHistoryRequest.builder()
                .externalUserId("USER_001")
                .page(0)
                .size(10)
                .build();

        PointHistoryResponse response = pointLedgerService.getPointHistory("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        assertEquals(1, response.getTotalElements());
        assertEquals(new BigDecimal("50.00"), response.getItems().get(0).getPointChange());
    }
}
