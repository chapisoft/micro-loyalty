package com.natcash.loyalty.integration.provider;

import com.natcash.loyalty.integration.entity.TenantIntegrationEntity;

/**
 * Giao diện chung cho các Nhà cung cấp Cổng Tin nhắn SMS Brandname / Viễn thông
 */
public interface SmsGatewayProvider {

    /**
     * Mã định danh nhà cung cấp SMS (Ví dụ: NATCOM_VAS, TWILIO, VIETTEL_SMS, GENERIC_REST)
     */
    String getProviderCode();

    /**
     * Thực thi gửi tin nhắn thương hiệu tới số điện thoại khách hàng
     */
    boolean sendSms(
            TenantIntegrationEntity config,
            String phoneNumber,
            String messageContent
    );
}
