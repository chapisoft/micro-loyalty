package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum BatchSettlementStatus {
    PENDING_CONFIRM("PENDING_CONFIRM"),
    CONFIRMED("CONFIRMED"),
    DISPUTED("DISPUTED"),
    PAID("PAID");

    @JsonValue
    private final String code;

    BatchSettlementStatus(String code) {
        this.code = code;
    }

    @JsonCreator
    public static BatchSettlementStatus fromCode(String code) {
        if (code == null) return null;
        for (BatchSettlementStatus s : values()) {
            if (s.code.equalsIgnoreCase(code)) return s;
        }
        return null;
    }
}
