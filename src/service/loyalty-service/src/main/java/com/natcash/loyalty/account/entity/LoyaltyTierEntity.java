package com.natcash.loyalty.account.entity;

import com.natcash.loyalty.domain.enums.TierLevel;

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
@Table(name = "loyalty_tiers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyTierEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "code", nullable = false, length = 50)
    private TierLevel code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "tier_level", nullable = false)
    private Integer tierLevel;

    @Column(name = "min_points", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal minPoints = BigDecimal.ZERO;

    @Column(name = "point_multiplier", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal pointMultiplier = BigDecimal.ONE;

    @Column(name = "free_daily_turns", nullable = false)
    @Builder.Default
    private Integer freeDailyTurns = 1;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

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
            this.status = "ACTIVE";
        }
        if (this.minPoints == null) {
            this.minPoints = BigDecimal.ZERO;
        }
        if (this.pointMultiplier == null) {
            this.pointMultiplier = BigDecimal.ONE;
        }
        if (this.freeDailyTurns == null) {
            this.freeDailyTurns = 1;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
