package com.natcash.loyalty.stream;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class LoyaltyStreamProducer {

    private static final Logger log = LoggerFactory.getLogger(LoyaltyStreamProducer.class);
    private static final String STREAM_PREFIX = "loyalty.events.";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public LoyaltyStreamProducer(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public RecordId publishEvent(LoyaltyStreamEvent event) {
        if (event.getEventId() == null) {
            event.setEventId(UUID.randomUUID().toString());
        }
        if (event.getTimestamp() == null) {
            event.setTimestamp(java.time.Instant.now());
        }

        String streamKey = STREAM_PREFIX + event.getTenantId();

        try {
            Map<String, String> payloadMap = new HashMap<>();
            payloadMap.put("eventId", event.getEventId());
            payloadMap.put("tenantId", event.getTenantId());
            payloadMap.put("eventType", event.getEventType());
            payloadMap.put("externalUserId", event.getExternalUserId() != null ? event.getExternalUserId() : "");
            payloadMap.put("amount", event.getAmount() != null ? String.valueOf(event.getAmount()) : "0");
            payloadMap.put("transactionCode", event.getTransactionCode() != null ? event.getTransactionCode() : "");
            payloadMap.put("timestamp", event.getTimestamp().toString());
            if (event.getMetadata() != null) {
                payloadMap.put("metadata", objectMapper.writeValueAsString(event.getMetadata()));
            }

            RecordId recordId = redisTemplate.opsForStream().add(
                    StreamRecords.newRecord()
                            .ofMap(payloadMap)
                            .withStreamKey(streamKey)
            );

            log.info("[REDIS-STREAM-PUBLISH] streamKey={}, eventType={}, eventId={}, recordId={}",
                    streamKey, event.getEventType(), event.getEventId(), recordId);
            return recordId;
        } catch (Exception e) {
            log.error("[REDIS-STREAM-PUBLISH-ERROR] streamKey={}, eventType={}, error={}",
                    streamKey, event.getEventType(), e.getMessage(), e);
            throw new RuntimeException("Không thể gửi sự kiện vào Redis Streams: " + e.getMessage(), e);
        }
    }
}
