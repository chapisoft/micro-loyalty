package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum CampaignMissionCategory {

    FIRST_TX("FIRST_TX", "enum.campaign_mission_category.first_tx"),
    SPEND_TIERED("SPEND_TIERED", "enum.campaign_mission_category.spend_tiered"),
    TX_COUNT("TX_COUNT", "enum.campaign_mission_category.tx_count"),
    STREAK("STREAK", "enum.campaign_mission_category.streak"),
    CHECKIN_7D("CHECKIN_7D", "enum.campaign_mission_category.checkin_7d"),
    WIN_BACK("WIN_BACK", "enum.campaign_mission_category.win_back"),
    PARTNER_PURCHASE("PARTNER_PURCHASE", "enum.campaign_mission_category.partner_purchase"),
    CROSS_SELL("CROSS_SELL", "enum.campaign_mission_category.cross_sell"),
    REFERRAL("REFERRAL", "enum.campaign_mission_category.referral");

    @JsonValue
    private final String code;
    private final String messageKey;

    CampaignMissionCategory(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static CampaignMissionCategory fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (CampaignMissionCategory item : values()) {
            if (item.code.equalsIgnoreCase(code)) {
                return item;
            }
        }
        return null;
    }
}
