package com.natcash.loyalty.constant;

import com.natcash.loyalty.domain.enums.SystemPermissionCode;
import com.natcash.loyalty.domain.enums.SystemRoleCode;

public final class SecurityConstants {

    private SecurityConstants() {
        // Chặn khởi tạo class hằng số
    }

    public static final String HMAC_SHA256_ALGORITHM = "HmacSHA256";
    public static final String AUTH_SCHEME_BEARER = "Bearer ";
    public static final String AUTHORIZATION_HEADER = "Authorization";

    public static final String PRINCIPAL_JWT_USER = "JWT_USER";
    public static final String PRINCIPAL_ANONYMOUS = "anonymousUser";
    public static final String SYSTEM_ACTOR = "SYSTEM";

    public static final String ROLE_USER = SystemRoleCode.ROLE_USER.getCode();
    public static final String ROLE_PARTNER = SystemRoleCode.ROLE_PARTNER.getCode();
    public static final String ROLE_SUPER_ADMIN = SystemRoleCode.SUPER_ADMIN.getCode();
    public static final String ROLE_ADMIN = SystemRoleCode.ADMIN.getCode();
    public static final String ROLE_LOYALTY_ADMIN = SystemRoleCode.LOYALTY_ADMIN.getCode();
    public static final String ROLE_OPERATOR = SystemRoleCode.OPERATOR.getCode();
    public static final String ROLE_FINANCE_AUDITOR = SystemRoleCode.FINANCE_AUDITOR.getCode();
    public static final String ROLE_CAMPAIGN_MANAGER = SystemRoleCode.CAMPAIGN_MANAGER.getCode();
    public static final String ROLE_PARTNER_MANAGER = SystemRoleCode.PARTNER_MANAGER.getCode();
    public static final String ROLE_CUSTOMER_SUPPORT = SystemRoleCode.CUSTOMER_SUPPORT.getCode();
    public static final String ROLE_SUPPORT = SystemRoleCode.SUPPORT.getCode();
    public static final String ROLE_PARTNER_ADMIN = SystemRoleCode.PARTNER_ADMIN.getCode();
    public static final String ROLE_PARTNER_OWNER = SystemRoleCode.PARTNER_OWNER.getCode();

    public static final String PERM_ALL = SystemPermissionCode.ALL.getCode();
    public static final String PERM_READ = SystemPermissionCode.READ.getCode();
    public static final String PERM_WRITE = SystemPermissionCode.WRITE.getCode();
    public static final String PERM_DELETE = SystemPermissionCode.DELETE.getCode();
    public static final String PERM_APPROVE = SystemPermissionCode.APPROVE.getCode();
    public static final String PERM_OPERATE = SystemPermissionCode.OPERATE.getCode();
    public static final String PERM_SUPPORT = SystemPermissionCode.SUPPORT.getCode();
    public static final String PERM_PARTNER_PORTAL = SystemPermissionCode.PARTNER_PORTAL.getCode();

    public static final String CLAIM_TENANT_ID = "tenant_id";
    public static final String CLAIM_USER_ID = "user_id";
    public static final String CLAIM_ROLE = "role";
    public static final String CLAIM_SUB = "sub";
    public static final String CLAIM_USER_ID_CAMEL = "userId";
    public static final String CLAIM_FULL_NAME = "fullName";
    public static final String CLAIM_EMAIL = "email";
    public static final String CLAIM_ROLES = "roles";
    public static final String CLAIM_PARTNER_ID = "partnerId";
    public static final String CLAIM_PARTNER_CODE = "partnerCode";
    public static final String CLAIM_PARTNER_NAME = "partnerName";
    public static final String CLAIM_TENANT_ID_CAMEL = "tenantId";
    public static final String CLAIM_BRANCH_ID = "branchId";
    public static final String CLAIM_EXTERNAL_USER_ID = "externalUserId";
    public static final String CLAIM_PHONE_NUMBER = "phoneNumber";
    public static final String CLAIM_ACCOUNT_ROLE = "accountRole";
    public static final String CLAIM_IAT = "iat";
    public static final String CLAIM_EXP = "exp";

    public static final String PUBLIC_MEDIA_PATH_PATTERN = "/loyalty/v1/media/**";
    public static final String ACCOUNT_ROLE_CUSTOMER = "CUSTOMER";
    public static final String ACCOUNT_ROLE_AGENT = "AGENT";
    public static final String ACCOUNT_ROLE_SUPER_AGENT = "SUPER_AGENT";

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
