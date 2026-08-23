package com.lib.ims.kafka.service.impl;

import com.lib.ims.kafka.service.MessageProducer;
import com.lib.ims.kafka.service.OutboxEventPublisher;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import lombok.Generated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;


@Service
@SuppressWarnings({"unchecked", "rawtypes", "null"})
public class KafkaMessageProducer<T> implements MessageProducer<T> {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(KafkaMessageProducer.class);
   private final KafkaTemplate<String, T> kafkaTemplate;
   private final OutboxEventPublisher outboxEventPublisher;

   public KafkaMessageProducer(KafkaTemplate<String, T> kafkaTemplate, OutboxEventPublisher outboxEventPublisher) {
      this.kafkaTemplate = kafkaTemplate;
      this.outboxEventPublisher = outboxEventPublisher;
   }

   public void send(String topic, T message) {
      this.send(topic, message, (Map)null);
   }

   public void send(String topic, T message, Map<String, Object> headers) {
      String eventId = null;
      if (headers != null && headers.get("event-id") instanceof String) {
         eventId = (String)headers.get("event-id");
      }

      String finalEventId = eventId;

      try {
         MessageBuilder<T> messageBuilder = MessageBuilder.withPayload(message).copyHeaders(headers).setHeader("kafka_topic", topic);
         if (headers != null && headers.containsKey("kafka_messageKey")) {
            messageBuilder.setHeader("kafka_messageKey", headers.get("kafka_messageKey"));
         }

         String clientMessageId = MDC.get("clientMessageId");
         if (clientMessageId == null || clientMessageId.isEmpty()) {
            log.warn("KafkaMessageProducer: Không tìm thấy clientMessageId trong MDC, đang tạo một ID mới.");
            clientMessageId = UUID.randomUUID().toString();
            MDC.put("clientMessageId", clientMessageId);
         }

         messageBuilder.setHeader("clientMessageId", clientMessageId);
         messageBuilder.setHeader("transactionId", UUID.randomUUID().toString());
         messageBuilder.setHeader("kafka_timestamp", System.currentTimeMillis());
         Message<T> kafkaMessage = messageBuilder.build();
         CompletableFuture<SendResult<String, T>> future = this.kafkaTemplate.send(kafkaMessage);
         future.whenComplete((result, ex) -> {
            boolean success = ex == null;
            String errorMessage = ex != null ? ex.getMessage() : "Lỗi không xác định";
            if (finalEventId != null) {
               this.outboxEventPublisher.updateOutboxEventStatus(finalEventId, success, errorMessage);
               if (success) {
                  log.info("Trạng thái sự kiện outbox '{}' đã được cập nhật là {}, chủ đề: {}, key: {}", new Object[]{finalEventId, "THÀNH CÔNG", topic, kafkaMessage.getHeaders().get("kafka_messageKey")});
               } else {
                  log.error("Trạng thái sự kiện outbox '{}' đã được cập nhật là {}. Lỗi: {}. Chủ đề: {}, key: {}", new Object[]{finalEventId, "THẤT BẠI", errorMessage, topic, kafkaMessage.getHeaders().get("kafka_messageKey")});
               }
            } else {
               log.warn("Không có eventId để cập nhật trạng thái outbox sau khi gửi tới chủ đề: {}, key: {}. Thành công: {}", new Object[]{topic, kafkaMessage.getHeaders().get("kafka_messageKey"), success});
            }

         });
         log.info("Tin nhắn (event-id: {}) kèm headers đã được yêu cầu gửi tới chủ đề: {}, key: {}", new Object[]{finalEventId, topic, kafkaMessage.getHeaders().get("kafka_messageKey")});
      } catch (Exception var10) {
         log.error("Gửi tin nhắn (event-id: {}) kèm headers tới chủ đề {} thất bại", new Object[]{eventId, topic, var10});
         if (eventId != null) {
            this.outboxEventPublisher.updateOutboxEventStatus(eventId, false, var10.getMessage());
         }

         throw new RuntimeException("Gửi tin nhắn kèm headers thất bại", var10);
      }
   }
}
