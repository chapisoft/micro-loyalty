package com.natcash.loyalty.constant;

/**
 * Chứa các hằng số giao thức, tiêu đề HTTP, định danh kỹ thuật và hằng số toán học bất biến.
 * Toàn bộ các thiết lập có thể cấu hình được quản lý tập trung tại {@link com.natcash.loyalty.config.LoyaltyProperties} (nạp từ etc/application.yml).
 */
public final class LoyaltyConstants {

    private LoyaltyConstants() {
        // Chặn khởi tạo class hằng số
    }

    public static final String TENANT_HEADER = "X-Tenant-Id";
    public static final String API_KEY_HEADER = "X-Api-Key";
    public static final String SIGNATURE_HEADER = "X-Signature";
    public static final String TIMESTAMP_HEADER = "X-Timestamp";
    public static final String USER_ID_HEADER = "X-User-Id";
    public static final String PARTNER_ID_HEADER = "X-Partner-Id";
    public static final String BRANCH_ID_HEADER = "X-Branch-Id";

    public static final String HIBERNATE_TENANT_FILTER = "tenantFilter";
    public static final String HIBERNATE_TENANT_PARAM = "tenantId";

    public static final String FILTER_ALL = "ALL";
    public static final String STREAM_EVENT_LOYALTY_EARN = "LOYALTY_EARN_EVENT";
}
