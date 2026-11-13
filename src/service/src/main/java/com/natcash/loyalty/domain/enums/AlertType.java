package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum AlertType {
    BUDGET_80("BUDGET_80"),
    BUDGET_100("BUDGET_100"),
    WEBHOOK_DEADLETTER("WEBHOOK_DEADLETTER"),
    CLEARING_DISPUTE("CLEARING_DISPUTE"),
    SECURITY_KEY_EXPIRING("SECURITY_KEY_EXPIRING"),
    TIER_EXPIRY_WARNING("TIER_EXPIRY_WARNING");

    @JsonValue
    private final String code;

    AlertType(String code) {
        this.code = code;
    }

    @JsonCreator
    public static AlertType fromCode(String code) {
        if (code == null) return null;
        for (AlertType t : values()) {
            if (t.code.equalsIgnoreCase(code)) return t;
        }
        return null;
    }
}
