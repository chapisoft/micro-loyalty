package com.natcash.loyalty.constant;

public final class LoyaltyConstants {

    private LoyaltyConstants() {
        // Chặn khởi tạo class hằng số
    }

    public static final String DEFAULT_TENANT_ID = "NATCASH";
    public static final String TENANT_HEADER = "X-Tenant-Id";
    public static final String API_KEY_HEADER = "X-Api-Key";
    public static final String SIGNATURE_HEADER = "X-Signature";
    public static final String TIMESTAMP_HEADER = "X-Timestamp";
    public static final String USER_ID_HEADER = "X-User-Id";

    public static final long DEFAULT_TIMESTAMP_TOLERANCE_SECONDS = 300L;
    public static final int QR_TOKEN_TTL_SECONDS = 60;
    public static final int SESSION_TICKET_TTL_SECONDS = 60;
    public static final int MAX_WEBHOOK_RETRIES = 5;

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String STATUS_LOCKED = "LOCKED";
    public static final String STATUS_SUCCESS = "SUCCESS";
    public static final String STATUS_FAILED = "FAILED";

    public static final long DEFAULT_LOCK_WAIT_TIME_MS = 3000L;
    public static final long DEFAULT_LOCK_LEASE_TIME_MS = 10000L;
    public static final long DEFAULT_SHORT_LOCK_LEASE_TIME_MS = 5000L;

    public static final String STREAM_EVENT_LOYALTY_EARN = "LOYALTY_EARN_EVENT";

    public static final String HIBERNATE_TENANT_FILTER = "tenantFilter";
    public static final String HIBERNATE_TENANT_PARAM = "tenantId";

    public static final String PARTNER_ID_HEADER = "X-Partner-Id";
    public static final String BRANCH_ID_HEADER = "X-Branch-Id";

    public static final int QUIET_HOURS_START_HOUR = 20;
    public static final int QUIET_HOURS_END_HOUR = 8;
    public static final String HAITI_TIMEZONE = "America/Port-au-Prince";
    public static final int MAX_PUSH_PER_DAY = 1;
    public static final int MAX_PUSH_PER_WEEK = 3;
    public static final int DEFAULT_DEDUP_WINDOW_HOURS = 24;

    public static final int BUDGET_ALERT_THRESHOLD_PERCENT = 80;
    public static final int BUDGET_HARD_STOP_PERCENT = 100;

    public static final int API_KEY_GRACE_PERIOD_DAYS = 7;
    public static final int DEFAULT_POINT_EXPIRATION_MONTHS = 12;
    public static final int TIER_EXPIRY_WARNING_DAYS = 30;
    public static final int SETTLEMENT_CONFIRM_DEADLINE_DAYS = 3;
    public static final int DEFAULT_CONTROL_GROUP_PERCENT = 5;

    public static final int AGENT_MONTHLY_NEW_CUSTOMER_TARGET = 100;
    public static final int AGENT_REWARD_HTG = 2000;
    public static final int SUPER_AGENT_MIN_ACHIEVEMENT_PCT = 50;
    public static final int SUPER_AGENT_REWARD_HTG = 10000;

    public static final int LEARNING_TIER1_CORRECT = 5;
    public static final int LEARNING_TIER2_CORRECT = 10;
    public static final int LEARNING_TIER3_CORRECT = 15;

    public static final String DEFAULT_MDR_FEE_PERCENT = "1.50";
    public static final String DEFAULT_POINT_ADJUSTMENT_MAX_LIMIT = "100000.00";
}
