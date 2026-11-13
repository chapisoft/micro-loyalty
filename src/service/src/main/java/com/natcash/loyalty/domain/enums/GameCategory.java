package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum GameCategory {

    ENTERTAINMENT("ENTERTAINMENT", "enum.game_category.entertainment"),
    PUZZLE_BRAIN("PUZZLE_BRAIN", "enum.game_category.puzzle_brain"),
    LEARNING_EDTECH("LEARNING_EDTECH", "enum.game_category.learning_edtech");

    @JsonValue
    private final String code;
    private final String messageKey;

    GameCategory(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static GameCategory fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (GameCategory item : values()) {
            if (item.code.equalsIgnoreCase(code)) {
                return item;
            }
        }
        return null;
    }
}
