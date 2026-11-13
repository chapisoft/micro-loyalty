package com.natcash.loyalty.ledger;

import com.natcash.loyalty.domain.enums.BucketStatus;
import com.natcash.loyalty.domain.enums.CurrencyAssetType;
import com.natcash.loyalty.ledger.entity.PointExpirationBucketEntity;
import com.natcash.loyalty.ledger.repository.PointExpirationBucketRepository;
import com.natcash.loyalty.ledger.service.PointBucketFifoService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PointBucketFifoServiceTest {

    private static final String TENANT_ID = "TENANT_NATCASH";

    @Mock
    private PointExpirationBucketRepository bucketRepository;

    private PointBucketFifoService fifoService;

    @BeforeEach
    void setUp() {
        fifoService = new PointBucketFifoService(bucketRepository);
    }

    @Test
    void consumeFifo_shouldDeductOldestBucketFirstAndDepleteIt() {
        Instant now = Instant.now();
        PointExpirationBucketEntity older = PointExpirationBucketEntity.builder()
                .id(1L)
                .tenantId(TENANT_ID)
                .accountId(10L)
                .assetType(CurrencyAssetType.LOYALTY_COIN)
                .initialPoints(new BigDecimal("100.00"))
                .remainingPoints(new BigDecimal("100.00"))
                .expiredAt(now.plus(10, ChronoUnit.DAYS))
                .status(BucketStatus.ACTIVE)
                .build();
        PointExpirationBucketEntity newer = PointExpirationBucketEntity.builder()
                .id(2L)
                .tenantId(TENANT_ID)
                .accountId(10L)
                .assetType(CurrencyAssetType.LOYALTY_COIN)
                .initialPoints(new BigDecimal("200.00"))
                .remainingPoints(new BigDecimal("200.00"))
                .expiredAt(now.plus(90, ChronoUnit.DAYS))
                .status(BucketStatus.ACTIVE)
                .build();

        when(bucketRepository.findActiveBucketsFifoForUpdate(TENANT_ID, 10L, CurrencyAssetType.LOYALTY_COIN))
                .thenReturn(List.of(older, newer));
        when(bucketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        BigDecimal deducted = fifoService.consumeFifo(
                TENANT_ID, 10L, new BigDecimal("150.00"), CurrencyAssetType.LOYALTY_COIN);

        assertEquals(0, new BigDecimal("150.00").compareTo(deducted));
        assertEquals(0, BigDecimal.ZERO.compareTo(older.getRemainingPoints()));
        assertEquals(BucketStatus.DEPLETED, older.getStatus());
        assertEquals(0, new BigDecimal("150.00").compareTo(newer.getRemainingPoints()));
        assertEquals(BucketStatus.ACTIVE, newer.getStatus());
        verify(bucketRepository, times(2)).save(any());
    }

    @Test
    void createEarnBucket_shouldPersistActiveBucket() {
        when(bucketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PointExpirationBucketEntity saved = fifoService.createEarnBucket(
                TENANT_ID, 10L, new BigDecimal("250.00"), null, "TX_001", CurrencyAssetType.LOYALTY_COIN);

        assertNotNull(saved);
        assertEquals(BucketStatus.ACTIVE, saved.getStatus());
        assertEquals(0, new BigDecimal("250.00").compareTo(saved.getRemainingPoints()));
        assertEquals("TX_001", saved.getSourceRef());
    }

    @Test
    void expireDueBuckets_shouldMarkExpiredAndZeroRemaining() {
        PointExpirationBucketEntity due = PointExpirationBucketEntity.builder()
                .id(5L)
                .tenantId(TENANT_ID)
                .accountId(10L)
                .remainingPoints(new BigDecimal("40.00"))
                .expiredAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .status(BucketStatus.ACTIVE)
                .build();
        when(bucketRepository.findTop500ByStatusAndRemainingPointsGreaterThanAndExpiredAtBeforeOrderByExpiredAtAsc(
                any(), any(), any())).thenReturn(List.of(due));

        int count = fifoService.expireDueBuckets();

        assertEquals(1, count);
        assertEquals(BucketStatus.EXPIRED, due.getStatus());
        assertEquals(0, BigDecimal.ZERO.compareTo(due.getRemainingPoints()));
    }
}
