package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum CustomerSegmentCode {

    NEW_CUSTOMER("NEW_CUSTOMER", "enum.customer_segment_code.new_customer"),
    LOW_ACTIVITY("LOW_ACTIVITY", "enum.customer_segment_code.low_activity"),
    HIGH_VALUE("HIGH_VALUE", "enum.customer_segment_code.high_value"),
    SINGLE_SERVICE("SINGLE_SERVICE", "enum.customer_segment_code.single_service"),
    WIN_BACK("WIN_BACK", "enum.customer_segment_code.win_back"),
    PARTNER_SHOPPER("PARTNER_SHOPPER", "enum.customer_segment_code.partner_shopper"),
    GENERAL("GENERAL", "enum.customer_segment_code.general");

    @JsonValue
    private final String code;
    private final String messageKey;

    CustomerSegmentCode(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static CustomerSegmentCode fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (CustomerSegmentCode item : values()) {
            if (item.code.equalsIgnoreCase(code)) {
                return item;
            }
        }
        return null;
    }
}
