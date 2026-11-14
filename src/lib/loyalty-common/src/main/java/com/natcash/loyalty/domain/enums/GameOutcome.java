package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum GameOutcome {

    WIN("WIN", "enum.game_outcome.win"),
    LOSE("LOSE", "enum.game_outcome.lose"),
    SAVED("SAVED", "enum.game_outcome.saved"),
    POST("POST", "enum.game_outcome.post"),
    CASH_OUT("CASH_OUT", "enum.game_outcome.cash_out"),
    CRASH("CRASH", "enum.game_outcome.crash"),
    CONTINUE("CONTINUE", "enum.game_outcome.continue");

    @JsonValue
    private final String code;
    private final String messageKey;

    GameOutcome(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static GameOutcome fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (GameOutcome item : values()) {
            if (item.code.equalsIgnoreCase(code.trim())) {
                return item;
            }
        }
        return null;
    }
}
