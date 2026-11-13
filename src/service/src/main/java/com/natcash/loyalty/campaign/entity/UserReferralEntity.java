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

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "user_referrals")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserReferralEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "referrer_user_id", nullable = false, length = 100)
    private String referrerUserId;

    @Column(name = "referee_user_id", length = 100)
    private String refereeUserId;

    @Column(name = "referee_phone", length = 30)
    private String refereePhone;

    @Column(name = "referral_code", nullable = false, length = 50)
    private String referralCode;

    @Column(name = "ekyc_verified", nullable = false)
    @Builder.Default
    private Boolean ekycVerified = Boolean.FALSE;

    @Column(name = "first_tx_completed", nullable = false)
    @Builder.Default
    private Boolean firstTxCompleted = Boolean.FALSE;

    @Column(name = "reward_points", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal rewardPoints = BigDecimal.ZERO;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "rewarded_at")
    private Instant rewardedAt;
}
