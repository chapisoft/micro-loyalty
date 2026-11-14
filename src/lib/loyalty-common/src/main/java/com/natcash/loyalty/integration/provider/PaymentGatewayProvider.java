package com.natcash.loyalty.integration.provider;

import com.natcash.loyalty.integration.dto.TenantIntegrationDto.PaymentDeductResult;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.PaymentRefundResult;
import com.natcash.loyalty.integration.entity.TenantIntegrationEntity;

import java.math.BigDecimal;

/**
 * Giao diện chung cho các Nhà cung cấp Cổng Thanh toán / Core Ngân hàng / Ví
 */
public interface PaymentGatewayProvider {

    /**
     * Mã định danh nhà cung cấp (Ví dụ: NATCASH, VIETCOMBANK, NAPAS_QR, GENERIC_REST)
     */
    String getProviderCode();

    /**
     * Thực thi trừ tiền tài khoản người dùng tại Core Ví / Ngân hàng của bên thuê
     */
    PaymentDeductResult processDeduct(
            TenantIntegrationEntity config,
            String userId,
            BigDecimal amount,
            String transactionRef
    );

    /**
     * Thực thi hoàn tiền về tài khoản người dùng
     */
    PaymentRefundResult processRefund(
            TenantIntegrationEntity config,
            String originalTxRef,
            BigDecimal refundAmount
    );
}
