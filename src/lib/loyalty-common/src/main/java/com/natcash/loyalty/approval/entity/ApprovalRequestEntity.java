package com.natcash.loyalty.approval.entity;

import com.natcash.loyalty.domain.enums.ApprovalActionType;
import com.natcash.loyalty.domain.enums.ApprovalStatus;
import com.natcash.loyalty.domain.enums.ApprovalTargetType;

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
@Table(name = "approval_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_code", nullable = false, unique = true, length = 80)
    private String requestCode;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 50)
    private ApprovalTargetType targetType;

    @Column(name = "target_id", nullable = false, length = 100)
    private String targetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 50)
    private ApprovalActionType actionType;

    @Column(name = "title", length = 255)
    private String title;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload_before", columnDefinition = "jsonb")
    private String payloadBefore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload_after", columnDefinition = "jsonb")
    private String payloadAfter;

    @Column(name = "maker_username", nullable = false, length = 100)
    private String makerUsername;

    @Column(name = "checker_username", length = 100)
    private String checkerUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @Column(name = "reason", columnDefinition = "text")
    private String reason;

    @Column(name = "reject_reason", columnDefinition = "text")
    private String rejectReason;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
