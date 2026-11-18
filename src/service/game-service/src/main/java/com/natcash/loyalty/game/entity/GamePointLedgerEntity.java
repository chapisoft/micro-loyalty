package com.natcash.loyalty.game.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "game_point_ledger")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GamePointLedgerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @Column(name = "source_code", nullable = false, length = 50)
    private String sourceCode;

    @Column(name = "board_type", nullable = false, length = 30)
    @Builder.Default
    private String boardType = "ALL";

    @Column(name = "game_code", length = 100)
    private String gameCode;

    @Column(name = "reference_code", length = 120)
    private String referenceCode;

    @Column(name = "pts_awarded", nullable = false)
    private Integer ptsAwarded;

    @Column(name = "earned_date", nullable = false)
    private LocalDate earnedDate;

    @Column(name = "leaderboard_month", nullable = false, length = 10)
    private String leaderboardMonth;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
