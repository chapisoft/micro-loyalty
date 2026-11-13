package com.natcash.loyalty.campaign.entity;

import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.SponsorType;

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
@Table(name = "loyalty_monthly_budgets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyMonthlyBudgetEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "budget_month", nullable = false, length = 10)
    private String budgetMonth;

    @Enumerated(EnumType.STRING)
    @Column(name = "sponsor_type", nullable = false, length = 50)
    private SponsorType sponsorType;

    @Column(name = "partner_id")
    private Long partnerId;

    @Column(name = "budget_name", nullable = false, length = 255)
    private String budgetName;

    @Column(name = "budget_cap", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal budgetCap = BigDecimal.ZERO;

    @Column(name = "consumed_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal consumedAmount = BigDecimal.ZERO;

    @Column(name = "alert_80_sent", nullable = false)
    @Builder.Default
    private Boolean alert80Sent = Boolean.FALSE;

    @Column(name = "hard_stop_triggered", nullable = false)
    @Builder.Default
    private Boolean hardStopTriggered = Boolean.FALSE;

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
