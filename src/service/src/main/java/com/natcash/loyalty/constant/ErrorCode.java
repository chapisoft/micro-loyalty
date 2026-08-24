package com.natcash.loyalty.constant;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum ErrorCode {

    SUCCESS("00", "error.success"),
    TENANT_INVALID("01", "error.tenant_invalid"),
    API_KEY_INVALID("02", "error.api_key_invalid"),
    SIGNATURE_INVALID("03", "error.signature_invalid"),
    TIMESTAMP_DRIFT_EXCEEDED("04", "error.timestamp_drift_exceeded"),
    ACCOUNT_NOT_FOUND("05", "error.account_not_found"),
    INSUFFICIENT_POINTS("06", "error.insufficient_points"),
    VOUCHER_NOT_FOUND("07", "error.voucher_not_found"),
    VOUCHER_OUT_OF_STOCK("08", "error.voucher_out_of_stock"),
    TRANSACTION_DUPLICATE("09", "error.transaction_duplicate"),
    CONCURRENT_LOCK_BUSY("10", "error.concurrent_lock_busy"),
    PARTNER_UNAUTHORIZED("11", "error.partner_unauthorized"),
    POLICY_VIOLATION("12", "error.policy_violation"),
    GAME_OUT_OF_TURNS("13", "error.game_out_of_turns"),
    UNAUTHORIZED("14", "error.unauthorized"),
    SYSTEM_ERROR("99", "error.system_error");

    @JsonValue
    private final String code;
    private final String messageKey;

    ErrorCode(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getMessage() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static ErrorCode fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (ErrorCode err : values()) {
            if (err.code.equalsIgnoreCase(code) || err.name().equalsIgnoreCase(code)) {
                return err;
            }
        }
        return null;
    }
}
