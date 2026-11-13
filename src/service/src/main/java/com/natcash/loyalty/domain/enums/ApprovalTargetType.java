package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum ApprovalTargetType {

    POLICY("POLICY", "enum.approval_target_type.policy"),
    PROGRAM("PROGRAM", "enum.approval_target_type.program"),
    POINT_ADJUSTMENT("POINT_ADJUSTMENT", "enum.approval_target_type.point_adjustment"),
    PAYMENT_BATCH("PAYMENT_BATCH", "enum.approval_target_type.payment_batch"),
    SYSTEM_PARAM("SYSTEM_PARAM", "enum.approval_target_type.system_param"),
    ACCOUNT_LOCK("ACCOUNT_LOCK", "enum.approval_target_type.account_lock");

    @JsonValue
    private final String code;
    private final String messageKey;

    ApprovalTargetType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static ApprovalTargetType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (ApprovalTargetType item : values()) {
            if (item.code.equalsIgnoreCase(code)) {
                return item;
            }
        }
        return null;
    }
}
