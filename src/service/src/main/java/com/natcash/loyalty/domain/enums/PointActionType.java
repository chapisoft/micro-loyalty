package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum PointActionType {

    EARN("EARN", "enum.point_action_type.earn"),
    BURN("BURN", "enum.point_action_type.burn"),
    REFUND("REFUND", "enum.point_action_type.refund"),
    EXPIRE("EXPIRE", "enum.point_action_type.expire"),
    ADJUST("ADJUST", "enum.point_action_type.adjust"),
    CASHBACK("CASHBACK", "enum.point_action_type.cashback"),
    REWARD("REWARD", "enum.point_action_type.reward"),
    SPIN("SPIN", "enum.point_action_type.spin"),
    VOUCHER("VOUCHER", "enum.point_action_type.voucher");

    @JsonValue
    private final String code;
    private final String messageKey;

    PointActionType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static PointActionType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (PointActionType type : values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        return null;
    }
}
