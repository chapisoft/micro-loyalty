package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum ApiKeyStatus {
    ACTIVE("ACTIVE"),
    GRACE_PERIOD("GRACE_PERIOD"),
    REVOKED("REVOKED");

    @JsonValue
    private final String code;

    ApiKeyStatus(String code) {
        this.code = code;
    }

    @JsonCreator
    public static ApiKeyStatus fromCode(String code) {
        if (code == null) return null;
        for (ApiKeyStatus s : values()) {
            if (s.code.equalsIgnoreCase(code)) return s;
        }
        return null;
    }
}
