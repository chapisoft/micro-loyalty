package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum WheelThemeCode {

    THEME_DEFAULT("THEME_DEFAULT", "enum.wheel_theme.default"),
    THEME_KANAVAL("THEME_KANAVAL", "enum.wheel_theme.kanaval"),
    THEME_CARIBBEAN("THEME_CARIBBEAN", "enum.wheel_theme.caribbean"),
    THEME_HOLIDAY("THEME_HOLIDAY", "enum.wheel_theme.holiday");

    @JsonValue
    private final String code;
    private final String messageKey;

    WheelThemeCode(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static WheelThemeCode fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (WheelThemeCode item : values()) {
            if (item.code.equalsIgnoreCase(code)) {
                return item;
            }
        }
        return null;
    }
}
