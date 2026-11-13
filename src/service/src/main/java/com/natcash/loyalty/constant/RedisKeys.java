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

    public static final String LOCK_GAME_PREFIX = "lock:game:";
    public static final String LOCK_VOUCHER_REDEEM_PREFIX = "lock:voucher:redeem:";
    public static final String GAME_DAILY_BUDGET_PREFIX = "budget:game:";

    public static final String LOCK_BATCH_POINT_EXPIRATION = "lock:batch:point-expiration";
    public static final String LOCK_BATCH_TIER_EVALUATION = "lock:batch:tier-evaluation";
    public static final String LOCK_BATCH_CLEARING = "lock:batch:clearing-reconciliation";
    public static final String LOCK_BATCH_SEGMENT_CALC = "lock:batch:segment-calculation";

    public static final String LOCK_MISSION_CLAIM_PREFIX = "lock:mission:claim:";
    public static final String LOCK_APPROVAL_PREFIX = "lock:approval:";
    public static final String BUDGET_MONTHLY_PREFIX = "budget:monthly:";
    public static final String PUSH_CAP_DAILY_PREFIX = "engagement:push:daily:";
    public static final String PUSH_CAP_WEEKLY_PREFIX = "engagement:push:weekly:";
    public static final String ENGAGEMENT_DEDUP_PREFIX = "engagement:dedup:";
    public static final String LEADERBOARD_MONTHLY_PREFIX = "leaderboard:game:monthly:";
    public static final String PARTNER_API_KEY_GRACE_PREFIX = "partner:apikey:grace:";

    public static String getBurnLockKey(String tenantId, String userId) {
        return LOCK_BURN_POINT_PREFIX + tenantId + ":" + userId;
    }

    public static String getSpinLockKey(String tenantId, String userId, Long gameId) {
        return LOCK_SPIN_PREFIX + tenantId + ":" + gameId + ":" + userId;
    }

    public static String getGameLockKey(String tenantId, String gameCode, String userId) {
        return LOCK_GAME_PREFIX + tenantId + ":" + gameCode + ":" + userId;
    }

    public static String getVoucherRedeemLockKey(String tenantId, String userId) {
        return LOCK_VOUCHER_REDEEM_PREFIX + tenantId + ":" + userId;
    }

    public static String getIdempotencyKey(String tenantId, String transactionCode) {
        return IDEMPOTENCY_PREFIX + tenantId + ":" + transactionCode;
    }

    public static String getDailyPrizeStockKey(String tenantId, Long prizeId, String date) {
        return DAILY_SPIN_STOCK_PREFIX + tenantId + ":" + prizeId + ":" + date;
    }

    public static String getGameDailyBudgetKey(String tenantId, Long gameId, String date) {
        return GAME_DAILY_BUDGET_PREFIX + tenantId + ":" + gameId + ":" + date;
    }

    public static String getMissionClaimLockKey(String tenantId, Long missionId, String userId) {
        return LOCK_MISSION_CLAIM_PREFIX + tenantId + ":" + missionId + ":" + userId;
    }

    public static String getApprovalLockKey(String tenantId, Long requestId) {
        return LOCK_APPROVAL_PREFIX + tenantId + ":" + requestId;
    }

    public static String getMonthlyBudgetKey(String tenantId, String budgetMonth, String sponsorType) {
        return BUDGET_MONTHLY_PREFIX + tenantId + ":" + budgetMonth + ":" + sponsorType;
    }

    public static String getPushDailyKey(String tenantId, String userId, String date) {
        return PUSH_CAP_DAILY_PREFIX + tenantId + ":" + userId + ":" + date;
    }

    public static String getPushWeeklyKey(String tenantId, String userId, String weekKey) {
        return PUSH_CAP_WEEKLY_PREFIX + tenantId + ":" + userId + ":" + weekKey;
    }

    public static String getEngagementDedupKey(String tenantId, String userId, String scenarioCode) {
        return ENGAGEMENT_DEDUP_PREFIX + tenantId + ":" + userId + ":" + scenarioCode;
    }

    public static String getMonthlyLeaderboardKey(String tenantId, String yearMonth) {
        return LEADERBOARD_MONTHLY_PREFIX + tenantId + ":" + yearMonth;
    }

    public static String getPartnerApiKeyGraceKey(String tenantId, Long partnerId, Long keyId) {
        return PARTNER_API_KEY_GRACE_PREFIX + tenantId + ":" + partnerId + ":" + keyId;
    }
}
