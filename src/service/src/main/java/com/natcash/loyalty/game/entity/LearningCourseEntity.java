package com.natcash.loyalty.game.entity;

import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.GameCategory;

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

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "learning_courses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningCourseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "course_code", nullable = false, length = 80)
    private String courseCode;

    @Column(name = "title_vi", nullable = false, length = 255)
    private String titleVi;

    @Column(name = "title_en", nullable = false, length = 255)
    private String titleEn;

    @Column(name = "title_fr", nullable = false, length = 255)
    private String titleFr;

    @Column(name = "title_ht", nullable = false, length = 255)
    private String titleHt;

    @Column(name = "description_vi", columnDefinition = "text")
    private String descriptionVi;

    @Column(name = "description_en", columnDefinition = "text")
    private String descriptionEn;

    @Column(name = "description_fr", columnDefinition = "text")
    private String descriptionFr;

    @Column(name = "description_ht", columnDefinition = "text")
    private String descriptionHt;

    @Enumerated(EnumType.STRING)
    @Column(name = "game_category", nullable = false, length = 40)
    @Builder.Default
    private GameCategory gameCategory = GameCategory.LEARNING_EDTECH;

    @Column(name = "level", nullable = false, length = 30)
    @Builder.Default
    private String level = "BEGINNER";

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(name = "total_questions", nullable = false)
    @Builder.Default
    private Integer totalQuestions = 5;

    @Column(name = "reward_tier1_points", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal rewardTier1Points = new BigDecimal("20.00");

    @Column(name = "reward_tier2_points", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal rewardTier2Points = new BigDecimal("50.00");

    @Column(name = "reward_tier3_points", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal rewardTier3Points = new BigDecimal("100.00");

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
