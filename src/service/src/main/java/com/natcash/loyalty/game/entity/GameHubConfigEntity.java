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

import java.time.Instant;

@Entity
@Table(name = "loyalty_game_hub_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameHubConfigEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, unique = true, length = 50)
    private String tenantId;

    @Column(name = "points_per_turn_exchange", nullable = false)
    @Builder.Default
    private Integer pointsPerTurnExchange = 50;

    @Column(name = "golden_hour_enabled", nullable = false)
    @Builder.Default
    private Boolean goldenHourEnabled = true;

    @Column(name = "maintenance_mode", nullable = false)
    @Builder.Default
    private Boolean maintenanceMode = false;

    @Column(name = "max_daily_turns_per_user", nullable = false)
    @Builder.Default
    private Integer maxDailyTurnsPerUser = 10;

    @Column(name = "welcome_banner_text", length = 500)
    @Builder.Default
    private String welcomeBannerText = "Tham gia minigame mỗi ngày nhận quà siêu khủng từ Natcash!";

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
        if (this.pointsPerTurnExchange == null) {
            this.pointsPerTurnExchange = 50;
        }
        if (this.goldenHourEnabled == null) {
            this.goldenHourEnabled = true;
        }
        if (this.maintenanceMode == null) {
            this.maintenanceMode = false;
        }
        if (this.maxDailyTurnsPerUser == null) {
            this.maxDailyTurnsPerUser = 10;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
