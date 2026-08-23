package com.natcash.loyalty.wallet.repository;

import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyVoucherRepository extends JpaRepository<LoyaltyVoucherEntity, Long> {

    Optional<LoyaltyVoucherEntity> findByTenantIdAndVoucherCode(String tenantId, String voucherCode);

    List<LoyaltyVoucherEntity> findByTenantIdAndStatusAndStartDateBeforeAndEndDateAfter(
            String tenantId, VoucherStatus status, Instant now1, Instant now2);
}
