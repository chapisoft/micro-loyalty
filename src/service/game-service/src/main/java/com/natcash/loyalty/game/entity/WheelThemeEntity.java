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
@Table(name = "loyalty_wheel_themes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WheelThemeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "theme_code", nullable = false, length = 50)
    private String themeCode;

    @Column(name = "theme_name", nullable = false, length = 100)
    private String themeName;

    @Column(name = "primary_color", nullable = false, length = 30)
    @Builder.Default
    private String primaryColor = "#E65100";

    @Column(name = "secondary_color", nullable = false, length = 30)
    @Builder.Default
    private String secondaryColor = "#FFD54F";

    @Column(name = "accent_color", nullable = false, length = 30)
    @Builder.Default
    private String accentColor = "#FFFFFF";

    @Column(name = "background_url", length = 500)
    private String backgroundUrl;

    @Column(name = "pointer_url", length = 500)
    private String pointerUrl;

    @Column(name = "center_button_url", length = 500)
    private String centerButtonUrl;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = false;

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
        if (this.isActive == null) {
            this.isActive = false;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
