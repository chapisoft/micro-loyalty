package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum HoldStatus {

    HELD("HELD", "enum.hold_status.held"),
    CAPTURED("CAPTURED", "enum.hold_status.captured"),
    CANCELLED("CANCELLED", "enum.hold_status.cancelled"),
    EXPIRED("EXPIRED", "enum.hold_status.expired");

    @JsonValue
    private final String code;
    private final String messageKey;

    HoldStatus(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static HoldStatus fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (HoldStatus status : values()) {
            if (status.code.equalsIgnoreCase(code)) {
                return status;
            }
        }
        return null;
    }
}
