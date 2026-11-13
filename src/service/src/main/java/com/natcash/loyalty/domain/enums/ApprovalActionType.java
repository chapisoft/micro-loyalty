package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum ApprovalActionType {

    CREATE("CREATE", "enum.approval_action.create"),
    UPDATE("UPDATE", "enum.approval_action.update"),
    DELETE("DELETE", "enum.approval_action.delete"),
    ADJUST("ADJUST", "enum.approval_action.adjust"),
    LOCK("LOCK", "enum.approval_action.lock"),
    UNLOCK("UNLOCK", "enum.approval_action.unlock");

    @JsonValue
    private final String code;
    private final String messageKey;

    ApprovalActionType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static ApprovalActionType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (ApprovalActionType value : values()) {
            if (value.code.equalsIgnoreCase(code)) {
                return value;
            }
        }
        return null;
    }
}
