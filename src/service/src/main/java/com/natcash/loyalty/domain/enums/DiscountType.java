package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum DiscountType {

    FIXED_AMOUNT("FIXED_AMOUNT", "enum.discount_type.fixed_amount"),
    PERCENTAGE("PERCENTAGE", "enum.discount_type.percentage"),
    FREE_ITEM("FREE_ITEM", "enum.discount_type.free_item");

    @JsonValue
    private final String code;
    private final String messageKey;

    DiscountType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static DiscountType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (DiscountType type : values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        return null;
    }
}
