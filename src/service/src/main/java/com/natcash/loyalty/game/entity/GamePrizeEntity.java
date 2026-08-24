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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "loyalty_game_prizes", uniqueConstraints = {
        @UniqueConstraint(name = "uq_game_prize", columnNames = {"tenant_id", "game_code", "prize_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GamePrizeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "game_code", nullable = false, length = 50)
    private String gameCode;

    @Column(name = "prize_code", nullable = false, length = 50)
    private String prizeCode;

    @Column(name = "prize_name", nullable = false, length = 100)
    private String prizeName;

    @Enumerated(EnumType.STRING)
    @Column(name = "prize_type", nullable = false, length = 50)
    @Builder.Default
    private PrizeType prizeType = PrizeType.POINTS;

    @Column(name = "prize_value", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal prizeValue = BigDecimal.ZERO;

    @Column(name = "probability_weight", nullable = false)
    @Builder.Default
    private Integer probabilityWeight = 10;

    @Column(name = "color_code", length = 30)
    private String colorCode;

    @Column(name = "icon_symbol", length = 50)
    private String iconSymbol;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
