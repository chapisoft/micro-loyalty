package com.natcash.loyalty.exception;

import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.util.MessageUtils;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(LoyaltyException.class)
    public ResponseEntity<Map<String, Object>> handleLoyaltyException(LoyaltyException ex) {
        ErrorCode errorCode = ex.getErrorCode() != null ? ex.getErrorCode() : ErrorCode.SYSTEM_ERROR;
        String localizedMessage = ex.getMessage() != null && !ex.getMessage().equals(errorCode.getMessageKey())
                ? ex.getMessage()
                : MessageUtils.getMessage(errorCode.getMessageKey());

        Map<String, Object> body = new HashMap<>();
        body.put("code", errorCode.getCode());
        body.put("message", localizedMessage);
        body.put("timestamp", Instant.now());

        HttpStatus status = switch (errorCode) {
            case ACCOUNT_NOT_FOUND, VOUCHER_NOT_FOUND -> HttpStatus.NOT_FOUND;
            case TENANT_INVALID, API_KEY_INVALID, SIGNATURE_INVALID, TIMESTAMP_DRIFT_EXCEEDED, PARTNER_UNAUTHORIZED -> HttpStatus.UNAUTHORIZED;
            case CONCURRENT_LOCK_BUSY -> HttpStatus.TOO_MANY_REQUESTS;
            case TRANSACTION_DUPLICATE -> HttpStatus.CONFLICT;
            case INSUFFICIENT_POINTS, VOUCHER_OUT_OF_STOCK, POLICY_VIOLATION, GAME_OUT_OF_TURNS -> HttpStatus.BAD_REQUEST;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };

        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("code", ErrorCode.POLICY_VIOLATION.getCode());
        String defaultMsg = ex.getBindingResult().getAllErrors().isEmpty()
                ? "Dữ liệu yêu cầu không hợp lệ"
                : ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        body.put("message", defaultMsg);
        body.put("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("code", ErrorCode.SYSTEM_ERROR.getCode());
        body.put("message", MessageUtils.getMessage(ErrorCode.SYSTEM_ERROR.getMessageKey()));
        body.put("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
