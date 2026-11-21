package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum SponsorType {
    PLATFORM("PLATFORM", "enum.sponsor_type.platform"),
    NATCASH("NATCASH", "enum.sponsor_type.natcash"),
    PARTNER("PARTNER", "enum.sponsor_type.partner"),
    CO_FUNDED("CO_FUNDED", "enum.sponsor_type.co_funded"),
    PARTNER_CO_FUND("PARTNER_CO_FUND", "enum.sponsor_type.partner_co_fund"),
    PARTNER_SELF("PARTNER_SELF", "enum.sponsor_type.partner_self"),
    GAMEHUB("GAMEHUB", "enum.sponsor_type.gamehub");

    @JsonValue
    private final String code;
    private final String messageKey;

    SponsorType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static SponsorType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (SponsorType value : values()) {
            if (value.code.equalsIgnoreCase(code)) {
                return value;
            }
        }
        return null;
    }
}
