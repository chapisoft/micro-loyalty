package com.natcash.loyalty.campaign.entity;

import com.natcash.loyalty.domain.enums.ControlBucketGroup;

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

import java.time.Instant;

@Entity
@Table(name = "campaign_control_groups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignControlGroupEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "campaign_code", nullable = false, length = 100)
    private String campaignCode;

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "bucket_group", nullable = false, length = 20)
    private ControlBucketGroup bucketGroup;

    @Column(name = "hash_bucket", nullable = false)
    private Integer hashBucket;

    @CreationTimestamp
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private Instant assignedAt;
}
