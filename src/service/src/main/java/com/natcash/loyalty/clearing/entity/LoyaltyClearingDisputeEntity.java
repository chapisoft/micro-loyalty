package com.natcash.loyalty.clearing.entity;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.domain.enums.DisputeStatus;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "loyalty_clearing_disputes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyClearingDisputeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "dispute_code", nullable = false, unique = true, length = 100)
    private String disputeCode;

    @Column(name = "batch_code", nullable = false, length = 100)
    private String batchCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clearing_tx_id")
    private ClearingTransactionEntity clearingTransaction;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "partner_id", nullable = false)
    private LoyaltyPartnerEntity partner;

    @Column(name = "dispute_type", nullable = false, length = 50)
    private String disputeType; // MISSING_TX, AMOUNT_MISMATCH, DUPLICATE_TX

    @Column(name = "partner_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal partnerAmount = BigDecimal.ZERO;

    @Column(name = "loyalty_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal loyaltyAmount = BigDecimal.ZERO;

    @Column(name = "resolved_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal resolvedAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DisputeStatus status = DisputeStatus.OPEN;

    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = DisputeStatus.OPEN;
        }
        if (this.partnerAmount == null) {
            this.partnerAmount = BigDecimal.ZERO;
        }
        if (this.loyaltyAmount == null) {
            this.loyaltyAmount = BigDecimal.ZERO;
        }
        if (this.resolvedAmount == null) {
            this.resolvedAmount = BigDecimal.ZERO;
        }
    }
}
