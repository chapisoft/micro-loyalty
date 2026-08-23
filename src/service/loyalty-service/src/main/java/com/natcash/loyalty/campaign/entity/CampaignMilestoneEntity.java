package com.natcash.loyalty.campaign.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "loyalty_campaign_milestones")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignMilestoneEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "campaign_code", nullable = false, length = 100)
    private String campaignCode;

    @Column(name = "campaign_name", nullable = false, length = 255)
    private String campaignName;

    @Column(name = "milestone_step", nullable = false)
    private Integer milestoneStep;

    @Column(name = "target_metric", nullable = false, length = 50)
    private String targetMetric; // BILL_AMOUNT, TRANSACTION_COUNT, EARN_POINTS, GAME_SPINS

    @Column(name = "target_value", nullable = false, precision = 18, scale = 2)
    private BigDecimal targetValue;

    @Column(name = "reward_points", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal rewardPoints = BigDecimal.ZERO;

    @Column(name = "reward_voucher_id")
    private Long rewardVoucherId;

    @Column(name = "reward_game_turns")
    @Builder.Default
    private Integer rewardGameTurns = 0;

    @Column(name = "start_date", nullable = false)
    private Instant startDate;

    @Column(name = "end_date", nullable = false)
    private Instant endDate;

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
        if (this.rewardPoints == null) {
            this.rewardPoints = BigDecimal.ZERO;
        }
        if (this.rewardGameTurns == null) {
            this.rewardGameTurns = 0;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
