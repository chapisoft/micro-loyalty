package com.natcash.loyalty.game.entity;

import com.natcash.loyalty.domain.enums.GameStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "loyalty_games")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameHubEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "game_code", nullable = false, length = 100)
    private String gameCode;

    @Column(name = "game_name", nullable = false, length = 255)
    private String gameName;

    @Column(name = "category", nullable = false, length = 50)
    private String category; // HTML5, QUIZ, MINI_GAME, LUCKY_WHEEL

    @Column(name = "price_per_turn", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal pricePerTurn = BigDecimal.ZERO;

    @Column(name = "free_turns_daily", nullable = false)
    @Builder.Default
    private Integer freeTurnsDaily = 1;

    @Column(name = "daily_budget_limit", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal dailyBudgetLimit = new BigDecimal("50000.00");

    @Column(name = "allow_points_spin", nullable = false)
    @Builder.Default
    private Boolean allowPointsSpin = true;

    @Column(name = "game_params", columnDefinition = "jsonb")
    private String gameParams;

    @Column(name = "game_url", length = 500)
    private String gameUrl;

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private GameStatus status = GameStatus.ACTIVE;

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
            this.status = GameStatus.ACTIVE;
        }
        if (this.pricePerTurn == null) {
            this.pricePerTurn = BigDecimal.ZERO;
        }
        if (this.freeTurnsDaily == null) {
            this.freeTurnsDaily = 1;
        }
        if (this.dailyBudgetLimit == null) {
            this.dailyBudgetLimit = new BigDecimal("50000.00");
        }
        if (this.allowPointsSpin == null) {
            this.allowPointsSpin = true;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
