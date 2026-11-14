package com.natcash.loyalty.partner.service;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.SecurityConstants;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.partner.entity.PartnerStaffAccountEntity;
import com.natcash.loyalty.partner.repository.PartnerStaffAccountRepository;
import com.natcash.loyalty.tenant.TenantContext;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class PartnerOwnershipGuard {

    private static final Set<String> ADMIN_AUTHORITIES = Set.of(
            SecurityConstants.ROLE_SUPER_ADMIN,
            SecurityConstants.ROLE_ADMIN,
            SecurityConstants.ROLE_OPERATOR,
            "ROLE_" + SecurityConstants.ROLE_SUPER_ADMIN,
            "ROLE_" + SecurityConstants.ROLE_ADMIN,
            "ROLE_" + SecurityConstants.ROLE_OPERATOR
    );

    private final LoyaltyPartnerRepository partnerRepository;
    private final PartnerStaffAccountRepository staffAccountRepository;

    public record PartnerIdentity(Long partnerId, String tenantId, Long branchId, String username) {}

    /**
     * Trích xuất danh tính đối tác được xác thực từ JWT claims hoặc bảng tài khoản nhân viên.
     */
    public Optional<PartnerIdentity> resolveAuthenticatedPartner() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null
                || SecurityConstants.PRINCIPAL_ANONYMOUS.equals(auth.getName())) {
            return Optional.empty();
        }

        if (auth.getDetails() instanceof Map<?, ?> claims
                && claims.get(SecurityConstants.CLAIM_PARTNER_ID) instanceof Number partnerNum) {
            Long partnerId = partnerNum.longValue();
            String tenantId = claims.get(SecurityConstants.CLAIM_TENANT_ID_CAMEL) != null
                    ? String.valueOf(claims.get(SecurityConstants.CLAIM_TENANT_ID_CAMEL))
                    : null;
            Long branchId = claims.get(SecurityConstants.CLAIM_BRANCH_ID) instanceof Number branchNum
                    ? branchNum.longValue()
                    : null;
            return Optional.of(new PartnerIdentity(partnerId, tenantId, branchId, auth.getName()));
        }

        List<PartnerStaffAccountEntity> matches = staffAccountRepository.findByUsernameOrderByIdAsc(auth.getName());
        if (matches != null && !matches.isEmpty()) {
            PartnerStaffAccountEntity staff = matches.stream()
                    .filter(s -> s.getStatus() == CommonStatus.ACTIVE)
                    .findFirst()
                    .orElse(matches.get(0));
            if (staff.getPartnerId() != null) {
                return Optional.of(new PartnerIdentity(
                        staff.getPartnerId(), staff.getTenantId(), staff.getBranchId(), staff.getUsername()));
            }
        }
        return Optional.empty();
    }

    /**
     * Khóa cứng tenantId theo danh tính đối tác đăng nhập; chặn giả mạo X-Tenant-Id xuyên đối tác.
     */
    public String resolveEffectiveTenantId(String headerTenantId) {
        Optional<PartnerIdentity> partnerOpt = resolveAuthenticatedPartner();
        if (partnerOpt.isPresent()) {
            PartnerIdentity identity = partnerOpt.get();
            String authTenant = identity.tenantId();
            if (headerTenantId != null && !headerTenantId.isBlank()
                    && authTenant != null && !authTenant.equalsIgnoreCase(headerTenantId.trim())) {
                throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
            }
            if (authTenant != null && !authTenant.isBlank()) {
                TenantContext.setTenantId(authTenant);
                return authTenant;
            }
        }
        return headerTenantId != null && !headerTenantId.isBlank()
                ? headerTenantId.trim()
                : TenantContext.getTenantId();
    }

    /**
     * Khóa cứng partnerId theo danh tính đối tác đăng nhập; từ chối 403 nếu tham số hoặc header trỏ sang đối tác khác.
     */
    public Long resolveEffectivePartnerId(Long headerPartnerId, Long paramPartnerId) {
        Optional<PartnerIdentity> partnerOpt = resolveAuthenticatedPartner();
        if (partnerOpt.isPresent()) {
            Long authPartnerId = partnerOpt.get().partnerId();
            if (headerPartnerId != null && !headerPartnerId.equals(authPartnerId)) {
                throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
            }
            if (paramPartnerId != null && !paramPartnerId.equals(authPartnerId)) {
                throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
            }
            return authPartnerId;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()
                && !isPrivilegedAdmin(auth)
                && !SecurityConstants.PRINCIPAL_JWT_USER.equals(auth.getName())
                && !SecurityConstants.PRINCIPAL_ANONYMOUS.equals(auth.getName())) {
            throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
        }
        Long resolved = headerPartnerId != null ? headerPartnerId : paramPartnerId;
        if (resolved == null) {
            throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
        }
        return resolved;
    }

    public LoyaltyPartnerEntity verifyPartnerAccess(String tenantId, Long requestedPartnerId) {
        if (tenantId == null || tenantId.isBlank() || requestedPartnerId == null) {
            throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null
                && !SecurityConstants.PRINCIPAL_ANONYMOUS.equals(auth.getName())) {
            Optional<PartnerIdentity> partnerOpt = resolveAuthenticatedPartner();
            if (partnerOpt.isPresent()) {
                PartnerIdentity identity = partnerOpt.get();
                if (!requestedPartnerId.equals(identity.partnerId())) {
                    throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
                }
                if (identity.tenantId() != null && !identity.tenantId().equalsIgnoreCase(tenantId)) {
                    throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
                }
            }
        }

        LoyaltyPartnerEntity partner = partnerRepository.findByIdAndTenantId(requestedPartnerId, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.IDOR_FORBIDDEN));

        if (auth != null && auth.isAuthenticated() && auth.getName() != null
                && !SecurityConstants.PRINCIPAL_ANONYMOUS.equals(auth.getName())) {
            Optional<PartnerStaffAccountEntity> staffOpt = staffAccountRepository
                    .findByTenantIdAndUsername(tenantId, auth.getName());
            if (staffOpt.isPresent() && !requestedPartnerId.equals(staffOpt.get().getPartnerId())) {
                throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
            }
        }
        return partner;
    }

    public void verifyRecordOwnership(Long partnerId, Long recordPartnerId) {
        if (partnerId == null || recordPartnerId == null || !partnerId.equals(recordPartnerId)) {
            throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
        }
    }

    private boolean isPrivilegedAdmin(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) {
            return false;
        }
        for (GrantedAuthority authority : auth.getAuthorities()) {
            if (authority != null && ADMIN_AUTHORITIES.contains(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}
