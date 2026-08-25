package com.natcash.loyalty.account.entity;

import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.PartnerType;

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
@Table(name = "loyalty_partners")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyPartnerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "partner_code", nullable = false, length = 50)
    private String partnerCode;

    @Column(name = "partner_name", nullable = false)
    private String partnerName;

    @Enumerated(EnumType.STRING)
    @Column(name = "partner_type", nullable = false, length = 50)
    @Builder.Default
    private PartnerType partnerType = PartnerType.RETAIL;

    @Column(name = "api_key", nullable = false, length = 100)
    private String apiKey;

    @Column(name = "secret_key", nullable = false)
    private String secretKey;

    @Column(name = "webhook_secret")
    private String webhookSecret;

    @Column(name = "webhook_url", length = 500)
    private String webhookUrl;

    @Column(name = "ip_whitelist")
    private String ipWhitelist;

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
