package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum GameCode {

    LUCKY_WHEEL("LUCKY_WHEEL", "enum.game_code.lucky_wheel"),
    SCRATCH_CARD("SCRATCH_CARD", "enum.game_code.scratch_card"),
    PENALTY_SHOOTOUT("PENALTY_SHOOTOUT", "enum.game_code.penalty_shootout"),
    TREASURE_CHEST("TREASURE_CHEST", "enum.game_code.treasure_chest"),
    TOWER_CLIMB("TOWER_CLIMB", "enum.game_code.tower_climb"),
    PLINKO_DROP("PLINKO_DROP", "enum.game_code.plinko_drop"),
    GOLDEN_EGG("GOLDEN_EGG", "enum.game_code.golden_egg"),
    LUCKY_DICE("LUCKY_DICE", "enum.game_code.lucky_dice"),
    TOPUP_CHALLENGE("TOPUP_CHALLENGE", "enum.game_code.topup_challenge"),
    TRIVIA_QUIZ("TRIVIA_QUIZ", "enum.game_code.trivia_quiz");

    @JsonValue
    private final String code;
    private final String messageKey;

    GameCode(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static GameCode fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (GameCode item : values()) {
            if (item.code.equalsIgnoreCase(code)) {
                return item;
            }
        }
        return null;
    }
}
