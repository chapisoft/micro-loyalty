package com.natcash.loyalty.security;

import com.natcash.loyalty.config.LoyaltyProperties;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.constant.SecurityConstants;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.tenant.TenantContext;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        if (path != null && (path.endsWith("/auth/me") || path.endsWith("/users/me"))) {
            return false;
        }
        for (String pattern : SecurityConstants.PUBLIC_ENDPOINTS) {
            if (pathMatcher.match(pattern, path) || pathMatcher.match("/loyalty-service" + pattern, path)) {
                return true;
            }
        }
        return false;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String apiKey = request.getHeader(LoyaltyConstants.API_KEY_HEADER);
        String timestampStr = request.getHeader(LoyaltyConstants.TIMESTAMP_HEADER);

        // Trường hợp truy cập nội bộ có Authorization Bearer JWT (từ CMS, Partner Portal hoặc Gateway)
        String authHeader = request.getHeader(SecurityConstants.AUTHORIZATION_HEADER);
        if (authHeader != null && authHeader.startsWith(SecurityConstants.AUTH_SCHEME_BEARER)) {
            String token = authHeader.substring(SecurityConstants.AUTH_SCHEME_BEARER.length()).trim();
            Optional<Map<String, Object>> claimsOpt;
            try {
                claimsOpt = JwtTokenUtils.verifyAndExtractClaims(token, LoyaltyProperties.get().getSecurity().getMasterKey());
            } catch (LoyaltyException ex) {
                log.warn("[JWT-AUTH] Token từ chối: {}", ex.getMessage());
                sendErrorResponse(response, HttpStatus.UNAUTHORIZED,
                        ex.getErrorCode() != null ? ex.getErrorCode() : ErrorCode.UNAUTHORIZED,
                        ex.getMessage());
                return;
            }

            if (claimsOpt.isPresent()) {
                Map<String, Object> claims = claimsOpt.get();
                String principal = claims.get(SecurityConstants.CLAIM_SUB) != null
                        ? String.valueOf(claims.get(SecurityConstants.CLAIM_SUB))
                        : SecurityConstants.PRINCIPAL_JWT_USER;
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority(SecurityConstants.ROLE_USER));
                if (claims.get(SecurityConstants.CLAIM_ROLES) instanceof List<?> rawRoles) {
                    for (Object r : rawRoles) {
                        if (r != null) {
                            authorities.add(new SimpleGrantedAuthority(String.valueOf(r)));
                        }
                    }
                }
                if (claims.get(SecurityConstants.CLAIM_PARTNER_ID) != null) {
                    authorities.add(new SimpleGrantedAuthority(SecurityConstants.ROLE_PARTNER));
                    if (claims.get(SecurityConstants.CLAIM_TENANT_ID_CAMEL) != null) {
                        String headerTenant = request.getHeader(LoyaltyConstants.TENANT_HEADER);
                        if (headerTenant == null || headerTenant.isBlank()) {
                            TenantContext.setTenantId(String.valueOf(claims.get(SecurityConstants.CLAIM_TENANT_ID_CAMEL)));
                        }
                    }
                }
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, authorities);
                authentication.setDetails(claims);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        SecurityConstants.PRINCIPAL_JWT_USER,
                        null,
                        Collections.singletonList(new SimpleGrantedAuthority(SecurityConstants.ROLE_USER)));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
            filterChain.doFilter(request, response);
            return;
        }

        // Trường hợp gọi B2B từ đối tác hoặc POS cần xác thực X-Api-Key
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            if (timestampStr == null || timestampStr.trim().isEmpty()) {
                sendErrorResponse(response, HttpStatus.UNAUTHORIZED, ErrorCode.TIMESTAMP_DRIFT_EXCEEDED,
                        ErrorCode.TIMESTAMP_DRIFT_EXCEEDED.getMessage());
                return;
            }

            long timestamp;
            try {
                timestamp = Long.parseLong(timestampStr.trim());
            } catch (NumberFormatException e) {
                log.debug("[API-KEY-AUTH] Invalid X-Timestamp '{}': {}", timestampStr, e.getMessage());
                sendErrorResponse(response, HttpStatus.UNAUTHORIZED, ErrorCode.TIMESTAMP_DRIFT_EXCEEDED,
                        ErrorCode.TIMESTAMP_DRIFT_EXCEEDED.getMessage());
                return;
            }

            long toleranceSeconds = SystemParameterService.get().getLong(
                    TenantContext.getTenantId(),
                    SystemParamSpec.HMAC_DRIFT_TOLERANCE_SECONDS);
            if (!SignatureUtils.isTimestampValid(timestamp, toleranceSeconds)) {
                sendErrorResponse(response, HttpStatus.UNAUTHORIZED, ErrorCode.TIMESTAMP_DRIFT_EXCEEDED,
                        ErrorCode.TIMESTAMP_DRIFT_EXCEEDED.getMessage());
                return;
            }

            // Gán Authentication thành công cho đối tác
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    apiKey, null, Collections.singletonList(new SimpleGrantedAuthority(SecurityConstants.ROLE_PARTNER)));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private void sendErrorResponse(HttpServletResponse response,
                                   HttpStatus status,
                                   ErrorCode errorCode,
                                   String detailMessage) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("code", errorCode.getCode());
        errorBody.put("message", errorCode.getMessage());
        errorBody.put("detail", detailMessage);
        errorBody.put("timestamp", System.currentTimeMillis());

        response.getWriter().write(objectMapper.writeValueAsString(errorBody));
    }
}
