package com.natcash.loyalty.exception;

import com.natcash.loyalty.constant.ErrorCode;

import lombok.Getter;

@Getter
public class LoyaltyException extends RuntimeException {

    private final ErrorCode errorCode;

    public LoyaltyException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public LoyaltyException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
    }

    public LoyaltyException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getMessage(), cause);
        this.errorCode = errorCode;
    }
}
