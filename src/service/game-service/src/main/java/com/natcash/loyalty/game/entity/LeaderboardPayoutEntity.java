package com.natcash.loyalty.game.entity;

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
@Table(name = "leaderboard_payouts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardPayoutEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "leaderboard_month", nullable = false, length = 10)
    private String leaderboardMonth;

    @Column(name = "board_type", nullable = false, length = 30)
    @Builder.Default
    private String boardType = "ALL";

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @Column(name = "display_name", length = 255)
    private String displayName;

    @Column(name = "rank_position", nullable = false)
    private Integer rankPosition;

    @Column(name = "total_pts", nullable = false)
    @Builder.Default
    private Integer totalPts = 0;

    @Column(name = "prize_id")
    private Long prizeId;

    @Column(name = "prize_label", length = 255)
    private String prizeLabel;

    @Column(name = "prize_type", length = 30)
    private String prizeType;

    @Column(name = "prize_value", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal prizeValue = BigDecimal.ZERO;

    @Column(name = "approval_status", nullable = false, length = 30)
    @Builder.Default
    private String approvalStatus = "PENDING_APPROVAL";

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "notified_at")
    private Instant notifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
