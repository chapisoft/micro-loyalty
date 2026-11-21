package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum ClearingSourceType {

    VOUCHER("VOUCHER", "enum.clearing_source_type.voucher"),
    LOYALTY_COIN("LOYALTY_COIN", "enum.clearing_source_type.loyalty_coin");

    @JsonValue
    private final String code;
    private final String messageKey;

    ClearingSourceType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static ClearingSourceType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (ClearingSourceType value : values()) {
            if (value.code.equalsIgnoreCase(code)) {
                return value;
            }
        }
        return null;
    }
}
