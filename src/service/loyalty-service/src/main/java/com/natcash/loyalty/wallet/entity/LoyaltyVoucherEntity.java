package com.natcash.loyalty.wallet.entity;

import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.VoucherStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "loyalty_vouchers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyVoucherEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "partner_id")
    private Long partnerId;

    @Column(name = "voucher_code", nullable = false, length = 100)
    private String voucherCode;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 30)
    @Builder.Default
    private DiscountType discountType = DiscountType.FIXED_AMOUNT;

    @Column(name = "discount_value", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal discountValue = BigDecimal.ZERO;

    @Column(name = "min_bill_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal minBillAmount = BigDecimal.ZERO;

    @Column(name = "max_discount_amount", precision = 18, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "total_quantity", nullable = false)
    @Builder.Default
    private Integer totalQuantity = 0;

    @Column(name = "available_quantity", nullable = false)
    @Builder.Default
    private Integer availableQuantity = 0;

    @Column(name = "point_cost", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal pointCost = BigDecimal.ZERO;

    @Column(name = "start_date", nullable = false)
    private Instant startDate;

    @Column(name = "end_date", nullable = false)
    private Instant endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private VoucherStatus status = VoucherStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
        if (this.status == null) {
            this.status = VoucherStatus.ACTIVE;
        }
        if (this.discountType == null) {
            this.discountType = DiscountType.FIXED_AMOUNT;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
