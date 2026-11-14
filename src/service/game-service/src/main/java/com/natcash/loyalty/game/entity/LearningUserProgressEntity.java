package com.natcash.loyalty.game.entity;

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
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "learning_user_progress")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningUserProgressEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "attempt_no", nullable = false)
    @Builder.Default
    private Integer attemptNo = 1;

    @Column(name = "correct_count", nullable = false)
    @Builder.Default
    private Integer correctCount = 0;

    @Column(name = "total_questions", nullable = false)
    @Builder.Default
    private Integer totalQuestions = 0;

    @Column(name = "score", nullable = false)
    @Builder.Default
    private Integer score = 0;

    @Column(name = "points_awarded", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal pointsAwarded = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "completed_at", nullable = false, updatable = false)
    private Instant completedAt;
}
