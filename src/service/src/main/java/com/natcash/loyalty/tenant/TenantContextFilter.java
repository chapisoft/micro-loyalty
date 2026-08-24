package com.natcash.loyalty.tenant;

import com.natcash.loyalty.constant.LoyaltyConstants;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class TenantContextFilter extends OncePerRequestFilter {

    private static final String MDC_TENANT_KEY = "tenantId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String tenantId = request.getHeader(LoyaltyConstants.TENANT_HEADER);

        if (tenantId == null || tenantId.trim().isEmpty()) {
            tenantId = LoyaltyConstants.DEFAULT_TENANT_ID;
        }

        try {
            TenantContext.setTenantId(tenantId);
            MDC.put(MDC_TENANT_KEY, TenantContext.getTenantId());
            log.debug("TenantContextFilter: Request path [{}] gắn tenantId [{}]", request.getRequestURI(), TenantContext.getTenantId());

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
            MDC.remove(MDC_TENANT_KEY);
        }
    }
}
