package com.natcash.loyalty.wallet.entity;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.domain.enums.VoucherStatus;

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

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "loyalty_voucher_redemptions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyVoucherRedemptionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private LoyaltyAccountEntity account;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "voucher_id", nullable = false)
    private LoyaltyVoucherEntity voucher;

    @Column(name = "redemption_code", nullable = false, unique = true, length = 100)
    private String redemptionCode;

    @Column(name = "points_used", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal pointsUsed = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private VoucherStatus status = VoucherStatus.ACTIVE;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "used_partner_id")
    private Long usedPartnerId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.status == null) {
            this.status = VoucherStatus.ACTIVE;
        }
    }
}
