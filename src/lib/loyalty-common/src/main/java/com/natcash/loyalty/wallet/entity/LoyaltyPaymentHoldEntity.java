package com.natcash.loyalty.wallet.entity;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.domain.enums.HoldStatus;

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
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "loyalty_payment_holds")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyPaymentHoldEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "hold_code", nullable = false, unique = true, length = 100)
    private String holdCode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "partner_id", nullable = false)
    private LoyaltyPartnerEntity partner;

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @Column(name = "partner_order_id", length = 100)
    private String partnerOrderId;

    @Column(name = "bill_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal billAmount;

    @Column(name = "points_held", nullable = false, precision = 18, scale = 2)
    private BigDecimal pointsHeld;

    @Column(name = "point_discount_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal pointDiscountAmount;

    @Column(name = "voucher_code", length = 100)
    private String voucherCode;

    @Column(name = "voucher_discount_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal voucherDiscountAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private HoldStatus status = HoldStatus.HELD;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "captured_at")
    private Instant capturedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = HoldStatus.HELD;
        }
        if (this.voucherDiscountAmount == null) {
            this.voucherDiscountAmount = BigDecimal.ZERO;
        }
    }
}
