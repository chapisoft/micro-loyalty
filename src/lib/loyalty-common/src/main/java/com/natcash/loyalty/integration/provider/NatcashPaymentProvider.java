package com.natcash.loyalty.integration.provider;

import com.natcash.loyalty.integration.NatcashWalletClient;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.PaymentDeductResult;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.PaymentRefundResult;
import com.natcash.loyalty.integration.entity.TenantIntegrationEntity;
import com.natcash.loyalty.util.MessageUtils;

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
                .deductedAmount(ok ? amount : BigDecimal.ZERO)
                .externalCode(ok ? "NC_200" : "NC_FAILED")
                .message(ok ? MessageUtils.getMessage("integration.payment.natcash_success")
                        : MessageUtils.getMessage("integration.payment.natcash_failed"))
                .build();
    }

    @Override
    public PaymentRefundResult processRefund(
            TenantIntegrationEntity config,
            String originalTxRef,
            BigDecimal refundAmount) {
        log.info("[PROVIDER-NATCASH-REFUND] tenant={}, origTx={}, amount={}",
                config.getTenantId(), originalTxRef, refundAmount);

        String refundRef = "REF_" + originalTxRef;
        boolean ok = natcashWalletClient.refundWalletTransaction(originalTxRef, refundAmount, refundRef);

        return PaymentRefundResult.builder()
                .success(ok)
                .refundTransactionRef(refundRef)
                .refundedAmount(ok ? refundAmount : BigDecimal.ZERO)
                .message(ok ? MessageUtils.getMessage("integration.refund.natcash_success")
                        : MessageUtils.getMessage("integration.payment.natcash_failed"))
                .build();
    }
}
