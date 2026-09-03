package com.natcash.loyalty.audit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "system_audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemAuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "module", nullable = false, length = 50)
    private String module;

    @Column(name = "table_name", nullable = false, length = 100)
    private String tableName;

    @Column(name = "operation", nullable = false, length = 50)
    private String operation;

    @Column(name = "entity_id", nullable = false, length = 100)
    private String entityId;

    @Column(name = "actor_username", nullable = false, length = 100)
    private String actorUsername;

    @Column(name = "actor_role", length = 100)
    private String actorRole;

    @Column(name = "client_ip", length = 100)
    private String clientIp;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "before_data", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String beforeData;

    @Column(name = "after_data", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String afterData;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "SUCCESS";

    @Column(name = "execution_time_ms")
    @Builder.Default
    private Long executionTimeMs = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.status == null) {
            this.status = "SUCCESS";
        }
    }
}
