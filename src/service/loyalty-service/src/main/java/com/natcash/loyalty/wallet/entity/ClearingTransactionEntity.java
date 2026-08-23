package com.natcash.loyalty.wallet.entity;

import com.natcash.loyalty.domain.enums.ClearingStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "clearing_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClearingTransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "transaction_code", nullable = false, unique = true, length = 100)
    private String transactionCode;

    @Column(name = "issuer_partner_id", nullable = false)
    private Long issuerPartnerId;

    @Column(name = "redeemer_partner_id", nullable = false)
    private Long redeemerPartnerId;

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @Column(name = "points_redeemed", nullable = false, precision = 18, scale = 2)
    private BigDecimal pointsRedeemed;

    @Column(name = "fiat_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal fiatAmount;

    @Column(name = "exchange_rate", nullable = false, precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal exchangeRate = BigDecimal.ONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ClearingStatus status = ClearingStatus.PENDING;

    @Column(name = "settled_at")
    private Instant settledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.status == null) {
            this.status = ClearingStatus.PENDING;
        }
        if (this.exchangeRate == null) {
            this.exchangeRate = BigDecimal.ONE;
        }
    }
}
