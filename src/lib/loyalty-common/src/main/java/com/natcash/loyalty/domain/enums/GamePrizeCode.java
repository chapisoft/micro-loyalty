package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum GamePrizeCode {

    PENALTY_GOAL("PENALTY_GOAL", "enum.game_prize_code.penalty_goal"),
    PENALTY_SAVED("PENALTY_SAVED", "enum.game_prize_code.penalty_saved"),
    DICE_TRIPLE("DICE_TRIPLE", "enum.game_prize_code.dice_triple"),
    DICE_STRAIGHT("DICE_STRAIGHT", "enum.game_prize_code.dice_straight"),
    DICE_PAIR("DICE_PAIR", "enum.game_prize_code.dice_pair"),
    GOLD("GOLD", "enum.game_prize_code.gold"),
    SILVER("SILVER", "enum.game_prize_code.silver"),
    BRONZE("BRONZE", "enum.game_prize_code.bronze"),
    TRAP("TRAP", "enum.game_prize_code.trap"),
    CHICK("CHICK", "enum.game_prize_code.chick");

    @JsonValue
    private final String code;
    private final String messageKey;

    GamePrizeCode(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static GamePrizeCode fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (GamePrizeCode item : values()) {
            if (item.code.equalsIgnoreCase(code.trim())) {
                return item;
            }
        }
        return null;
    }
}
