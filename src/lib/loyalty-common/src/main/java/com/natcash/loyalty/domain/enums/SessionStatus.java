package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum SessionStatus {

    INITIATED("INITIATED", "enum.session_status.initiated"),
    ACTIVE("ACTIVE", "enum.session_status.active"),
    COMPLETED("COMPLETED", "enum.session_status.completed"),
    EXPIRED("EXPIRED", "enum.session_status.expired");

    @JsonValue
    private final String code;
    private final String messageKey;

    SessionStatus(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static SessionStatus fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (SessionStatus status : values()) {
            if (status.code.equalsIgnoreCase(code)) {
                return status;
            }
        }
        return null;
    }
}
