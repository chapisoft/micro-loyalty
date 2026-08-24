package com.natcash.loyalty.game.entity;

import com.natcash.loyalty.domain.enums.PrizeType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "loyalty_game_play_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GamePlayHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @Column(name = "game_code", nullable = false, length = 100)
    private String gameCode;

    @Column(name = "session_token", length = 100)
    private String sessionToken;

    @Column(name = "transaction_ref", nullable = false, unique = true, length = 100)
    private String transactionRef;

    @Column(name = "score", nullable = false)
    @Builder.Default
    private Integer score = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "reward_type", nullable = false, length = 50)
    @Builder.Default
    private PrizeType rewardType = PrizeType.NO_LUCK;

    @Column(name = "reward_value", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal rewardValue = BigDecimal.ZERO;

    @Column(name = "points_awarded", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal pointsAwarded = BigDecimal.ZERO;

    @Column(name = "voucher_code", length = 100)
    private String voucherCode;

    @Column(name = "details", columnDefinition = "jsonb")
    private String details;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "SUCCESS";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.score == null) {
            this.score = 0;
        }
        if (this.rewardType == null) {
            this.rewardType = PrizeType.NO_LUCK;
        }
        if (this.rewardValue == null) {
            this.rewardValue = BigDecimal.ZERO;
        }
        if (this.pointsAwarded == null) {
            this.pointsAwarded = BigDecimal.ZERO;
        }
        if (this.status == null) {
            this.status = "SUCCESS";
        }
    }
}
