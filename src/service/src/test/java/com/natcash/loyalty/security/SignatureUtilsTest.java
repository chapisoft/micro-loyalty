package com.natcash.loyalty.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("Kiểm thử đơn vị: Tiện ích ký số HMAC-SHA256")
class SignatureUtilsTest {

    private static final String SECRET_KEY = "test-secret-key-12345";
    private static final String SAMPLE_DATA = "POST\n/loyalty/v1/partners/reward-wallet/inquiry\n1724400000\n{\"userId\":\"USR001\"}";

    @Test
    @DisplayName("Tính toán chữ ký HMAC-SHA256 thành công và không null")
    void testCalculateHmacSha256_Success() {
        String signature = SignatureUtils.calculateHmacSha256(SAMPLE_DATA, SECRET_KEY);
        assertNotNull(signature);
        assertFalse(signature.isEmpty());
    }

    @Test
    @DisplayName("Xác thực chữ ký số hợp lệ chính xác")
    void testVerifySignature_Valid() {
        String signature = SignatureUtils.calculateHmacSha256(SAMPLE_DATA, SECRET_KEY);
        boolean isValid = SignatureUtils.verifySignature(SAMPLE_DATA, signature, SECRET_KEY);
        assertTrue(isValid);
    }

    @Test
    @DisplayName("Từ chối khi dữ liệu payload bị giả mạo")
    void testVerifySignature_TamperedData() {
        String signature = SignatureUtils.calculateHmacSha256(SAMPLE_DATA, SECRET_KEY);
        String tamperedData = SAMPLE_DATA + "_TAMPERED";
        boolean isValid = SignatureUtils.verifySignature(tamperedData, signature, SECRET_KEY);
        assertFalse(isValid);
    }

    @Test
    @DisplayName("Từ chối khi Secret Key không khớp")
    void testVerifySignature_WrongSecretKey() {
        String signature = SignatureUtils.calculateHmacSha256(SAMPLE_DATA, SECRET_KEY);
        boolean isValid = SignatureUtils.verifySignature(SAMPLE_DATA, signature, "wrong-secret-key");
        assertFalse(isValid);
    }

    @Test
    @DisplayName("Kiểm tra thời gian hợp lệ trong phạm vi dung sai (+-300s)")
    void testIsTimestampValid_WithinTolerance() {
        long currentTimestamp = Instant.now().getEpochSecond();
        assertTrue(SignatureUtils.isTimestampValid(currentTimestamp, 300));
        assertTrue(SignatureUtils.isTimestampValid(currentTimestamp - 100, 300));
        assertTrue(SignatureUtils.isTimestampValid(currentTimestamp + 100, 300));
    }

    @Test
    @DisplayName("Từ chối thời gian vượt quá dung sai cho phép")
    void testIsTimestampValid_ExceededTolerance() {
        long currentTimestamp = Instant.now().getEpochSecond();
        assertFalse(SignatureUtils.isTimestampValid(currentTimestamp - 350, 300));
        assertFalse(SignatureUtils.isTimestampValid(currentTimestamp + 350, 300));
    }
}
