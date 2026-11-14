package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum GamePlayAction {

    PLAY("PLAY", "enum.game_play_action.play"),
    CASH_OUT("CASH_OUT", "enum.game_play_action.cash_out"),
    STEP("STEP", "enum.game_play_action.step");

    @JsonValue
    private final String code;
    private final String messageKey;

    GamePlayAction(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static GamePlayAction fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (GamePlayAction item : values()) {
            if (item.code.equalsIgnoreCase(code.trim())) {
                return item;
            }
        }
        return null;
    }
}
