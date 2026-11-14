package com.natcash.loyalty.campaign.entity;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "ai_campaign_suggestions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCampaignSuggestionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "objective", nullable = false, length = 255)
    private String objective;

    @Column(name = "target_segment", length = 50)
    private String targetSegment;

    @Column(name = "budget_cap", precision = 18, scale = 2)
    private BigDecimal budgetCap;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "suggested_config", nullable = false, columnDefinition = "jsonb")
    private String suggestedConfig;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "conflicts_detected", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String conflictsDetected = "[]";

    @Column(name = "estimated_roi_pct", precision = 8, scale = 2)
    private BigDecimal estimatedRoiPct;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
