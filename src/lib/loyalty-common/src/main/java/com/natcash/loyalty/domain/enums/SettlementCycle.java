package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum SettlementCycle {

    DAILY("DAILY", "enum.settlement_cycle.daily"),
    WEEKLY("WEEKLY", "enum.settlement_cycle.weekly"),
    MONTHLY("MONTHLY", "enum.settlement_cycle.monthly");

    @JsonValue
    private final String code;
    private final String messageKey;

    SettlementCycle(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static SettlementCycle fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (SettlementCycle cycle : values()) {
            if (cycle.code.equalsIgnoreCase(code)) {
                return cycle;
            }
        }
        return null;
    }
}
