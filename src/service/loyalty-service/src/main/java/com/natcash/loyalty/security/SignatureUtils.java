package com.natcash.loyalty.security;

import com.natcash.loyalty.constant.SecurityConstants;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public final class SignatureUtils {

    private static final Logger log = LoggerFactory.getLogger(SignatureUtils.class);

    private SignatureUtils() {
        // Chặn khởi tạo class tiện ích
    }

    public static String calculateHmacSha256(String data, String secretKey) {
        if (data == null || secretKey == null) {
            throw new IllegalArgumentException("Dữ liệu hoặc SecretKey không được null");
        }
        try {
            Mac mac = Mac.getInstance(SecurityConstants.HMAC_SHA256_ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), SecurityConstants.HMAC_SHA256_ALGORITHM);
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(rawHmac);
        } catch (Exception e) {
            log.error("Lỗi tính toán chữ ký HMAC-SHA256: {}", e.getMessage());
            throw new IllegalStateException("Không thể tính toán chữ ký số HMAC-SHA256", e);
        }
    }

    public static boolean verifySignature(String data, String providedSignature, String secretKey) {
        if (providedSignature == null || secretKey == null || data == null) {
            return false;
        }
        try {
            String calculatedSignature = calculateHmacSha256(data, secretKey);
            return MessageDigest.isEqual(
                    calculatedSignature.toLowerCase().getBytes(StandardCharsets.UTF_8),
                    providedSignature.trim().toLowerCase().getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.warn("Lỗi kiểm tra chữ ký số: {}", e.getMessage());
            return false;
        }
    }

    public static boolean isTimestampValid(long timestamp, long toleranceSeconds) {
        long currentTimestamp = Instant.now().getEpochSecond();
        long diff = Math.abs(currentTimestamp - timestamp);
        return diff <= toleranceSeconds;
    }

    public static String buildCanonicalString(String httpMethod, String requestUri, String timestamp, String body) {
        StringBuilder sb = new StringBuilder();
        sb.append(httpMethod != null ? httpMethod.toUpperCase() : "").append("\n");
        sb.append(requestUri != null ? requestUri : "").append("\n");
        sb.append(timestamp != null ? timestamp : "").append("\n");
        sb.append(body != null ? body : "");
        return sb.toString();
    }
}
