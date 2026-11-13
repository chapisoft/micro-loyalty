package com.natcash.loyalty.clearing.repository;

import com.natcash.loyalty.clearing.entity.ClearingPaymentBatchEntity;
import com.natcash.loyalty.domain.enums.BatchSettlementStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClearingPaymentBatchRepository extends JpaRepository<ClearingPaymentBatchEntity, Long> {

    List<ClearingPaymentBatchEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    List<ClearingPaymentBatchEntity> findByTenantIdAndPartnerIdOrderByCreatedAtDesc(String tenantId, Long partnerId);

    List<ClearingPaymentBatchEntity> findByTenantIdAndStatus(String tenantId, BatchSettlementStatus status);

    Optional<ClearingPaymentBatchEntity> findByTenantIdAndBatchCode(String tenantId, String batchCode);

    Optional<ClearingPaymentBatchEntity> findByTenantIdAndPartnerIdAndBatchCode(
            String tenantId, Long partnerId, String batchCode);
}
