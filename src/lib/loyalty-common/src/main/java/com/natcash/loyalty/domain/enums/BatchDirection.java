package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum BatchDirection {

    SPONSOR_REPLENISH("SPONSOR_REPLENISH", "enum.batch_direction.sponsor_replenish"),
    MERCHANT_SETTLEMENT("MERCHANT_SETTLEMENT", "enum.batch_direction.merchant_settlement"),
    NET_OFFSET("NET_OFFSET", "enum.batch_direction.net_offset");

    @JsonValue
    private final String code;
    private final String messageKey;

    BatchDirection(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static BatchDirection fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (BatchDirection value : values()) {
            if (value.code.equalsIgnoreCase(code)) {
                return value;
            }
        }
        return null;
    }
}
