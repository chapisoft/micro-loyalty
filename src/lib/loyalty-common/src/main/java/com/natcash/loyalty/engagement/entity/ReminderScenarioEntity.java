package com.natcash.loyalty.engagement.entity;

import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.CustomerSegmentCode;
import com.natcash.loyalty.domain.enums.NotificationChannel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "reminder_scenarios")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderScenarioEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "scenario_code", nullable = false, length = 80)
    private String scenarioCode;

    @Column(name = "scenario_name", nullable = false, length = 255)
    private String scenarioName;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_segment", nullable = false, length = 50)
    @Builder.Default
    private CustomerSegmentCode targetSegment = CustomerSegmentCode.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false, length = 30)
    @Builder.Default
    private NotificationChannel channel = NotificationChannel.PUSH_NOTIFICATION;

    @Column(name = "trigger_event", nullable = false, length = 80)
    private String triggerEvent;

    @Column(name = "title_vi", length = 255)
    private String titleVi;

    @Column(name = "title_en", length = 255)
    private String titleEn;

    @Column(name = "title_fr", length = 255)
    private String titleFr;

    @Column(name = "title_ht", length = 255)
    private String titleHt;

    @Column(name = "body_vi", columnDefinition = "text")
    private String bodyVi;

    @Column(name = "body_en", columnDefinition = "text")
    private String bodyEn;

    @Column(name = "body_fr", columnDefinition = "text")
    private String bodyFr;

    @Column(name = "body_ht", columnDefinition = "text")
    private String bodyHt;

    @Column(name = "deep_link", length = 300)
    private String deepLink;

    @Column(name = "cooldown_hours", nullable = false)
    @Builder.Default
    private Integer cooldownHours = 24;

    @Column(name = "is_marketing", nullable = false)
    @Builder.Default
    private Boolean isMarketing = Boolean.TRUE;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private CommonStatus status = CommonStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
