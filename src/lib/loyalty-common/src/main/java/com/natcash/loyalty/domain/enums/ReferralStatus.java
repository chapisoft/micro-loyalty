package com.natcash.loyalty.domain.enums;

import com.natcash.loyalty.util.MessageUtils;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum ReferralStatus {

    PENDING("PENDING", "enum.referral_status.pending"),
    EKYC_DONE("EKYC_DONE", "enum.referral_status.ekyc_done"),
    REWARDED("REWARDED", "enum.referral_status.rewarded");

    @JsonValue
    private final String code;
    private final String messageKey;

    ReferralStatus(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static ReferralStatus fromCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        for (ReferralStatus status : values()) {
            if (status.code.equalsIgnoreCase(code.trim())) {
                return status;
            }
        }
        return null;
    }
}
