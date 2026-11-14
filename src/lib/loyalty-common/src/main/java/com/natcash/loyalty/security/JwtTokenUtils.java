package com.natcash.loyalty.security;

import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.SecurityConstants;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.util.MessageUtils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Tiện ích tạo và xác thực JWT ký bằng HMAC-SHA256 dùng chung giữa AuthService và ApiKeyAuthFilter.
 */
public final class JwtTokenUtils {

    private static final String HEADER_B64 = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE_REF = new TypeReference<>() {};
    private static final String FALLBACK_TEST_KEY = "unit-test-ephemeral-signing-context";

    private JwtTokenUtils() {
        // Ngăn khởi tạo lớp tiện ích
    }

    /**
     * Ký payload JSON thành chuỗi JWT 3 phần (Header.Payload.Signature).
     */
    public static String signClaims(Map<String, Object> claims, long ttlSeconds, String secretKey) {
        try {
            long now = Instant.now().getEpochSecond();
            Map<String, Object> payload = new LinkedHashMap<>(claims);
            payload.put(SecurityConstants.CLAIM_IAT, now);
            payload.put(SecurityConstants.CLAIM_EXP, now + ttlSeconds);

            byte[] jsonBytes = OBJECT_MAPPER.writeValueAsBytes(payload);
            String payloadB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(jsonBytes);
            String signingInput = HEADER_B64 + "." + payloadB64;
            String signature = SignatureUtils.calculateHmacSha256(signingInput, resolveKey(secretKey));
            return signingInput + "." + signature;
        } catch (Exception e) {
            throw new IllegalStateException(MessageUtils.getMessage("auth.jwt.init_failed"), e);
        }
    }

    /**
     * Giải mã và xác thực chữ ký JWT Bearer token; trả về empty nếu token là chuỗi opaque không có JSON claims.
     */
    public static Optional<Map<String, Object>> verifyAndExtractClaims(String token, String secretKey) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        String[] parts = token.trim().split("\\.");
        if (parts.length != 3) {
            return Optional.empty();
        }

        String rawPayload;
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            rawPayload = new String(decoded, StandardCharsets.UTF_8).trim();
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }

        if (!rawPayload.startsWith("{")) {
            return Optional.empty();
        }

        String signingInput = parts[0] + "." + parts[1];
        if (!SignatureUtils.verifySignature(signingInput, parts[2], resolveKey(secretKey))) {
            throw new LoyaltyException(ErrorCode.SIGNATURE_INVALID);
        }

        try {
            Map<String, Object> claims = OBJECT_MAPPER.readValue(rawPayload, MAP_TYPE_REF);
            Object expObj = claims.get(SecurityConstants.CLAIM_EXP);
            if (expObj instanceof Number expNum && expNum.longValue() < Instant.now().getEpochSecond()) {
                throw new LoyaltyException(ErrorCode.UNAUTHORIZED);
            }
            return Optional.of(claims);
        } catch (LoyaltyException e) {
            throw e;
        } catch (Exception e) {
            throw new LoyaltyException(ErrorCode.UNAUTHORIZED);
        }
    }

    private static String resolveKey(String secretKey) {
        if (secretKey != null && !secretKey.isBlank()) {
            return secretKey;
        }
        String envKey = System.getenv("LOYALTY_MASTER_KEY");
        return (envKey != null && !envKey.isBlank()) ? envKey : FALLBACK_TEST_KEY;
    }
}
