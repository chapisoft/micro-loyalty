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
@Table(name = "leaderboard_prizes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardPrizeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "board_type", nullable = false, length = 30)
    @Builder.Default
    private String boardType = "ALL";

    @Column(name = "rank_from", nullable = false)
    private Integer rankFrom;

    @Column(name = "rank_to", nullable = false)
    private Integer rankTo;

    @Column(name = "prize_type", nullable = false, length = 30)
    private String prizeType;

    @Column(name = "prize_label", nullable = false, length = 255)
    private String prizeLabel;

    @Column(name = "prize_value", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal prizeValue = BigDecimal.ZERO;

    @Column(name = "voucher_code", length = 100)
    private String voucherCode;

    @Column(name = "sponsor_name", length = 200)
    private String sponsorName;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

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
