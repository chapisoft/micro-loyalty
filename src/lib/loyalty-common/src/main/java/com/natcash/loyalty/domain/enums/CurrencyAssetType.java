package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum CurrencyAssetType {

    TIER_POINT("TIER_POINT", "enum.currency_asset_type.tier_point"),
    LOYALTY_COIN("LOYALTY_COIN", "enum.currency_asset_type.loyalty_coin");

    @JsonValue
    private final String code;
    private final String messageKey;

    CurrencyAssetType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static CurrencyAssetType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (CurrencyAssetType item : values()) {
            if (item.code.equalsIgnoreCase(code)) {
                return item;
            }
        }
        return null;
    }
}
