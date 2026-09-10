package com.natcash.loyalty.clearing.repository;

import com.natcash.loyalty.clearing.entity.LoyaltyClearinghouseSettlementEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyClearinghouseSettlementRepository extends JpaRepository<LoyaltyClearinghouseSettlementEntity, Long> {

    List<LoyaltyClearinghouseSettlementEntity> findByTenantIdAndPeriod(String tenantId, String period);

    List<LoyaltyClearinghouseSettlementEntity> findByTenantIdAndPartnerId(String tenantId, Long partnerId);

    Optional<LoyaltyClearinghouseSettlementEntity> findByTenantIdAndPartnerIdAndPeriod(String tenantId, Long partnerId, String period);
}
