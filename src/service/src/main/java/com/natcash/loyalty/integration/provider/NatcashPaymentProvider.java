package com.natcash.loyalty.integration.provider;

import com.natcash.loyalty.integration.NatcashWalletClient;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.PaymentDeductResult;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.PaymentRefundResult;
import com.natcash.loyalty.integration.entity.TenantIntegrationEntity;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class NatcashPaymentProvider implements PaymentGatewayProvider {

    private static final Logger log = LoggerFactory.getLogger(NatcashPaymentProvider.class);
    private final NatcashWalletClient natcashWalletClient;

    public NatcashPaymentProvider(NatcashWalletClient natcashWalletClient) {
        this.natcashWalletClient = natcashWalletClient;
    }

    @Override
    public String getProviderCode() {
        return "NATCASH";
    }

    @Override
    public PaymentDeductResult processDeduct(
            TenantIntegrationEntity config,
            String userId,
            BigDecimal amount,
            String transactionRef) {
        log.info("[PROVIDER-NATCASH-DEDUCT] tenant={}, user={}, amount={}, txRef={}",
                config.getTenantId(), userId, amount, transactionRef);

        boolean ok = natcashWalletClient.verifyAndDeductWalletBalance(userId, amount, transactionRef);

        return PaymentDeductResult.builder()
                .success(ok)
                .transactionRef(transactionRef)
                .deductedAmount(amount)
                .externalCode("NC_200")
                .message(ok ? "Khấu trừ ví Natcash thành công" : "Khấu trừ ví Natcash thất bại")
                .build();
    }

    @Override
    public PaymentRefundResult processRefund(
            TenantIntegrationEntity config,
            String originalTxRef,
            BigDecimal refundAmount) {
        log.info("[PROVIDER-NATCASH-REFUND] tenant={}, origTx={}, amount={}",
                config.getTenantId(), originalTxRef, refundAmount);

        return PaymentRefundResult.builder()
                .success(true)
                .refundTransactionRef("REF_" + originalTxRef)
                .refundedAmount(refundAmount)
                .message("Hoàn tiền ví Natcash thành công")
                .build();
    }
}
