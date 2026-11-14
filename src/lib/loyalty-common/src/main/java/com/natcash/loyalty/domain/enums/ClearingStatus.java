package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum ClearingStatus {

    PENDING("PENDING", "enum.clearing_status.pending"),
    APPROVED("APPROVED", "enum.clearing_status.approved"),
    SETTLED("SETTLED", "enum.clearing_status.settled"),
    DISPUTED("DISPUTED", "enum.clearing_status.disputed"),
    CANCELLED("CANCELLED", "enum.clearing_status.cancelled"),
    REFUNDED("REFUNDED", "enum.clearing_status.refunded");

    @JsonValue
    private final String code;
    private final String messageKey;

    ClearingStatus(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static ClearingStatus fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (ClearingStatus status : values()) {
            if (status.code.equalsIgnoreCase(code)) {
                return status;
            }
        }
        return null;
    }
}
