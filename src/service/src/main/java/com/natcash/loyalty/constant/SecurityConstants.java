package com.natcash.loyalty.constant;

public final class SecurityConstants {

    private SecurityConstants() {
        // Chặn khởi tạo class hằng số
    }

    public static final String HMAC_SHA256_ALGORITHM = "HmacSHA256";
    public static final String AUTH_SCHEME_BEARER = "Bearer ";
    public static final String CLAIM_TENANT_ID = "tenant_id";
    public static final String CLAIM_USER_ID = "user_id";
    public static final String CLAIM_ROLE = "role";

    public static final String[] PUBLIC_ENDPOINTS = {
            "/actuator/**",
            "/actuator/health",
            "/actuator/info",
            "/actuator/prometheus",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/auth/**",
            "/cms/**",
            "/cms/auth/**",
            "/loyalty/auth/**",
            "/api/auth/**",
            "/v1/auth/**",
            "/users/**",
            "/loyalty/users/**",
            "/api/v1/users/**",
            "/loyalty/v1/sso/**"
    };
}
