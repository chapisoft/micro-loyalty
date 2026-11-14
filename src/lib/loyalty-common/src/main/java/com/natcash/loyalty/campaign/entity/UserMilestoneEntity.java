package com.natcash.loyalty.campaign.entity;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.domain.enums.MilestoneStatus;

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
@Table(name = "loyalty_user_milestones")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserMilestoneEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private LoyaltyAccountEntity account;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "milestone_id", nullable = false)
    private CampaignMilestoneEntity milestone;

    @Column(name = "current_progress", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal currentProgress = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private MilestoneStatus status = MilestoneStatus.IN_PROGRESS;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "claimed_at")
    private Instant claimedAt;

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
            this.status = MilestoneStatus.IN_PROGRESS;
        }
        if (this.currentProgress == null) {
            this.currentProgress = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
