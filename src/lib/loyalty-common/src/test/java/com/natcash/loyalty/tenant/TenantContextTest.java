package com.natcash.loyalty.tenant;

import com.natcash.loyalty.config.LoyaltyProperties;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DisplayName("Kiểm thử đơn vị: Cô lập mã thuê bao đa đối tác (TenantContext)")
class TenantContextTest {

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Trả về mã thuê bao mặc định khi chưa thiết lập")
    void testGetTenantId_Default() {
        assertEquals(LoyaltyProperties.get().getTenant().getDefaultTenant(), TenantContext.getTenantId());
    }

    @Test
    @DisplayName("Thiết lập và trích xuất đúng mã thuê bao tùy chỉnh")
    void testSetAndGetTenantId_Custom() {
        TenantContext.setTenantId("DELIMART");
        assertEquals("DELIMART", TenantContext.getTenantId());
    }

    @Test
    @DisplayName("Tự động chuyển mã thuê bao sang chữ in hoa và loại bỏ khoảng trắng thừa")
    void testSetTenantId_TrimAndUpperCase() {
        TenantContext.setTenantId("  telecom_hub  ");
        assertEquals("TELECOM_HUB", TenantContext.getTenantId());
    }

    @Test
    @DisplayName("Xóa sạch ThreadLocal sau khi kết thúc request")
    void testClear() {
        TenantContext.setTenantId("TEST_TENANT");
        TenantContext.clear();
        assertEquals(LoyaltyProperties.get().getTenant().getDefaultTenant(), TenantContext.getTenantId());
    }
}
