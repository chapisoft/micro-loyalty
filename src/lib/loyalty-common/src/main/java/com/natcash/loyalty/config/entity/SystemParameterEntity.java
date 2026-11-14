package com.natcash.loyalty.config.entity;

import com.natcash.loyalty.config.LoyaltyProperties;
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

import java.time.Instant;

@Entity
@Table(name = "system_parameters")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemParameterEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "param_key", nullable = false, length = 128)
    private String paramKey;

    @Column(name = "param_name", length = 255)
    private String paramName;

    @Column(name = "param_value", nullable = false, columnDefinition = "TEXT")
    private String paramValue;

    @Column(name = "value_type", nullable = false, length = 32)
    @Builder.Default
    private String valueType = LoyaltyProperties.get().getSystemParam().getDefaultValueType();

    @Column(name = "group_code", nullable = false, length = 64)
    @Builder.Default
    private String groupCode = LoyaltyProperties.get().getSystemParam().getDefaultGroupCode();

    @Column(name = "allowed_values", length = 500)
    private String allowedValues;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private CommonStatus status = CommonStatus.ACTIVE;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
