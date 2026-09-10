package com.natcash.loyalty.clearing.repository;

import com.natcash.loyalty.clearing.entity.LoyaltyClearingDisputeEntity;
import com.natcash.loyalty.domain.enums.DisputeStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyClearingDisputeRepository extends JpaRepository<LoyaltyClearingDisputeEntity, Long> {

    Optional<LoyaltyClearingDisputeEntity> findByTenantIdAndDisputeCode(String tenantId, String disputeCode);

    List<LoyaltyClearingDisputeEntity> findByTenantId(String tenantId);

    List<LoyaltyClearingDisputeEntity> findByTenantIdAndBatchCode(String tenantId, String batchCode);

    List<LoyaltyClearingDisputeEntity> findByTenantIdAndPartner_Id(String tenantId, Long partnerId);

    List<LoyaltyClearingDisputeEntity> findByTenantIdAndStatus(String tenantId, DisputeStatus status);
}
