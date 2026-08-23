package com.natcash.loyalty.outbox;

import com.natcash.loyalty.domain.enums.WebhookStatus;
import com.natcash.loyalty.outbox.entity.WebhookDeadLetterEntity;
import com.natcash.loyalty.outbox.entity.WebhookOutboxEntity;
import com.natcash.loyalty.outbox.repository.WebhookDeadLetterRepository;
import com.natcash.loyalty.outbox.repository.WebhookOutboxRepository;
import com.natcash.loyalty.outbox.service.OutboxService;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OutboxServiceTest {

    @Mock
    private WebhookOutboxRepository outboxRepository;

    @Mock
    private WebhookDeadLetterRepository deadLetterRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private OutboxService outboxService;

    @BeforeEach
    void setUp() {
        outboxService = new OutboxService(outboxRepository, deadLetterRepository, objectMapper);
    }

    @Test
    @DisplayName("BE-07-UT-01: Ghi nhận sự kiện Outbox thành công vào CSDL với trạng thái PENDING")
    void testRecordEventSuccess() {
        WebhookOutboxEntity savedEntity = WebhookOutboxEntity.builder()
                .id(100L)
                .tenantId("TENANT_DELIMART")
                .eventType("LOYALTY_TIER_UPDATED")
                .payload("{\"tier\":\"GOLD\"}")
                .targetUrl("https://partner.delimart.com/webhook")
                .status(WebhookStatus.PENDING)
                .build();

        when(outboxRepository.save(any(WebhookOutboxEntity.class))).thenReturn(savedEntity);

        WebhookOutboxEntity result = outboxService.recordEvent(
                "TENANT_DELIMART",
                "LOYALTY_TIER_UPDATED",
                "{\"tier\":\"GOLD\"}",
                "https://partner.delimart.com/webhook"
        );

        assertNotNull(result);
        assertEquals(100L, result.getId());
        assertEquals(WebhookStatus.PENDING, result.getStatus());
        verify(outboxRepository, times(1)).save(any(WebhookOutboxEntity.class));
    }

    @Test
    @DisplayName("BE-07-UT-02: Đánh dấu thành công sự kiện khi Webhook nhận HTTP 200")
    void testMarkSuccess() {
        WebhookOutboxEntity entity = WebhookOutboxEntity.builder()
                .id(101L)
                .tenantId("TENANT_DELIMART")
                .eventType("POINT_REDEEMED")
                .status(WebhookStatus.PENDING)
                .build();

        when(outboxRepository.findById(101L)).thenReturn(Optional.of(entity));

        outboxService.markSuccess(101L);

        assertEquals(WebhookStatus.PROCESSED, entity.getStatus());
        verify(outboxRepository, times(1)).save(entity);
    }

    @Test
    @DisplayName("BE-07-UT-03: Thử lại 1 lần tăng retryCount và tính toán nextRetryAt")
    void testHandleFailureFirstTime() {
        WebhookOutboxEntity entity = WebhookOutboxEntity.builder()
                .id(102L)
                .tenantId("TENANT_DELIMART")
                .eventType("POINT_REDEEMED")
                .retryCount(0)
                .maxRetries(5)
                .status(WebhookStatus.PENDING)
                .build();

        when(outboxRepository.findById(102L)).thenReturn(Optional.of(entity));

        outboxService.handleFailure(102L, "Connection Timeout 504");

        assertEquals(1, entity.getRetryCount());
        assertEquals("Connection Timeout 504", entity.getLastError());
        assertEquals(WebhookStatus.PENDING, entity.getStatus());
        verify(outboxRepository, times(1)).save(entity);
    }

    @Test
    @DisplayName("BE-07-UT-04: Quá 5 lần lỗi chuyển sang WEBHOOK_DEAD_LETTER và gán trạng thái FAILED")
    void testHandleFailureExhaustedMovesToDeadLetter() {
        WebhookOutboxEntity entity = WebhookOutboxEntity.builder()
                .id(103L)
                .tenantId("TENANT_DELIMART")
                .eventType("POINT_REDEEMED")
                .payload("{\"points\":1000}")
                .targetUrl("https://partner.delimart.com/webhook")
                .retryCount(4)
                .maxRetries(5)
                .status(WebhookStatus.PENDING)
                .build();

        when(outboxRepository.findById(103L)).thenReturn(Optional.of(entity));

        outboxService.handleFailure(103L, "Host Unreachable 503");

        assertEquals(5, entity.getRetryCount());
        assertEquals(WebhookStatus.FAILED, entity.getStatus());
        verify(outboxRepository, times(1)).save(entity);

        ArgumentCaptor<WebhookDeadLetterEntity> deadLetterCaptor = ArgumentCaptor.forClass(WebhookDeadLetterEntity.class);
        verify(deadLetterRepository, times(1)).save(deadLetterCaptor.capture());

        WebhookDeadLetterEntity captured = deadLetterCaptor.getValue();
        assertEquals("TENANT_DELIMART", captured.getTenantId());
        assertEquals("POINT_REDEEMED", captured.getEventType());
        assertEquals(5, captured.getRetryCount());
        assertEquals("Host Unreachable 503", captured.getErrorMessage());
    }
}
