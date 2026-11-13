package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum NotificationChannel {

    PUSH_NOTIFICATION("PUSH_NOTIFICATION", "enum.notification_channel.push"),
    SMS("SMS", "enum.notification_channel.sms"),
    IN_APP("IN_APP", "enum.notification_channel.in_app"),
    EMAIL("EMAIL", "enum.notification_channel.email"),
    USSD("USSD", "enum.notification_channel.ussd");

    @JsonValue
    private final String code;
    private final String messageKey;

    NotificationChannel(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static NotificationChannel fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (NotificationChannel value : values()) {
            if (value.code.equalsIgnoreCase(code)) {
                return value;
            }
        }
        return null;
    }
}
