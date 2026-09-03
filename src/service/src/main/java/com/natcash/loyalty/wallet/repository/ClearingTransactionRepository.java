package com.natcash.loyalty.wallet.repository;

import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClearingTransactionRepository extends JpaRepository<ClearingTransactionEntity, Long> {

    Optional<ClearingTransactionEntity> findByTenantIdAndTransactionCode(String tenantId, String transactionCode);

    List<ClearingTransactionEntity> findByTenantIdAndStatus(String tenantId, ClearingStatus status);

    List<ClearingTransactionEntity> findByTenantIdAndCreatedAtBetween(String tenantId, Instant from, Instant to);

    boolean existsByTenantIdAndTransactionCode(String tenantId, String transactionCode);

    @Query("SELECT COALESCE(SUM(c.fiatAmount), 0) FROM ClearingTransactionEntity c WHERE c.tenantId = :tenantId")
    BigDecimal sumClearingAmount(@Param("tenantId") String tenantId);

    @Query("SELECT c FROM ClearingTransactionEntity c WHERE c.tenantId = :tenantId AND (c.redeemerPartnerId = :partnerId OR c.issuerPartnerId = :partnerId) AND c.createdAt BETWEEN :from AND :to ORDER BY c.createdAt DESC")
    List<ClearingTransactionEntity> findByPartnerAndPeriod(
            @Param("tenantId") String tenantId,
            @Param("partnerId") Long partnerId,
            @Param("from") Instant from,
            @Param("to") Instant to);
}
