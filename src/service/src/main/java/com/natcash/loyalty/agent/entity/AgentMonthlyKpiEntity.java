package com.natcash.loyalty.agent.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "agent_monthly_kpis")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentMonthlyKpiEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "agent_id", nullable = false)
    private Long agentId;

    @Column(name = "kpi_month", nullable = false, length = 10)
    private String kpiMonth;

    @Column(name = "ekyc_count", nullable = false)
    @Builder.Default
    private Integer ekycCount = 0;

    @Column(name = "first_tx_count", nullable = false)
    @Builder.Default
    private Integer firstTxCount = 0;

    @Column(name = "qualified_customers", nullable = false)
    @Builder.Default
    private Integer qualifiedCustomers = 0;

    @Column(name = "target_customers", nullable = false)
    @Builder.Default
    private Integer targetCustomers = 100;

    @Column(name = "reward_eligible", nullable = false)
    @Builder.Default
    private Boolean rewardEligible = Boolean.FALSE;

    @Column(name = "reward_status", nullable = false, length = 30)
    @Builder.Default
    private String rewardStatus = "IN_PROGRESS";

    @Column(name = "reward_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal rewardAmount = BigDecimal.ZERO;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
