package com.natcash.loyalty.game.entity;

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

import java.time.Instant;

@Entity
@Table(name = "game_monthly_leaderboards")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameMonthlyLeaderboardEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "leaderboard_month", nullable = false, length = 10)
    private String leaderboardMonth;

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @Column(name = "display_name", length = 255)
    private String displayName;

    @Column(name = "total_score", nullable = false)
    @Builder.Default
    private Integer totalScore = 0;

    @Column(name = "games_played", nullable = false)
    @Builder.Default
    private Integer gamesPlayed = 0;

    @Column(name = "rank_position")
    private Integer rankPosition;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
