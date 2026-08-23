package com.natcash.loyalty.security;

import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.constant.SecurityConstants;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
@RequiredArgsConstructor
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Value("${loyalty.security.timestamp-drift-tolerance-seconds:300}")
    private long timestampToleranceSeconds;

    @Value("${loyalty.security.master-key:c21hcnQtbG95YWx0eS1tYXN0ZXIta2V5LWFlczI1Ng==}")
    private String masterSecretKey;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        for (String pattern : SecurityConstants.PUBLIC_ENDPOINTS) {
            if (pathMatcher.match(pattern, path) || pathMatcher.match("/loyalty-service" + pattern, path)) {
                return true;
            }
        }
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String apiKey = request.getHeader(LoyaltyConstants.API_KEY_HEADER);
        String timestampStr = request.getHeader(LoyaltyConstants.TIMESTAMP_HEADER);
        String signature = request.getHeader(LoyaltyConstants.SIGNATURE_HEADER);

        // Trường hợp truy cập nội bộ có Authorization Bearer JWT (từ CMS hoặc Gateway)
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith(SecurityConstants.AUTH_SCHEME_BEARER)) {
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    "JWT_USER", null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);
            return;
        }

        // Trường hợp gọi B2B từ đối tác hoặc POS cần xác thực X-Api-Key
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            if (timestampStr == null || timestampStr.trim().isEmpty()) {
                sendErrorResponse(response, HttpStatus.UNAUTHORIZED, ErrorCode.TIMESTAMP_DRIFT_EXCEEDED, "Thiếu tiêu đề X-Timestamp");
                return;
            }

            long timestamp;
            try {
                timestamp = Long.parseLong(timestampStr.trim());
            } catch (NumberFormatException e) {
                sendErrorResponse(response, HttpStatus.UNAUTHORIZED, ErrorCode.TIMESTAMP_DRIFT_EXCEEDED, "Định dạng X-Timestamp không hợp lệ");
                return;
            }

            if (!SignatureUtils.isTimestampValid(timestamp, timestampToleranceSeconds)) {
                sendErrorResponse(response, HttpStatus.UNAUTHORIZED, ErrorCode.TIMESTAMP_DRIFT_EXCEEDED, "Thời gian yêu cầu vượt quá độ trễ cho phép (+-300s)");
                return;
            }

            // Gán Authentication thành công cho đối tác
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    apiKey, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_PARTNER")));
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
