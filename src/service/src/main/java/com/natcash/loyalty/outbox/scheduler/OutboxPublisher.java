package com.natcash.loyalty.outbox.scheduler;

import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.WebhookStatus;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.outbox.entity.WebhookOutboxEntity;
import com.natcash.loyalty.outbox.repository.WebhookOutboxRepository;
import com.natcash.loyalty.outbox.service.OutboxService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;

@Component
public class OutboxPublisher {

    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);
    private static final int BATCH_SIZE = 50;

    private final WebhookOutboxRepository outboxRepository;
    private final OutboxService outboxService;
    private final DistributedLockHelper lockHelper;
    private final RestTemplate restTemplate;

    public OutboxPublisher(WebhookOutboxRepository outboxRepository,
                           OutboxService outboxService,
                           DistributedLockHelper lockHelper) {
        this.outboxRepository = outboxRepository;
        this.outboxService = outboxService;
        this.lockHelper = lockHelper;
        this.restTemplate = new RestTemplate();
    }

    @Scheduled(fixedDelay = 1000)
    public void publishPendingEvents() {
        boolean acquired = lockHelper.tryLock(RedisKeys.LOCK_OUTBOX_PUBLISHER, 500L, 5000L);
        if (!acquired) {
            log.trace("[OUTBOX-PUBLISHER-SKIP] Node khác đang thực thi");
            return;
        }

        try {
            List<WebhookOutboxEntity> pendingEvents = outboxRepository.findPendingEvents(
                    WebhookStatus.PENDING,
                    Instant.now(),
                    PageRequest.of(0, BATCH_SIZE)
            );

            if (pendingEvents.isEmpty()) {
                return;
            }

            log.info("[OUTBOX-PUBLISHER-RUN] Đang xử lý {} sự kiện", pendingEvents.size());

            for (WebhookOutboxEntity event : pendingEvents) {
                dispatchWebhook(event);
            }
        } catch (Exception e) {
            log.error("[OUTBOX-PUBLISHER-ERROR] Lỗi khi quét tiến trình outbox: {}", e.getMessage(), e);
        } finally {
            lockHelper.unlock(RedisKeys.LOCK_OUTBOX_PUBLISHER);
        }
    }

    public void dispatchWebhook(WebhookOutboxEntity event) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Tenant-Id", event.getTenantId());
            headers.set("X-Event-Type", event.getEventType());
            headers.set("X-Timestamp", String.valueOf(System.currentTimeMillis() / 1000L));

            HttpEntity<String> request = new HttpEntity<>(event.getPayload(), headers);
            ResponseEntity<String> response = restTemplate.postForEntity(event.getTargetUrl(), request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                outboxService.markSuccess(event.getId());
                log.info("[OUTBOX-DISPATCH-SUCCESS] id={}, url={}", event.getId(), event.getTargetUrl());
            } else {
                outboxService.handleFailure(event.getId(), "HTTP Status: " + response.getStatusCode().value());
            }
        } catch (Exception e) {
            log.warn("[OUTBOX-DISPATCH-FAIL] id={}, url={}, error={}", event.getId(), event.getTargetUrl(), e.getMessage());
            outboxService.handleFailure(event.getId(), e.getMessage());
        }
    }
}
