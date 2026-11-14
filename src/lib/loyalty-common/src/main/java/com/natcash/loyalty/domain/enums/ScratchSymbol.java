package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum ScratchSymbol {

    GOLD_CHEST("GOLD_CHEST", "enum.scratch_symbol.gold_chest"),
    SILVER_COIN("SILVER_COIN", "enum.scratch_symbol.silver_coin"),
    BRONZE_STAR("BRONZE_STAR", "enum.scratch_symbol.bronze_star"),
    DIAMOND("DIAMOND", "enum.scratch_symbol.diamond"),
    CROWN("CROWN", "enum.scratch_symbol.crown"),
    RUBY("RUBY", "enum.scratch_symbol.ruby"),
    TREASURE("TREASURE", "enum.scratch_symbol.treasure"),
    COIN_BAG("COIN_BAG", "enum.scratch_symbol.coin_bag");

    @JsonValue
    private final String code;
    private final String messageKey;

    ScratchSymbol(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static ScratchSymbol fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (ScratchSymbol item : values()) {
            if (item.code.equalsIgnoreCase(code.trim())) {
                return item;
            }
        }
        return null;
    }
}
