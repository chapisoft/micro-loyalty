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

    /** Free-voucher limit per customer within the current batch. */
    long countByAccount_IdAndVoucher_IdAndCreatedAtAfter(Long accountId, Long voucherId, Instant since);

    Optional<LoyaltyVoucherRedemptionEntity> findByTenantIdAndRedemptionCode(
            String tenantId, String redemptionCode);

    List<LoyaltyVoucherRedemptionEntity> findByTenantIdAndVoucher_PartnerId(
            String tenantId, Long partnerId);

    List<LoyaltyVoucherRedemptionEntity> findByTenantIdAndVoucher_PartnerIdAndStatusOrderByIdAsc(
            String tenantId, Long partnerId, VoucherStatus status);
}
