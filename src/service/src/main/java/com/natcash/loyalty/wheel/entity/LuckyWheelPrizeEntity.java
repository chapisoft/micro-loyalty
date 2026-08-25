package com.natcash.loyalty.wheel.entity;

import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.PrizeType;

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

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "loyalty_wheel_prizes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LuckyWheelPrizeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wheel_id", nullable = false)
    private LuckyWheelEntity wheel;

    @Column(name = "prize_name", nullable = false, length = 255)
    private String prizeName;

    @Enumerated(EnumType.STRING)
    @Column(name = "prize_type", nullable = false, length = 50)
    private PrizeType prizeType; // POINTS, VOUCHER, CASHBACK, PHYSICAL_GIFT, NO_LUCK

    @Column(name = "prize_value", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal prizeValue = BigDecimal.ZERO;

    @Column(name = "probability_weight", nullable = false)
    @Builder.Default
    private Integer probabilityWeight = 10; // Trọng số xác suất (vd: tổng 100)

    @Column(name = "daily_budget_limit", precision = 18, scale = 2)
    private BigDecimal dailyBudgetLimit; // Hạn mức chi trả tối đa trong ngày

    @Column(name = "weekly_budget_limit", precision = 18, scale = 2)
    private BigDecimal weeklyBudgetLimit; // Hạn mức chi trả tối đa trong tuần

    @Column(name = "monthly_budget_limit", precision = 18, scale = 2)
    private BigDecimal monthlyBudgetLimit; // Hạn mức chi trả tối đa trong tháng

    @Column(name = "daily_max_winners")
    private Integer dailyMaxWinners; // Số lượt trúng tối đa trong ngày

    @Column(name = "weekly_max_winners")
    private Integer weeklyMaxWinners; // Số lượt trúng tối đa trong tuần

    @Column(name = "monthly_max_winners")
    private Integer monthlyMaxWinners; // Số lượt trúng tối đa trong tháng

    @Column(name = "name_vi", length = 255)
    private String nameVi; // Tên giải tiếng Việt

    @Column(name = "name_en", length = 255)
    private String nameEn; // Tên giải tiếng Anh

    @Column(name = "name_fr", length = 255)
    private String nameFr; // Tên giải tiếng Pháp

    @Column(name = "name_ht", length = 255)
    private String nameHt; // Tên giải tiếng Haiti Creole

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 1; // Vị trí trên nan quạt (1..8 hoặc 1..12)

    @Column(name = "color_code", length = 30)
    private String colorCode; // Mã màu hex: #FFD700, #FF6B6B...

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(name = "icon_symbol", length = 50)
    @Builder.Default
    private String iconSymbol = "🎁";

    @Column(name = "bg_image_url", length = 500)
    private String bgImageUrl; // Hình ảnh nền của nan quạt

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private CommonStatus status = CommonStatus.ACTIVE;

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
            this.status = CommonStatus.ACTIVE;
        }
        if (this.prizeValue == null) {
            this.prizeValue = BigDecimal.ZERO;
        }
        if (this.probabilityWeight == null) {
            this.probabilityWeight = 10;
        }
        if (this.displayOrder == null) {
            this.displayOrder = 1;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
