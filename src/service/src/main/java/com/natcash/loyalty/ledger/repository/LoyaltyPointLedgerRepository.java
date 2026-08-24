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

    long countByTenantId(String tenantId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(l.pointChange), 0) FROM LoyaltyPointLedgerEntity l WHERE l.tenantId = :tenantId AND l.changeType IN (com.natcash.loyalty.domain.enums.PointActionType.EARN, com.natcash.loyalty.domain.enums.PointActionType.ADJUST, com.natcash.loyalty.domain.enums.PointActionType.CASHBACK)")
    java.math.BigDecimal sumEarnedPoints(@org.springframework.data.repository.query.Param("tenantId") String tenantId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(l.pointChange), 0) FROM LoyaltyPointLedgerEntity l WHERE l.tenantId = :tenantId AND l.changeType = com.natcash.loyalty.domain.enums.PointActionType.BURN")
    java.math.BigDecimal sumBurnedPoints(@org.springframework.data.repository.query.Param("tenantId") String tenantId);
}
