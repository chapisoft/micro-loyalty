package com.natcash.loyalty.tenant;

import com.natcash.loyalty.constant.LoyaltyConstants;

public final class TenantContext {

    private static final ThreadLocal<String> CURRENT_TENANT = new InheritableThreadLocal<>();

    private TenantContext() {
        // Chặn khởi tạo class tiện ích
    }

    public static void setTenantId(String tenantId) {
        if (tenantId != null && !tenantId.trim().isEmpty()) {
            CURRENT_TENANT.set(tenantId.trim().toUpperCase());
        } else {
            CURRENT_TENANT.set(LoyaltyConstants.DEFAULT_TENANT_ID);
        }
    }

    public static String getTenantId() {
        String tenant = CURRENT_TENANT.get();
        return tenant != null ? tenant : LoyaltyConstants.DEFAULT_TENANT_ID;
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
