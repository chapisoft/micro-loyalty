package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum AgentRoleType {

    AGENT("AGENT", "enum.agent_role_type.agent"),
    SUPER_AGENT("SUPER_AGENT", "enum.agent_role_type.super_agent");

    @JsonValue
    private final String code;
    private final String messageKey;

    AgentRoleType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static AgentRoleType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (AgentRoleType item : values()) {
            if (item.code.equalsIgnoreCase(code)) {
                return item;
            }
        }
        return null;
    }
}
