package com.natcash.loyalty.clearing.entity;

import com.natcash.loyalty.domain.enums.ClearingStatus;

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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "loyalty_clearinghouse_settlements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyClearinghouseSettlementEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "partner_id", nullable = false)
    private Long partnerId;

    @Column(name = "period", nullable = false, length = 20)
    private String period;

    @Column(name = "total_points_issued", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalPointsIssued = BigDecimal.ZERO;

    @Column(name = "total_points_redeemed", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalPointsRedeemed = BigDecimal.ZERO;

    @Column(name = "net_points", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal netPoints = BigDecimal.ZERO;

    @Column(name = "net_settlement_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal netSettlementAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ClearingStatus status = ClearingStatus.PENDING;

    @Column(name = "settled_at")
    private Instant settledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
