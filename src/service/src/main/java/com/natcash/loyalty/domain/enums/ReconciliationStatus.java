package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum ReconciliationStatus {

    UNMATCHED("UNMATCHED", "enum.reconciliation_status.unmatched"),
    MATCHED("MATCHED", "enum.reconciliation_status.matched"),
    DISPUTED("DISPUTED", "enum.reconciliation_status.disputed"),
    SETTLED("SETTLED", "enum.reconciliation_status.settled");

    @JsonValue
    private final String code;
    private final String messageKey;

    ReconciliationStatus(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static ReconciliationStatus fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (ReconciliationStatus status : values()) {
            if (status.code.equalsIgnoreCase(code)) {
                return status;
            }
        }
        return null;
    }
}
