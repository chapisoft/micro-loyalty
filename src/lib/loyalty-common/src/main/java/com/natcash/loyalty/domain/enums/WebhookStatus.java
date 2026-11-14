package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum WebhookStatus {

    PENDING("PENDING", "enum.webhook_status.pending"),
    PROCESSING("PROCESSING", "enum.webhook_status.processing"),
    PROCESSED("PROCESSED", "enum.webhook_status.processed"),
    FAILED("FAILED", "enum.webhook_status.failed");

    @JsonValue
    private final String code;
    private final String messageKey;

    WebhookStatus(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static WebhookStatus fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (WebhookStatus status : values()) {
            if (status.code.equalsIgnoreCase(code)) {
                return status;
            }
        }
        return null;
    }
}
