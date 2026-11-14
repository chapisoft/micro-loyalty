package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum GameStatus {

    ACTIVE("ACTIVE", "enum.game_status.active"),
    INACTIVE("INACTIVE", "enum.game_status.inactive"),
    MAINTENANCE("MAINTENANCE", "enum.game_status.maintenance");

    @JsonValue
    private final String code;
    private final String messageKey;

    GameStatus(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static GameStatus fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (GameStatus status : values()) {
            if (status.code.equalsIgnoreCase(code)) {
                return status;
            }
        }
        return null;
    }
}
