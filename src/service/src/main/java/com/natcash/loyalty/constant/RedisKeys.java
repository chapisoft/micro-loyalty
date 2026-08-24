package com.natcash.loyalty.constant;

public final class RedisKeys {

    private RedisKeys() {
        // Chặn khởi tạo class hằng số
    }

    public static final String LOCK_BURN_POINT_PREFIX = "lock:burn:";
    public static final String LOCK_SPIN_PREFIX = "lock:spin:";
    public static final String LOCK_VOUCHER_CLAIM_PREFIX = "lock:voucher:claim:";
    public static final String LOCK_OUTBOX_PUBLISHER = "lock:outbox:publisher";

    public static final String IDEMPOTENCY_PREFIX = "idempotency:tx:";
    public static final String DAILY_SPIN_STOCK_PREFIX = "stock:prize:daily:";
    public static final String TOTAL_PRIZE_STOCK_PREFIX = "stock:prize:total:";
    public static final String SESSION_TICKET_PREFIX = "sso:ticket:";
    public static final String QR_PAYMENT_TOKEN_PREFIX = "qr:token:";

    public static String getBurnLockKey(String tenantId, String userId) {
        return LOCK_BURN_POINT_PREFIX + tenantId + ":" + userId;
    }

    public static String getSpinLockKey(String tenantId, String userId, Long gameId) {
        return LOCK_SPIN_PREFIX + tenantId + ":" + gameId + ":" + userId;
    }

    public static String getIdempotencyKey(String tenantId, String transactionCode) {
        return IDEMPOTENCY_PREFIX + tenantId + ":" + transactionCode;
    }

    public static String getDailyPrizeStockKey(String tenantId, Long prizeId, String date) {
        return DAILY_SPIN_STOCK_PREFIX + tenantId + ":" + prizeId + ":" + date;
    }
}
