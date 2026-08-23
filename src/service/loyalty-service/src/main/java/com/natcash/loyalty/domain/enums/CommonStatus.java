package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum CommonStatus {

    ACTIVE("ACTIVE", "enum.common_status.active"),
    INACTIVE("INACTIVE", "enum.common_status.inactive"),
    LOCKED("LOCKED", "enum.common_status.locked"),
    DELETED("DELETED", "enum.common_status.deleted");

    @JsonValue
    private final String code;
    private final String messageKey;

    CommonStatus(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static CommonStatus fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (CommonStatus status : values()) {
            if (status.code.equalsIgnoreCase(code)) {
                return status;
            }
        }
        return null;
    }
}
