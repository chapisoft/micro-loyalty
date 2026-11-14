package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum GameCategory {

    ENTERTAINMENT("ENTERTAINMENT", "enum.game_category.entertainment"),
    PUZZLE_BRAIN("PUZZLE_BRAIN", "enum.game_category.puzzle_brain"),
    LEARNING_EDTECH("LEARNING_EDTECH", "enum.game_category.learning_edtech"),
    INSTANT_WIN("INSTANT_WIN", "enum.game_category.instant_win"),
    LUCKY_DRAW("LUCKY_DRAW", "enum.game_category.lucky_draw"),
    QUIZ("QUIZ", "enum.game_category.quiz"),
    FARM("FARM", "enum.game_category.farm"),
    DICE("DICE", "enum.game_category.dice"),
    SPORTS_CHALLENGE("SPORTS_CHALLENGE", "enum.game_category.sports_challenge"),
    LUCKY_CHEST("LUCKY_CHEST", "enum.game_category.lucky_chest"),
    ADVENTURE_RISK("ADVENTURE_RISK", "enum.game_category.adventure_risk"),
    PHYSICS_LUCK("PHYSICS_LUCK", "enum.game_category.physics_luck"),
    SMASH_EGG("SMASH_EGG", "enum.game_category.smash_egg"),
    DICE_BOARD("DICE_BOARD", "enum.game_category.dice_board"),
    CASUAL("CASUAL", "enum.game_category.casual"),
    PUZZLE("PUZZLE", "enum.game_category.puzzle"),
    ACTION("ACTION", "enum.game_category.action");

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
