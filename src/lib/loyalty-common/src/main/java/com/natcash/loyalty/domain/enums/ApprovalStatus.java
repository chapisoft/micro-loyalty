package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum ApprovalStatus {

    PENDING("PENDING", "enum.approval_status.pending"),
    APPROVED("APPROVED", "enum.approval_status.approved"),
    REJECTED("REJECTED", "enum.approval_status.rejected");

    @JsonValue
    private final String code;
    private final String messageKey;

    ApprovalStatus(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static ApprovalStatus fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (ApprovalStatus item : values()) {
            if (item.code.equalsIgnoreCase(code)) {
                return item;
            }
        }
        return null;
    }
}
