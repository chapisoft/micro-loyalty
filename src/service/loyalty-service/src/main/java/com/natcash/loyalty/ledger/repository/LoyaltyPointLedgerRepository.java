package com.natcash.loyalty.ledger.repository;

import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoyaltyPointLedgerRepository extends JpaRepository<LoyaltyPointLedgerEntity, Long> {

    Page<LoyaltyPointLedgerEntity> findByTenantIdAndAccount_ExternalUserIdOrderByCreatedAtDesc(
            String tenantId, String externalUserId, Pageable pageable);

    Optional<LoyaltyPointLedgerEntity> findByTenantIdAndReferenceCode(String tenantId, String referenceCode);

    boolean existsByTenantIdAndReferenceCode(String tenantId, String referenceCode);
}
