package com.natcash.loyalty.agent.entity;

import com.natcash.loyalty.domain.enums.AgentKpiRewardStatus;

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
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "super_agent_network_kpis")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuperAgentNetworkKpiEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "super_agent_id", nullable = false)
    private Long superAgentId;

    @Column(name = "kpi_month", nullable = false, length = 10)
    private String kpiMonth;

    @Column(name = "total_sub_agents", nullable = false)
    @Builder.Default
    private Integer totalSubAgents = 0;

    @Column(name = "qualified_sub_agents", nullable = false)
    @Builder.Default
    private Integer qualifiedSubAgents = 0;

    @Column(name = "achievement_rate_pct", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal achievementRatePct = BigDecimal.ZERO;

    @Column(name = "min_rate_required_pct", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal minRateRequiredPct = new BigDecimal("50.00");

    @Column(name = "reward_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal rewardAmount = new BigDecimal("10000.00");

    @Enumerated(EnumType.STRING)
    @Column(name = "reward_status", nullable = false, length = 30)
    @Builder.Default
    private AgentKpiRewardStatus rewardStatus = AgentKpiRewardStatus.IN_PROGRESS;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
