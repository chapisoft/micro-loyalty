package com.natcash.loyalty.engagement.entity;

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

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "customer_segment_members")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerSegmentMemberEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "segment_id", nullable = false)
    private Long segmentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "segment_code", nullable = false, length = 50)
    private CustomerSegmentCode segmentCode;

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @Column(name = "score", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal score = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private Instant assignedAt;
}
