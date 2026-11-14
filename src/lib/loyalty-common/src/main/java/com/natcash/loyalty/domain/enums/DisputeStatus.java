package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum DisputeStatus {

    OPEN("OPEN", "enum.dispute_status.open"),
    IN_REVIEW("IN_REVIEW", "enum.dispute_status.in_review"),
    RESOLVED("RESOLVED", "enum.dispute_status.resolved"),
    REJECTED("REJECTED", "enum.dispute_status.rejected");

    @JsonValue
    private final String code;
    private final String messageKey;

    DisputeStatus(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static DisputeStatus fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (DisputeStatus status : values()) {
            if (status.code.equalsIgnoreCase(code)) {
                return status;
            }
        }
        return null;
    }
}
