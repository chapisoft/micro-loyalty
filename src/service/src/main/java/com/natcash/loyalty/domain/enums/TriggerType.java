package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum TriggerType {

    TIER_UPGRADE_NUDGE("TIER_UPGRADE_NUDGE", "enum.trigger_type.tier_upgrade_nudge"),
    POINT_EXPIRATION_ALERT("POINT_EXPIRATION_ALERT", "enum.trigger_type.point_expiration_alert"),
    BIRTHDAY_GREETING("BIRTHDAY_GREETING", "enum.trigger_type.birthday_greeting"),
    INACTIVE_REMINDER("INACTIVE_REMINDER", "enum.trigger_type.inactive_reminder");

    @JsonValue
    private final String code;
    private final String messageKey;

    TriggerType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static TriggerType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (TriggerType type : values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        return null;
    }
}
