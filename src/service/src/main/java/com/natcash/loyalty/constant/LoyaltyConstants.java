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

    public static final String HIBERNATE_TENANT_FILTER = "tenantFilter";
    public static final String HIBERNATE_TENANT_PARAM = "tenantId";
}
