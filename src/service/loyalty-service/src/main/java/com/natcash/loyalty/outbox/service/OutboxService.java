package com.natcash.loyalty.outbox.service;

import com.natcash.loyalty.domain.enums.WebhookStatus;
import com.natcash.loyalty.outbox.entity.WebhookDeadLetterEntity;
import com.natcash.loyalty.outbox.entity.WebhookOutboxEntity;
import com.natcash.loyalty.outbox.repository.WebhookDeadLetterRepository;
import com.natcash.loyalty.outbox.repository.WebhookOutboxRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
public class OutboxService {

    private static final Logger log = LoggerFactory.getLogger(OutboxService.class);

    // Thời gian giãn cách thử lại theo cấp số nhân: 1 phút -> 5 phút -> 30 phút -> 2 giờ -> 6 giờ
    private static final Duration[] BACKOFF_DELAYS = new Duration[]{
            Duration.ofMinutes(1),
            Duration.ofMinutes(5),
            Duration.ofMinutes(30),
            Duration.ofHours(2),
            Duration.ofHours(6)
    };

    private final WebhookOutboxRepository outboxRepository;
    private final WebhookDeadLetterRepository deadLetterRepository;
    private final ObjectMapper objectMapper;

    public OutboxService(WebhookOutboxRepository outboxRepository,
                         WebhookDeadLetterRepository deadLetterRepository,
                         ObjectMapper objectMapper) {
        this.outboxRepository = outboxRepository;
        this.deadLetterRepository = deadLetterRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public WebhookOutboxEntity recordEvent(String tenantId, String eventType, Object payload, String targetUrl) {
        try {
            String payloadJson = (payload instanceof String) ? (String) payload : objectMapper.writeValueAsString(payload);

            WebhookOutboxEntity entity = WebhookOutboxEntity.builder()
                    .tenantId(tenantId)
                    .eventType(eventType)
                    .payload(payloadJson)
                    .targetUrl(targetUrl)
                    .retryCount(0)
                    .maxRetries(5)
                    .status(WebhookStatus.PENDING)
                    .nextRetryAt(Instant.now())
                    .build();

            WebhookOutboxEntity saved = outboxRepository.save(entity);
            log.info("[OUTBOX-RECORDED] id={}, tenantId={}, eventType={}, targetUrl={}",
                    saved.getId(), tenantId, eventType, targetUrl);
            return saved;
        } catch (Exception e) {
            log.error("[OUTBOX-RECORD-ERROR] tenantId={}, eventType={}, error={}", tenantId, eventType, e.getMessage(), e);
            throw new RuntimeException("Không thể ghi nhận sự kiện Outbox: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void markSuccess(Long eventId) {
        outboxRepository.findById(eventId).ifPresent(event -> {
            event.setStatus(WebhookStatus.PROCESSED);
            event.setLastError(null);
            outboxRepository.save(event);
            log.info("[OUTBOX-SUCCESS] id={}, eventType={}", eventId, event.getEventType());
        });
    }

    @Transactional
    public void handleFailure(Long eventId, String errorMessage) {
        outboxRepository.findById(eventId).ifPresent(event -> {
            int newRetryCount = event.getRetryCount() + 1;
            event.setRetryCount(newRetryCount);
            event.setLastError(errorMessage);

            if (newRetryCount >= event.getMaxRetries()) {
                event.setStatus(WebhookStatus.FAILED);
                outboxRepository.save(event);

                // Chuyển sang Dead Letter Queue
                WebhookDeadLetterEntity deadLetter = WebhookDeadLetterEntity.builder()
                        .tenantId(event.getTenantId())
                        .eventType(event.getEventType())
                        .payload(event.getPayload())
                        .targetUrl(event.getTargetUrl())
                        .retryCount(newRetryCount)
                        .errorMessage(errorMessage)
                        .failedAt(Instant.now())
                        .build();

                deadLetterRepository.save(deadLetter);
                log.warn("[OUTBOX-DEAD-LETTER] id={}, tenantId={}, retryCount={} - Đã chuyển sang dead letter",
                        eventId, event.getTenantId(), newRetryCount);
            } else {
                Duration delay = (newRetryCount - 1 < BACKOFF_DELAYS.length)
                        ? BACKOFF_DELAYS[newRetryCount - 1]
                        : BACKOFF_DELAYS[BACKOFF_DELAYS.length - 1];

                event.setStatus(WebhookStatus.PENDING);
                event.setNextRetryAt(Instant.now().plus(delay));
                outboxRepository.save(event);
                log.info("[OUTBOX-RETRY-SCHEDULED] id={}, retryCount={}, nextRetryIn={}s",
                        eventId, newRetryCount, delay.getSeconds());
            }
        });
    }
}
