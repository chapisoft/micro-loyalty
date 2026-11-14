package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum AlertSeverity {
    INFO("INFO"),
    WARNING("WARNING"),
    CRITICAL("CRITICAL");

    @JsonValue
    private final String code;

    AlertSeverity(String code) {
        this.code = code;
    }

    @JsonCreator
    public static AlertSeverity fromCode(String code) {
        if (code == null) return null;
        for (AlertSeverity s : values()) {
            if (s.code.equalsIgnoreCase(code)) return s;
        }
        return null;
    }
}
