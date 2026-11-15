package com.natcash.loyalty.campaign.entity;

import com.natcash.loyalty.domain.enums.CampaignMissionCategory;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.SponsorType;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "campaign_rule_conditions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignRuleConditionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "campaign_code", nullable = false, length = 100)
    private String campaignCode;

    @Column(name = "campaign_name", nullable = false, length = 255)
    private String campaignName;

    @Enumerated(EnumType.STRING)
    @Column(name = "mission_category", nullable = false, length = 50)
    @Builder.Default
    private CampaignMissionCategory missionCategory = CampaignMissionCategory.TX_COUNT;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "when_event", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String whenEvent = "{}";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "if_conditions", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String ifConditions = "{}";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "then_rewards", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String thenRewards = "{}";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "limits_config", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String limitsConfig = "{}";

    @Enumerated(EnumType.STRING)
    @Column(name = "sponsor_type", nullable = false, length = 50)
    @Builder.Default
    private SponsorType sponsorType = SponsorType.PLATFORM;

    @Column(name = "partner_id")
    private Long partnerId;

    @Column(name = "start_date", nullable = false)
    private Instant startDate;

    @Column(name = "end_date", nullable = false)
    private Instant endDate;

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
