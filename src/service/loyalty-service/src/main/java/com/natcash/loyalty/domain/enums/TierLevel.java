package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum TierLevel {

    SILVER("SILVER", 1, "enum.tier_level.silver"),
    GOLD("GOLD", 2, "enum.tier_level.gold"),
    PLATINUM("PLATINUM", 3, "enum.tier_level.platinum"),
    DIAMOND("DIAMOND", 4, "enum.tier_level.diamond");

    @JsonValue
    private final String code;
    private final int level;
    private final String messageKey;

    TierLevel(String code, int level, String messageKey) {
        this.code = code;
        this.level = level;
        this.messageKey = messageKey;
    }

    public String getDisplayName() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static TierLevel fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (TierLevel tier : values()) {
            if (tier.code.equalsIgnoreCase(code)) {
                return tier;
            }
        }
        return null;
    }
}
