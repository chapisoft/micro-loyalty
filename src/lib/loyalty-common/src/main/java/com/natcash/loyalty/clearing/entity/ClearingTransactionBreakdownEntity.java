package com.natcash.loyalty.clearing.entity;

import com.natcash.loyalty.domain.enums.ClearingSourceType;
import com.natcash.loyalty.domain.enums.SponsorType;

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

/**
 * Bảng con bóc tách chi tiết từng nguồn tài trợ (mã Voucher, lô Coin FIFO) trong một giao dịch bù trừ.
 */
@Entity
@Table(name = "clearing_transaction_breakdowns")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClearingTransactionBreakdownEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "clearing_tx_id", nullable = false)
    private Long clearingTxId;

    @Column(name = "transaction_code", nullable = false, length = 100)
    private String transactionCode;

    @Column(name = "hold_code", length = 100)
    private String holdCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 30)
    private ClearingSourceType sourceType;

    @Column(name = "source_ref", length = 120)
    private String sourceRef;

    @Column(name = "bucket_id")
    private Long bucketId;

    @Column(name = "redemption_id")
    private Long redemptionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sponsor_type", nullable = false, length = 30)
    @Builder.Default
    private SponsorType sponsorType = SponsorType.NATCASH;

    @Column(name = "funding_partner_id")
    private Long fundingPartnerId;

    @Column(name = "share_ratio", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal shareRatio = new BigDecimal("100.00");

    @Column(name = "points_consumed", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal pointsConsumed = BigDecimal.ZERO;

    @Column(name = "exchange_rate", nullable = false, precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal exchangeRate = BigDecimal.ONE;

    @Column(name = "payable_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal payableAmount = BigDecimal.ZERO;

    @Column(name = "reverted", nullable = false)
    @Builder.Default
    private Boolean reverted = Boolean.FALSE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.sponsorType == null) {
            this.sponsorType = SponsorType.NATCASH;
        }
        if (this.shareRatio == null) {
            this.shareRatio = new BigDecimal("100.00");
        }
        if (this.pointsConsumed == null) {
            this.pointsConsumed = BigDecimal.ZERO;
        }
        if (this.exchangeRate == null) {
            this.exchangeRate = BigDecimal.ONE;
        }
        if (this.payableAmount == null) {
            this.payableAmount = BigDecimal.ZERO;
        }
        if (this.reverted == null) {
            this.reverted = Boolean.FALSE;
        }
    }
}
