package com.natcash.loyalty.wallet.entity;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.entity.LoyaltyTierEntity;
import com.natcash.loyalty.domain.enums.CommonStatus;

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
@Table(name = "loyalty_acceptance_policies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyAcceptancePolicyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "partner_id", nullable = false)
    private LoyaltyPartnerEntity partner;

    @Column(name = "point_exchange_rate", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal pointExchangeRate = new BigDecimal("1.0000");

    @Column(name = "max_burn_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal maxBurnPercentage = new BigDecimal("50.00");

    @Column(name = "min_burn_points", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal minBurnPoints = new BigDecimal("10.00");

    @Column(name = "max_burn_points_per_day", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal maxBurnPointsPerDay = new BigDecimal("10000.00");

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "min_tier_id")
    private LoyaltyTierEntity minTier;

    @Column(name = "allowed_point_types", length = 100)
    @Builder.Default
    private String allowedPointTypes = "ALL";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private CommonStatus status = CommonStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
