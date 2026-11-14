package com.natcash.loyalty.domain.enums;

import com.natcash.loyalty.util.MessageUtils;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum IntegrationAuthType {

    NONE("NONE", "enum.integration_auth_type.none"),
    API_KEY("API_KEY", "enum.integration_auth_type.api_key"),
    BEARER_TOKEN("BEARER_TOKEN", "enum.integration_auth_type.bearer_token"),
    BASIC_AUTH("BASIC_AUTH", "enum.integration_auth_type.basic_auth"),
    HMAC_SHA256("HMAC_SHA256", "enum.integration_auth_type.hmac_sha256");

    @JsonValue
    private final String code;
    private final String messageKey;

    IntegrationAuthType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static IntegrationAuthType fromCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        String normalized = code.trim().toUpperCase();
        if ("BEARER".equals(normalized)) {
            return BEARER_TOKEN;
        }
        if ("BASIC".equals(normalized)) {
            return BASIC_AUTH;
        }
        for (IntegrationAuthType type : values()) {
            if (type.code.equalsIgnoreCase(normalized)) {
                return type;
            }
        }
        return null;
    }
}
