package com.natcash.loyalty.account.entity;

import com.natcash.loyalty.domain.enums.CommonStatus;

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
import java.time.LocalDate;

@Entity
@Table(name = "loyalty_accounts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyAccountEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tier_id")
    private LoyaltyTierEntity tier;

    @Column(name = "current_points", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal currentPoints = BigDecimal.ZERO;

    @Column(name = "tier_points", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal tierPoints = BigDecimal.ZERO;

    @Column(name = "tier_updated_at")
    private Instant tierUpdatedAt;

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
        if (this.currentPoints == null) {
            this.currentPoints = BigDecimal.ZERO;
        }
        if (this.tierPoints == null) {
            this.tierPoints = BigDecimal.ZERO;
        }
        if (this.tierUpdatedAt == null) {
            this.tierUpdatedAt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
