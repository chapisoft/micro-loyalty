package com.natcash.loyalty.wallet;

import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;
import com.natcash.loyalty.wallet.service.VoucherServiceBatchAccess;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Free-voucher batches (Figma 18/11 "new batch every Monday"): opened lazily on the first collect after the period rolls over. */
class VoucherFreeBatchTest {

    @Test
    void weeklyBatchStartsOnMondayUtc() {
        Instant thursday = Instant.parse("2026-11-19T15:30:00Z");
        assertEquals(Instant.parse("2026-11-16T00:00:00Z"), VoucherServiceBatchAccess.batchStart("WEEKLY", thursday));
        assertEquals(Instant.parse("2026-11-19T00:00:00Z"), VoucherServiceBatchAccess.batchStart("DAILY", thursday));
        assertNull(VoucherServiceBatchAccess.batchStart("NONE", thursday));
    }

    @Test
    void newWeekRefillsTheBatchOnceAndKeepsItWithinTheWeek() {
        LoyaltyVoucherEntity v = LoyaltyVoucherEntity.builder().batchPeriod("WEEKLY").batchQuantity(500).availableQuantity(0)
                .batchStartedAt(Instant.parse("2026-11-09T00:00:00Z")).build();

        assertTrue(VoucherServiceBatchAccess.refreshBatch(v, Instant.parse("2026-11-16T08:00:00Z")));
        assertEquals(500, v.getAvailableQuantity());

        v.setAvailableQuantity(120); // 380 collected during the week
        assertFalse(VoucherServiceBatchAccess.refreshBatch(v, Instant.parse("2026-11-20T08:00:00Z")));
        assertEquals(120, v.getAvailableQuantity());
    }

    @Test
    void vouchersWithoutBatchesAreNeverRefilled() {
        LoyaltyVoucherEntity v = LoyaltyVoucherEntity.builder().availableQuantity(3).build();
        assertFalse(VoucherServiceBatchAccess.refreshBatch(v, Instant.now()));
        assertEquals(3, v.getAvailableQuantity());
    }
}
