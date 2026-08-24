package com.natcash.loyalty.stream;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

@Component
public class LoyaltyStreamConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private static final Logger log = LoggerFactory.getLogger(LoyaltyStreamConsumer.class);
    public static final String CONSUMER_GROUP = "loyalty-worker-group";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public LoyaltyStreamConsumer(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onMessage(MapRecord<String, String, String> message) {
        String stream = message.getStream();
        RecordId recordId = message.getId();
        Map<String, String> value = message.getValue();

        try {
            log.info("[REDIS-STREAM-RECEIVE] stream={}, recordId={}, value={}", stream, recordId, value);

            String eventId = value.get("eventId");
            String tenantId = value.get("tenantId");
            String eventType = value.get("eventType");
            String externalUserId = value.get("externalUserId");
            String amountStr = value.get("amount");
            String transactionCode = value.get("transactionCode");
            String timestampStr = value.get("timestamp");
            String metadataStr = value.get("metadata");
            Map<String, String> metadata = null;
            if (metadataStr != null && !metadataStr.trim().isEmpty()) {
                try {
                    metadata = objectMapper.readValue(metadataStr, new TypeReference<Map<String, String>>() {});
                } catch (Exception ignored) {}
            }

            LoyaltyStreamEvent event = LoyaltyStreamEvent.builder()
                    .eventId(eventId)
                    .tenantId(tenantId)
                    .eventType(eventType)
                    .externalUserId(externalUserId)
                    .amount(amountStr != null && !amountStr.isEmpty() ? Long.parseLong(amountStr) : 0L)
                    .transactionCode(transactionCode)
                    .metadata(metadata)
                    .timestamp(timestampStr != null ? Instant.parse(timestampStr) : Instant.now())
                    .build();

            processEvent(event);

            // Xác nhận ACK sau khi xử lý thành công
            redisTemplate.opsForStream().acknowledge(stream, CONSUMER_GROUP, recordId);
            log.debug("[REDIS-STREAM-ACK] stream={}, recordId={}, eventId={}", stream, recordId, eventId);

        } catch (Exception e) {
            log.error("[REDIS-STREAM-PROCESS-ERROR] stream={}, recordId={}, error={}", stream, recordId, e.getMessage(), e);
        }
    }

    public void processEvent(LoyaltyStreamEvent event) {
        log.info("[LOYALTY-EVENT-PROCESSING] eventType={}, tenantId={}, user={}, amount={}",
                event.getEventType(), event.getTenantId(), event.getExternalUserId(), event.getAmount());
        // Xử lý tính điểm, cập nhật xếp hạng hoặc kích hoạt cột mốc bất đồng bộ
    }
}
