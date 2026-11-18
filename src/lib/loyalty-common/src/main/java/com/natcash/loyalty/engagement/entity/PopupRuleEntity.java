package com.natcash.loyalty.engagement.entity;

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
@Table(name = "popup_rules")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopupRuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "rule_code", nullable = false, length = 60)
    private String ruleCode;

    @Column(name = "popup_type", nullable = false, length = 40)
    private String popupType;

    @Column(name = "priority", nullable = false)
    @Builder.Default
    private Integer priority = 1;

    @Column(name = "threshold_days")
    private Integer thresholdDays;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "body", length = 500)
    private String body;

    @Column(name = "cta_label", length = 100)
    private String ctaLabel;

    @Column(name = "deep_link", length = 300)
    private String deepLink;

    @Column(name = "segment_code", nullable = false, length = 80)
    @Builder.Default
    private String segmentCode = "ALL";

    @Column(name = "window_start_hour", nullable = false)
    @Builder.Default
    private Integer windowStartHour = 8;

    @Column(name = "window_end_hour", nullable = false)
    @Builder.Default
    private Integer windowEndHour = 20;

    @Column(name = "cooldown_hours", nullable = false)
    @Builder.Default
    private Integer cooldownHours = 24;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private Boolean enabled = Boolean.TRUE;

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
