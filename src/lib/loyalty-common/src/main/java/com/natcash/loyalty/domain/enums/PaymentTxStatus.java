package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum PaymentTxStatus {

    SUCCESS("SUCCESS", "enum.payment_tx_status.success"),
    REFUNDED("REFUNDED", "enum.payment_tx_status.refunded"),
    FAILED("FAILED", "enum.payment_tx_status.failed"),
    PENDING("PENDING", "enum.payment_tx_status.pending");

    @JsonValue
    private final String code;
    private final String messageKey;

    PaymentTxStatus(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static PaymentTxStatus fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (PaymentTxStatus status : values()) {
            if (status.code.equalsIgnoreCase(code)) {
                return status;
            }
        }
        return null;
    }
}
