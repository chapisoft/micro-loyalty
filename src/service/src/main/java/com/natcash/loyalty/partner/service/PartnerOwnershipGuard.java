package com.natcash.loyalty.partner.service;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.partner.entity.PartnerStaffAccountEntity;
import com.natcash.loyalty.partner.repository.PartnerStaffAccountRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PartnerOwnershipGuard {

    private final LoyaltyPartnerRepository partnerRepository;
    private final PartnerStaffAccountRepository staffAccountRepository;

    public LoyaltyPartnerEntity verifyPartnerAccess(String tenantId, Long requestedPartnerId) {
        if (tenantId == null || tenantId.isBlank() || requestedPartnerId == null) {
            throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN);
        }

        LoyaltyPartnerEntity partner = partnerRepository.findByIdAndTenantId(requestedPartnerId, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.IDOR_FORBIDDEN));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null
                && !"anonymousUser".equals(auth.getName())) {
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
}
