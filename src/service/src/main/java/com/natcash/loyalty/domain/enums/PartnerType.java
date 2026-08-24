package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum PartnerType {

    RETAIL("RETAIL", "enum.partner_type.retail"),
    TELECOM("TELECOM", "enum.partner_type.telecom"),
    BANKING("BANKING", "enum.partner_type.banking"),
    F_AND_B("F_AND_B", "enum.partner_type.f_and_b"),
    FUEL("FUEL", "enum.partner_type.fuel");

    @JsonValue
    private final String code;
    private final String messageKey;

    PartnerType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static PartnerType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (PartnerType type : values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        return null;
    }
}
