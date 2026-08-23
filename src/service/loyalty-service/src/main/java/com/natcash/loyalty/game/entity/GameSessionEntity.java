package com.natcash.loyalty.game.entity;

import com.natcash.loyalty.domain.enums.SessionStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "loyalty_game_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "game_id", nullable = false)
    private GameHubEntity game;

    @Column(name = "session_token", nullable = false, unique = true, length = 100)
    private String sessionToken;

    @Column(name = "turns_allocated", nullable = false)
    @Builder.Default
    private Integer turnsAllocated = 1;

    @Column(name = "turns_used", nullable = false)
    @Builder.Default
    private Integer turnsUsed = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private SessionStatus status = SessionStatus.INITIATED;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

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
            this.status = SessionStatus.INITIATED;
        }
        if (this.turnsAllocated == null) {
            this.turnsAllocated = 1;
        }
        if (this.turnsUsed == null) {
            this.turnsUsed = 0;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
