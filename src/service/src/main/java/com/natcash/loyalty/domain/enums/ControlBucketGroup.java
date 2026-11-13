package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum ControlBucketGroup {
    TEST("TEST"),
    CONTROL("CONTROL");

    @JsonValue
    private final String code;

    ControlBucketGroup(String code) {
        this.code = code;
    }

    @JsonCreator
    public static ControlBucketGroup fromCode(String code) {
        if (code == null) return null;
        for (ControlBucketGroup g : values()) {
            if (g.code.equalsIgnoreCase(code)) return g;
        }
        return null;
    }
}
