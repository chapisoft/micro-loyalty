package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum CurrencyCode {

    HTG("HTG", "enum.currency_code.htg"),
    USD("USD", "enum.currency_code.usd");

    @JsonValue
    private final String code;
    private final String messageKey;

    CurrencyCode(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static CurrencyCode fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (CurrencyCode item : values()) {
            if (item.code.equalsIgnoreCase(code.trim())) {
                return item;
            }
        }
        return null;
    }
}
