package com.natcash.loyalty.stream;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.StreamOperations;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoyaltyStreamTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private StreamOperations<String, Object, Object> streamOperations;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private LoyaltyStreamProducer producer;
    private LoyaltyStreamConsumer consumer;

    @BeforeEach
    void setUp() {
        producer = new LoyaltyStreamProducer(redisTemplate, objectMapper);
        consumer = new LoyaltyStreamConsumer(redisTemplate, objectMapper);
    }

    @Test
    @DisplayName("BE-06-UT-01: Gửi sự kiện LOYALTY_EARN_EVENT vào Redis Streams thành công")
    void testPublishEventSuccess() {
        when(redisTemplate.opsForStream()).thenReturn(streamOperations);
        RecordId expectedRecordId = RecordId.of("1700000000000-0");
        when(streamOperations.add(any())).thenReturn(expectedRecordId);

        LoyaltyStreamEvent event = LoyaltyStreamEvent.builder()
                .tenantId("TENANT_DELIMART")
                .eventType("LOYALTY_EARN_EVENT")
                .externalUserId("CUST_8888")
                .amount(500000L)
                .transactionCode("TX_DELI_001")
                .timestamp(Instant.now())
                .build();

        RecordId recordId = producer.publishEvent(event);

        assertNotNull(recordId);
        assertEquals(expectedRecordId, recordId);
        verify(streamOperations, times(1)).add(any());
    }

    @Test
    @DisplayName("BE-06-UT-02: Nhận thông điệp từ Redis Streams và gọi ACK xác nhận")
    void testConsumerMessageAndAcknowledge() {
        when(redisTemplate.opsForStream()).thenReturn(streamOperations);

        Map<String, String> body = new HashMap<>();
        body.put("eventId", "EVT-1001");
        body.put("tenantId", "TENANT_DELIMART");
        body.put("eventType", "LOYALTY_EARN_EVENT");
        body.put("externalUserId", "CUST_8888");
        body.put("amount", "25000");
        body.put("transactionCode", "TX_002");
        body.put("timestamp", Instant.now().toString());

        MapRecord<String, String, String> record = StreamRecords.newRecord()
                .ofMap(body)
                .withStreamKey("loyalty.events.TENANT_DELIMART");

        consumer.onMessage(record);

        verify(streamOperations, times(1)).acknowledge(
                eq("loyalty.events.TENANT_DELIMART"),
                eq("loyalty-worker-group"),
                any(RecordId.class)
        );
    }
}
