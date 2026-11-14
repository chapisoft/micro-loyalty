package com.natcash.loyalty.agent.entity;

import com.natcash.loyalty.domain.enums.AgentRoleType;
import com.natcash.loyalty.domain.enums.CommonStatus;

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
@Table(name = "agent_loyalty_programs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentLoyaltyProgramEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "agent_code", nullable = false, length = 80)
    private String agentCode;

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_role", nullable = false, length = 30)
    @Builder.Default
    private AgentRoleType agentRole = AgentRoleType.AGENT;

    @Column(name = "super_agent_id")
    private Long superAgentId;

    @Column(name = "province", length = 100)
    private String province;

    @Column(name = "monthly_customer_target", nullable = false)
    @Builder.Default
    private Integer monthlyCustomerTarget = 100;

    @Column(name = "reward_amount_htg", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal rewardAmountHtg = new BigDecimal("2000.00");

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
