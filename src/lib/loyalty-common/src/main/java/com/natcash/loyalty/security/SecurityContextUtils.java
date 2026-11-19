package com.natcash.loyalty.security;

import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.SecurityConstants;
import com.natcash.loyalty.exception.LoyaltyException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Tiện ích trích xuất danh tính hội viên từ SecurityContext (JWT Claims) và chống truy cập chéo IDOR.
 */
public final class SecurityContextUtils {

    private static final Set<String> ADMIN_OR_PARTNER_ROLES = Set.of(
            SecurityConstants.ROLE_PARTNER,
            SecurityConstants.ROLE_SUPER_ADMIN,
            SecurityConstants.ROLE_ADMIN,
            SecurityConstants.ROLE_LOYALTY_ADMIN,
            SecurityConstants.ROLE_OPERATOR,
            SecurityConstants.ROLE_FINANCE_AUDITOR,
            SecurityConstants.ROLE_CAMPAIGN_MANAGER,
            SecurityConstants.ROLE_PARTNER_MANAGER,
            SecurityConstants.ROLE_CUSTOMER_SUPPORT,
            SecurityConstants.ROLE_SUPPORT,
            SecurityConstants.ROLE_PARTNER_ADMIN,
            SecurityConstants.ROLE_PARTNER_OWNER
    );

    private SecurityContextUtils() {
        // Ngăn khởi tạo lớp tiện ích
    }

    public static Optional<String> getAuthenticatedExternalUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        if (auth.getDetails() instanceof Map<?, ?> claims) {
            String externalUserId = readClaimAsString(claims, SecurityConstants.CLAIM_EXTERNAL_USER_ID);
            if (externalUserId != null) {
                return Optional.of(externalUserId);
            }
            String sub = readClaimAsString(claims, SecurityConstants.CLAIM_SUB);
            if (sub != null) {
                return Optional.of(sub);
            }
        }
        String name = auth.getName();
        if (name != null && !name.isBlank()
                && !SecurityConstants.PRINCIPAL_ANONYMOUS.equals(name)
                && !SecurityConstants.PRINCIPAL_JWT_USER.equals(name)) {
            return Optional.of(name.trim());
        }
        return Optional.empty();
    }

    public static Optional<String> getAuthenticatedTenantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getDetails() instanceof Map<?, ?> claims) {
            String tenantId = readClaimAsString(claims, SecurityConstants.CLAIM_TENANT_ID_CAMEL);
            if (tenantId != null) {
                return Optional.of(tenantId);
            }
            String snakeTenantId = readClaimAsString(claims, SecurityConstants.CLAIM_TENANT_ID);
            if (snakeTenantId != null) {
                return Optional.of(snakeTenantId);
            }
        }
        return Optional.empty();
    }

    public static Optional<String> getAuthenticatedAccountRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getDetails() instanceof Map<?, ?> claims) {
            String role = readClaimAsString(claims, SecurityConstants.CLAIM_ACCOUNT_ROLE);
            if (role != null) {
                return Optional.of(role.toUpperCase());
            }
        }
        return Optional.empty();
    }

    public static boolean isAdminOrPartner(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getAuthorities() == null) {
            return false;
        }
        for (GrantedAuthority authority : auth.getAuthorities()) {
            String code = authority != null ? authority.getAuthority() : null;
            if (code != null && (ADMIN_OR_PARTNER_ROLES.contains(code)
                    || (code.startsWith("ROLE_") && ADMIN_OR_PARTNER_ROLES.contains(code.substring(5))))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Xác định externalUserId hợp lệ từ JWT hội viên (chống IDOR) hoặc từ tham số khi là Admin/Partner/Nội bộ.
     */
    public static String resolveUserId(String requestedUserId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (isEndUserSession(auth)) {
            String jwtUserId = getAuthenticatedExternalUserId()
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.UNAUTHORIZED));
            if (requestedUserId != null && !requestedUserId.isBlank() && !requestedUserId.trim().equals(jwtUserId)) {
                throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
            }
            return jwtUserId;
        }

        if (requestedUserId != null && !requestedUserId.isBlank()) {
            return requestedUserId.trim();
        }

        return getAuthenticatedExternalUserId()
                .orElseThrow(() -> new LoyaltyException(ErrorCode.UNAUTHORIZED));
    }

    /**
     * Xác định externalUserId tùy chọn cho các API công khai (hỗ trợ Guest / Khách vãng lai).
     * Nếu có phiên JWT hội viên, vẫn kiểm tra chống IDOR nghiêm ngặt; nếu chưa đăng nhập, trả về "" khi tham số trống.
     */
    public static String resolveOptionalUserId(String requestedUserId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (isEndUserSession(auth)) {
            String jwtUserId = getAuthenticatedExternalUserId()
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.UNAUTHORIZED));
            if (requestedUserId != null && !requestedUserId.isBlank() && !requestedUserId.trim().equals(jwtUserId)) {
                throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
            }
            return jwtUserId;
        }
        return requestedUserId != null && !requestedUserId.isBlank() ? requestedUserId.trim() : "";
    }

    /**
     * Bắt buộc có danh tính JWT đã xác thực (dùng cho endpoint /sso/me-context).
     */
    public static String resolveAuthenticatedUserId(String requestedUserId) {
        String jwtUserId = getAuthenticatedExternalUserId()
                .orElseThrow(() -> new LoyaltyException(ErrorCode.UNAUTHORIZED));
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (isAdminOrPartner(auth) && requestedUserId != null && !requestedUserId.isBlank()) {
            return requestedUserId.trim();
        }
        if (requestedUserId != null && !requestedUserId.isBlank() && !requestedUserId.trim().equals(jwtUserId)) {
            throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
        }
        return jwtUserId;
    }

    private static boolean isEndUserSession(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || isAdminOrPartner(auth)) {
            return false;
        }
        if (auth.getDetails() instanceof Map<?, ?> claims) {
            if (claims.containsKey(SecurityConstants.CLAIM_EXTERNAL_USER_ID)
                    || claims.containsKey(SecurityConstants.CLAIM_ACCOUNT_ROLE)) {
                return true;
            }
        }
        String name = auth.getName();
        return name != null
                && !SecurityConstants.PRINCIPAL_ANONYMOUS.equals(name)
                && !SecurityConstants.PRINCIPAL_JWT_USER.equals(name)
                && hasAuthority(auth, SecurityConstants.ROLE_USER);
    }

    private static boolean hasAuthority(Authentication auth, String target) {
        if (auth.getAuthorities() == null) {
            return false;
        }
        for (GrantedAuthority authority : auth.getAuthorities()) {
            if (target.equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    private static String readClaimAsString(Map<?, ?> claims, String key) {
        Object val = claims.get(key);
        if (val == null) {
            return null;
        }
        String str = String.valueOf(val).trim();
        return str.isEmpty() ? null : str;
    }
}
