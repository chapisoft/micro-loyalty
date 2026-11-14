package com.natcash.loyalty.device.entity;

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
@Table(name = "partner_user_devices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerUserDeviceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "partner_code", nullable = false, length = 50)
    private String partnerCode;

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @Column(name = "device_id", nullable = false, length = 150)
    private String deviceId;

    @Column(name = "fcm_token", nullable = false, columnDefinition = "TEXT")
    private String fcmToken;

    @Column(name = "device_type", length = 20)
    private String deviceType;

    @Column(name = "app_version", length = 30)
    private String appVersion;

    @Column(name = "language", length = 10)
    private String language;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
