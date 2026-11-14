package com.natcash.loyalty.wheel.entity;

import com.natcash.loyalty.domain.enums.CommonStatus;

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
@Table(name = "loyalty_lucky_wheels")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LuckyWheelEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "wheel_code", nullable = false, length = 100)
    private String wheelCode;

    @Column(name = "wheel_name", nullable = false, length = 255)
    private String wheelName;

    @Column(name = "price_per_spin", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal pricePerSpin = BigDecimal.ZERO;

    @Column(name = "free_spins_daily", nullable = false)
    @Builder.Default
    private Integer freeSpinsDaily = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private CommonStatus status = CommonStatus.ACTIVE;

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
            this.status = CommonStatus.ACTIVE;
        }
        if (this.pricePerSpin == null) {
            this.pricePerSpin = BigDecimal.ZERO;
        }
        if (this.freeSpinsDaily == null) {
            this.freeSpinsDaily = 1;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
