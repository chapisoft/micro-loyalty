package com.natcash.loyalty.partner.entity;

import com.natcash.loyalty.domain.enums.CommonStatus;

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
@Table(name = "partner_product_groups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerProductGroupEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "partner_id", nullable = false)
    private Long partnerId;

    @Column(name = "group_code", nullable = false, length = 80)
    private String groupCode;

    @Column(name = "group_name", nullable = false, length = 255)
    private String groupName;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "earn_rate_percent", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal earnRatePercent = BigDecimal.ONE;

    @Column(name = "max_burn_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal maxBurnPercentage = new BigDecimal("50.00");

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
