package com.natcash.loyalty.clearing.repository;

import com.natcash.loyalty.clearing.entity.ClearingTransactionBreakdownEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClearingTransactionBreakdownRepository extends JpaRepository<ClearingTransactionBreakdownEntity, Long> {

    List<ClearingTransactionBreakdownEntity> findByTenantIdAndClearingTxIdOrderByIdAsc(String tenantId, Long clearingTxId);

    List<ClearingTransactionBreakdownEntity> findByTenantIdAndTransactionCodeOrderByIdAsc(String tenantId, String transactionCode);

    List<ClearingTransactionBreakdownEntity> findByTenantIdAndClearingTxIdIn(String tenantId, List<Long> clearingTxIds);

    List<ClearingTransactionBreakdownEntity> findByTenantIdAndHoldCodeOrderByIdAsc(String tenantId, String holdCode);
}
