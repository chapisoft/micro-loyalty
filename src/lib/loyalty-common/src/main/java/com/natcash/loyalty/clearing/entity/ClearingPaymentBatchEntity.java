package com.natcash.loyalty.clearing.entity;

import com.natcash.loyalty.domain.enums.BatchDirection;
import com.natcash.loyalty.domain.enums.BatchSettlementStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "clearing_payment_batches")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClearingPaymentBatchEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "batch_code", nullable = false, unique = true, length = 80)
    private String batchCode;

    @Column(name = "partner_id", nullable = false)
    private Long partnerId;

    @Column(name = "period", nullable = false, length = 30)
    private String period;

    @Column(name = "gross_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal grossAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "mdr_fee_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal mdrFeeAmount = BigDecimal.ZERO;

    @Column(name = "net_payable_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal netPayableAmount = BigDecimal.ZERO;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "excluded_dispute_codes", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String excludedDisputeCodes = "[]";

    @Column(name = "tx_count", nullable = false)
    @Builder.Default
    private Integer txCount = 0;

    @Column(name = "confirm_deadline_at")
    private Instant confirmDeadlineAt;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "confirmed_by", length = 100)
    private String confirmedBy;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "bank_ref_code", length = 100)
    private String bankRefCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "batch_direction", nullable = false, length = 30)
    @Builder.Default
    private BatchDirection batchDirection = BatchDirection.MERCHANT_SETTLEMENT;

    @Column(name = "sponsor_payable_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal sponsorPayableAmount = BigDecimal.ZERO;

    @Column(name = "core_settlement_tx_id", length = 100)
    private String coreSettlementTxId;

    @Column(name = "approval_request_id")
    private Long approvalRequestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private BatchSettlementStatus status = BatchSettlementStatus.PENDING_CONFIRM;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
