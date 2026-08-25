package com.natcash.loyalty.integration;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileRequest;
import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.entity.LoyaltyTierEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.account.repository.LoyaltyTierRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.batch.PointExpirationJob;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodResponse;
import com.natcash.loyalty.clearing.service.ClearingSettlementService;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.TierLevel;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.stream.LoyaltyStreamProducer;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FullLifecycleE2ETest {

    @Mock
    private LoyaltyAccountRepository accountRepository;
    @Mock
    private LoyaltyTierRepository tierRepository;
    @Mock
    private LoyaltyPointLedgerRepository ledgerRepository;
    @Mock
    private LoyaltyPartnerRepository partnerRepository;
    @Mock
    private ClearingTransactionRepository clearingRepository;
    @Mock
    private LoyaltyStreamProducer streamProducer;
    @Mock
    private RedissonClient redissonClient;
    @Mock
    private RLock rLock;

    private DistributedLockHelper lockHelper;
    private AccountService accountService;
    private ClearingSettlementService clearingService;
    private PointExpirationJob pointExpirationJob;

    private static final String TENANT_ID = "TENANT_DELIMART";
    private static final String USER_ID = "USER_E2E_9999";

    @BeforeEach
    void setUp() throws InterruptedException {
        when(rLock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
        when(rLock.isHeldByCurrentThread()).thenReturn(true);
        when(redissonClient.getLock(anyString())).thenReturn(rLock);

        lockHelper = new DistributedLockHelper(redissonClient) {
            @Override
            public <T> T executeWithLock(String lockKey, long waitTimeMs, long leaseTimeMs, Supplier<T> task) {
                return task.get();
            }
        };

        accountService = new AccountService(accountRepository, tierRepository, streamProducer);
        clearingService = new ClearingSettlementService(clearingRepository, partnerRepository);
        pointExpirationJob = new PointExpirationJob(accountRepository, ledgerRepository, lockHelper);
    }

    @Test
    @DisplayName("E2E Chu Trình Khép Kín: Tích điểm -> Chơi Game -> Tiêu POS -> Bù trừ -> Quét Hạn Điểm FIFO")
    void testFullLoyaltyLifecycle() {
        // GIAI ĐOẠN 1: Tạo Tài Khoản & Tích Điểm Ban Đầu
        LoyaltyTierEntity silverTier = LoyaltyTierEntity.builder()
                .id(1L).code(TierLevel.SILVER).name("Bạc").tierLevel(1)
                .minPoints(BigDecimal.ZERO).pointMultiplier(BigDecimal.ONE).freeDailyTurns(2).build();

        LoyaltyTierEntity goldTier = LoyaltyTierEntity.builder()
                .id(2L).code(TierLevel.GOLD).name("Vàng").tierLevel(2)
                .minPoints(BigDecimal.valueOf(1000)).pointMultiplier(BigDecimal.valueOf(1.2)).freeDailyTurns(5).build();

        when(tierRepository.findByTenantIdOrderByTierLevelAsc(TENANT_ID)).thenReturn(List.of(silverTier, goldTier));

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .id(100L)
                .tenantId(TENANT_ID)
                .externalUserId(USER_ID)
                .phoneNumber("0987654321")
                .fullName("Khách Hàng E2E")
                .currentPoints(BigDecimal.valueOf(500))
                .tierPoints(BigDecimal.valueOf(500))
                .tier(silverTier)
                .status(CommonStatus.ACTIVE)
                .build();

        when(accountRepository.findByTenantIdAndExternalUserId(TENANT_ID, USER_ID)).thenReturn(Optional.of(account));
        when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ProfileResponse profile = accountService.getOrCreateProfile(
                TENANT_ID,
                ProfileRequest.builder().externalUserId(USER_ID).fullName("Khách Hàng E2E").phoneNumber("0987654321").build()
        );
        assertNotNull(profile);
        assertEquals(500, profile.getCurrentPoints().intValue());

        // GIAI ĐOẠN 2: Nâng Hạng Hội Viên Lên Vàng (GOLD) Khi Đạt Mốc
        account.setTierPoints(BigDecimal.valueOf(1500));
        account.setCurrentPoints(BigDecimal.valueOf(1500));
        account.setTier(goldTier);

        ProfileResponse goldProfile = accountService.getOrCreateProfile(
                TENANT_ID,
                ProfileRequest.builder().externalUserId(USER_ID).fullName("Khách Hàng E2E").phoneNumber("0987654321").build()
        );
        assertEquals("GOLD", goldProfile.getTier().getCode().name());

        // GIAI ĐOẠN 3: Quyết Toán Bù Trừ Công Nợ Tài Chính Đa Phương
        LoyaltyPartnerEntity partnerDelimart = LoyaltyPartnerEntity.builder()
                .id(1L).tenantId(TENANT_ID).partnerCode("DELIMART_POS").partnerName("Siêu Thị Delimart").build();
        when(partnerRepository.findByTenantId(TENANT_ID)).thenReturn(List.of(partnerDelimart));

        ClearingTransactionEntity clearingTx = ClearingTransactionEntity.builder()
                .id(10L)
                .tenantId(TENANT_ID)
                .issuerPartnerId(1L)
                .redeemerPartnerId(1L)
                .pointsRedeemed(BigDecimal.valueOf(200))
                .fiatAmount(BigDecimal.valueOf(200))
                .status(ClearingStatus.PENDING)
                .createdAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .build();

        when(clearingRepository.findByTenantIdAndCreatedAtBetween(eq(TENANT_ID), any(), any()))
                .thenReturn(List.of(clearingTx));

        ReconciliationReportResponse report = clearingService.getReconciliationReport(
                TENANT_ID,
                ReconciliationReportRequest.builder()
                        .fromDate(Instant.now().minus(7, ChronoUnit.DAYS))
                        .toDate(Instant.now())
                        .build()
        );
        assertNotNull(report);
        assertEquals(1, report.getGrandTotalTransactions());
        assertEquals(200, report.getGrandTotalPointsRedeemed().intValue());

        SettlePeriodResponse settleRes = clearingService.settlePeriod(
                TENANT_ID,
                SettlePeriodRequest.builder()
                        .fromDate(Instant.now().minus(7, ChronoUnit.DAYS))
                        .toDate(Instant.now())
                        .build()
        );
        assertNotNull(settleRes);
        assertEquals(ClearingStatus.SETTLED, settleRes.getStatus());
        assertTrue(settleRes.getSettlementBatchCode().startsWith("SETTLE_"));

        // GIAI ĐOẠN 4: Quét Điểm Hết Hạn Phân Trang FIFO
        LoyaltyPointLedgerEntity expiredLedgerEntry = LoyaltyPointLedgerEntity.builder()
                .id(999L)
                .account(account)
                .tenantId(TENANT_ID)
                .changeType(PointActionType.EARN)
                .pointChange(BigDecimal.valueOf(100))
                .balanceAfter(BigDecimal.valueOf(1500))
                .referenceCode("EARN_REF_999")
                .expiredAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .build();

        when(accountRepository.findAll(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(account)));
        when(ledgerRepository.findTop500ByChangeTypeInAndExpiredAtBeforeAndExpiredAtIsNotNullOrderByIdAsc(anyCollection(), any(Instant.class)))
                .thenReturn(List.of(expiredLedgerEntry));

        assertDoesNotThrow(() -> pointExpirationJob.executePointExpiration());
    }
}
