package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum PrizeType {

    POINTS("POINTS", "enum.prize_type.points"),
    VOUCHER("VOUCHER", "enum.prize_type.voucher"),
    CASHBACK("CASHBACK", "enum.prize_type.cashback"),
    PHYSICAL_GIFT("PHYSICAL_GIFT", "enum.prize_type.physical_gift"),
    NO_LUCK("NO_LUCK", "enum.prize_type.no_luck"),
    TURNS("TURNS", "enum.prize_type.turns"),
    MULTIPLIER("MULTIPLIER", "enum.prize_type.multiplier");

    @JsonValue
    private final String code;
    private final String messageKey;

    PrizeType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static PrizeType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (PrizeType type : values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        return null;
    }
}
