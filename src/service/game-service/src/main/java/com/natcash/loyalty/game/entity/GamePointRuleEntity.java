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
@Table(name = "game_point_rules")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GamePointRuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "source_code", nullable = false, length = 50)
    private String sourceCode;

    @Column(name = "board_type", nullable = false, length = 30)
    @Builder.Default
    private String boardType = "ALL";

    @Column(name = "formula_type", nullable = false, length = 30)
    @Builder.Default
    private String formulaType = "FIXED";

    @Column(name = "base_pts", nullable = false)
    @Builder.Default
    private Integer basePts = 10;

    @Column(name = "score_divisor", nullable = false)
    @Builder.Default
    private Integer scoreDivisor = 1;

    @Column(name = "max_pts_per_action", nullable = false)
    @Builder.Default
    private Integer maxPtsPerAction = 200;

    @Column(name = "daily_cap_pts", nullable = false)
    @Builder.Default
    private Integer dailyCapPts = 500;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "description", length = 500)
    private String description;

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
