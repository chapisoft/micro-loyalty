package com.natcash.loyalty.outbox.entity;

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
@Table(name = "webhook_dead_letter")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookDeadLetterEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String payload;

    @Column(name = "target_url", nullable = false, length = 500)
    private String targetUrl;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "failed_at", nullable = false)
    private Instant failedAt;

    @PrePersist
    public void prePersist() {
        if (this.failedAt == null) {
            this.failedAt = Instant.now();
        }
    }
}
