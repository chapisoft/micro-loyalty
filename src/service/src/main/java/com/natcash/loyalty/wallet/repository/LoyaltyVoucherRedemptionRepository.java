package com.natcash.loyalty.wallet.repository;

import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherRedemptionEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyVoucherRedemptionRepository extends JpaRepository<LoyaltyVoucherRedemptionEntity, Long> {

    List<LoyaltyVoucherRedemptionEntity> findByTenantIdAndAccount_Id(String tenantId, Long accountId);

    List<LoyaltyVoucherRedemptionEntity> findByTenantIdAndAccount_ExternalUserIdAndStatusAndExpiresAtAfter(
            String tenantId, String externalUserId, VoucherStatus status, Instant now);

    Optional<LoyaltyVoucherRedemptionEntity> findByTenantIdAndRedemptionCode(
            String tenantId, String redemptionCode);
}
