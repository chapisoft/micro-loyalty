package com.natcash.loyalty.tenant;

import com.natcash.loyalty.constant.LoyaltyConstants;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

import jakarta.persistence.EntityManager;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class TenantFilterAspect {

    private final EntityManager entityManager;

    @Before("execution(* com.natcash.loyalty.repository..*(..))")
    public void enableTenantFilter() {
        try {
            Session session = entityManager.unwrap(Session.class);
            if (session != null && session.isOpen()) {
                String tenantId = TenantContext.getTenantId();
                session.enableFilter(LoyaltyConstants.HIBERNATE_TENANT_FILTER)
                        .setParameter(LoyaltyConstants.HIBERNATE_TENANT_PARAM, tenantId);
                log.trace("TenantFilterAspect: Đã kích hoạt filter cho tenantId [{}]", tenantId);
            }
        } catch (Exception e) {
            log.warn("TenantFilterAspect: Không thể kích hoạt hibernate filter: {}", e.getMessage());
        }
    }
}
