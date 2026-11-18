package com.natcash.loyalty.wallet.service;

import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;

import java.time.Instant;

/** Test-only bridge to VoucherService's package-private batch helpers. */
public final class VoucherServiceBatchAccess {
    private VoucherServiceBatchAccess() {
    }

    public static Instant batchStart(String period, Instant now) {
        return VoucherService.batchStart(period, now);
    }

    public static boolean refreshBatch(LoyaltyVoucherEntity v, Instant now) {
        return VoucherService.refreshBatch(v, now);
    }
}
