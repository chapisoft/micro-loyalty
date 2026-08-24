package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum CampaignMetric {

    BILL_AMOUNT("BILL_AMOUNT", "enum.campaign_metric.bill_amount"),
    TRANSACTION_COUNT("TRANSACTION_COUNT", "enum.campaign_metric.transaction_count"),
    EARN_POINTS("EARN_POINTS", "enum.campaign_metric.earn_points"),
    GAME_SPINS("GAME_SPINS", "enum.campaign_metric.game_spins");

    @JsonValue
    private final String code;
    private final String messageKey;

    CampaignMetric(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static CampaignMetric fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (CampaignMetric metric : values()) {
            if (metric.code.equalsIgnoreCase(code)) {
                return metric;
            }
        }
        return null;
    }
}
