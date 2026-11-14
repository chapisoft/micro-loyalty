package com.natcash.loyalty.engagement.entity;

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
@Table(name = "user_notification_preferences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserNotificationPreferenceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @Column(name = "opt_out_marketing", nullable = false)
    @Builder.Default
    private Boolean optOutMarketing = Boolean.FALSE;

    @Column(name = "allow_push", nullable = false)
    @Builder.Default
    private Boolean allowPush = Boolean.TRUE;

    @Column(name = "allow_sms", nullable = false)
    @Builder.Default
    private Boolean allowSms = Boolean.TRUE;

    @Column(name = "allow_in_app", nullable = false)
    @Builder.Default
    private Boolean allowInApp = Boolean.TRUE;

    @Column(name = "preferred_locale", length = 10)
    private String preferredLocale;

    @Column(name = "quiet_hours_enabled", nullable = false)
    @Builder.Default
    private Boolean quietHoursEnabled = Boolean.TRUE;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
