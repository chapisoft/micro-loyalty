package com.natcash.loyalty.engagement.entity;

import com.natcash.loyalty.domain.enums.TriggerType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "loyalty_communication_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunicationLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "account_id")
    private Long accountId;

    @Column(name = "external_user_id", nullable = false, length = 100)
    private String externalUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false, length = 50)
    private TriggerType triggerType;

    @Column(name = "channel", nullable = false, length = 30)
    private String channel; // IN_APP, PUSH, SMS, WEBHOOK

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "content", columnDefinition = "text", nullable = false)
    private String content;

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @PrePersist
    public void prePersist() {
        if (this.sentAt == null) {
            this.sentAt = Instant.now();
        }
        if (this.isRead == null) {
            this.isRead = false;
        }
    }
}
