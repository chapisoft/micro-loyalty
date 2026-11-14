package com.natcash.loyalty.ledger.entity;

import com.natcash.loyalty.domain.enums.BucketStatus;
import com.natcash.loyalty.domain.enums.CurrencyAssetType;

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
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "point_expiration_buckets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointExpirationBucketEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 30)
    @Builder.Default
    private CurrencyAssetType assetType = CurrencyAssetType.LOYALTY_COIN;

    @Column(name = "initial_points", nullable = false, precision = 18, scale = 2)
    private BigDecimal initialPoints;

    @Column(name = "remaining_points", nullable = false, precision = 18, scale = 2)
    private BigDecimal remainingPoints;

    @Column(name = "earned_at", nullable = false)
    @Builder.Default
    private Instant earnedAt = Instant.now();

    @Column(name = "expired_at", nullable = false)
    private Instant expiredAt;

    @Column(name = "source_ref", length = 100)
    private String sourceRef;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private BucketStatus status = BucketStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
