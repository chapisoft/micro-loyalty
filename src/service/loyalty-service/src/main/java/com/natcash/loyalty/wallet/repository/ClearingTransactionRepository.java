package com.natcash.loyalty.wallet.repository;

import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClearingTransactionRepository extends JpaRepository<ClearingTransactionEntity, Long> {

    Optional<ClearingTransactionEntity> findByTenantIdAndTransactionCode(String tenantId, String transactionCode);

    List<ClearingTransactionEntity> findByTenantIdAndStatus(String tenantId, ClearingStatus status);

    boolean existsByTenantIdAndTransactionCode(String tenantId, String transactionCode);
}
