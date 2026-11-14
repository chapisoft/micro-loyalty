package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum SponsorType {
    NATCASH("NATCASH"),
    PARTNER_CO_FUND("PARTNER_CO_FUND"),
    PARTNER_SELF("PARTNER_SELF"),
    GAMEHUB("GAMEHUB");

    @JsonValue
    private final String code;

    SponsorType(String code) {
        this.code = code;
    }

    @JsonCreator
    public static SponsorType fromCode(String code) {
        if (code == null) return null;
        for (SponsorType s : values()) {
            if (s.code.equalsIgnoreCase(code)) return s;
        }
        return null;
    }
}
