package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum PaymentMethod {

    POINTS("POINTS", "enum.payment_method.points"),
    WALLET("WALLET", "enum.payment_method.wallet"),
    CASHBACK("CASHBACK", "enum.payment_method.cashback");

    @JsonValue
    private final String code;
    private final String messageKey;

    PaymentMethod(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static PaymentMethod fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (PaymentMethod method : values()) {
            if (method.code.equalsIgnoreCase(code)) {
                return method;
            }
        }
        return null;
    }
}
