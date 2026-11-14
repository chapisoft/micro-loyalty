package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum BucketStatus {
    ACTIVE("ACTIVE"),
    DEPLETED("DEPLETED"),
    EXPIRED("EXPIRED");

    @JsonValue
    private final String code;

    BucketStatus(String code) {
        this.code = code;
    }

    @JsonCreator
    public static BucketStatus fromCode(String code) {
        if (code == null) return null;
        for (BucketStatus s : values()) {
            if (s.code.equalsIgnoreCase(code)) return s;
        }
        return null;
    }
}
