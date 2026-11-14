package com.natcash.loyalty.engagement.entity;

import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.CustomerSegmentCode;

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
@Table(name = "customer_segments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerSegmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "segment_code", nullable = false, length = 50)
    private CustomerSegmentCode segmentCode;

    @Column(name = "segment_name", nullable = false, length = 255)
    private String segmentName;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "criteria_json", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String criteriaJson = "{}";

    @Column(name = "member_count", nullable = false)
    @Builder.Default
    private Integer memberCount = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "banner_config", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String bannerConfig = "{}";

    @Column(name = "last_calculated_at")
    private Instant lastCalculatedAt;

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
