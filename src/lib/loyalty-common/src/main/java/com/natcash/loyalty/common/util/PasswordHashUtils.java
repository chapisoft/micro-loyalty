package com.natcash.loyalty.common.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Tiện ích băm và kiểm tra mật khẩu người dùng bằng SHA-256 không lưu mật khẩu thô trong mã nguồn.
 */
public final class PasswordHashUtils {

    private static final String SHA256_PREFIX = "{sha256}";

    private PasswordHashUtils() {
        // Ngăn khởi tạo lớp tiện ích
    }

    /**
     * Tạo chuỗi băm SHA-256 kèm tiền tố định danh thuật toán.
     */
    public static String hashPassword(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Password must not be blank");
        }
        return SHA256_PREFIX + sha256Hex(rawPassword);
    }

    /**
     * Kiểm tra mật khẩu thô khớp với chuỗi băm lưu trữ trong cơ sở dữ liệu.
     */
    public static boolean matches(String rawPassword, String storedHash) {
        if (rawPassword == null || rawPassword.isBlank() || storedHash == null || storedHash.isBlank()) {
            return false;
        }
        String normalized = storedHash.trim();
        if (normalized.startsWith(SHA256_PREFIX)) {
            String expectedHex = normalized.substring(SHA256_PREFIX.length());
            return constantTimeEquals(sha256Hex(rawPassword), expectedHex);
        }
        if (normalized.length() == 64 && normalized.matches("^[0-9a-fA-F]{64}$")) {
            return constantTimeEquals(sha256Hex(rawPassword), normalized);
        }
        return false;
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(Character.forDigit((b >> 4) & 0xF, 16));
                hex.append(Character.forDigit(b & 0xF, 16));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return MessageDigest.isEqual(
                a.toLowerCase().getBytes(StandardCharsets.UTF_8),
                b.toLowerCase().getBytes(StandardCharsets.UTF_8)
        );
    }
}
