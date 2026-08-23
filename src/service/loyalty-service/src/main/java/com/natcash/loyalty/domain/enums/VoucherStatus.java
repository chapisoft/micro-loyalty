package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum VoucherStatus {

    ACTIVE("ACTIVE", "enum.voucher_status.active"),
    USED("USED", "enum.voucher_status.used"),
    EXPIRED("EXPIRED", "enum.voucher_status.expired"),
    CANCELLED("CANCELLED", "enum.voucher_status.cancelled");

    @JsonValue
    private final String code;
    private final String messageKey;

    VoucherStatus(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static VoucherStatus fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (VoucherStatus status : values()) {
            if (status.code.equalsIgnoreCase(code)) {
                return status;
            }
        }
        return null;
    }
}
