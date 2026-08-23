package com.lib.ims.kafka.interceptor;

import com.lib.ims.kafka.service.OutboxEventPublisher;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Metrics;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import org.apache.kafka.clients.producer.ProducerInterceptor;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;



public class CustomProducerInterceptor implements ProducerInterceptor<String, Object> {
   private static final Logger log = LoggerFactory.getLogger(CustomProducerInterceptor.class);
   private static final String METRIC_PREFIX = "ims.kafka.producer.interceptor.";
   private final Counter recordsSentAttemptTotal = Metrics.counter(METRIC_PREFIX + "records.send.attempt.total", new String[]{"description", "Tổng số bản ghi đã cố gắng gửi bởi producer interceptor"});
   private final Counter recordsSentSuccessTotal = Metrics.counter(METRIC_PREFIX + "records.send.success.total", new String[]{"description", "Tổng số bản ghi đã được xác nhận thành công tại producer interceptor"});
   private final Counter recordsSentFailureTotal = Metrics.counter(METRIC_PREFIX + "records.send.failure.total", new String[]{"description", "Tổng số bản ghi không được xác nhận tại producer interceptor"});

   public ProducerRecord<String, Object> onSend(ProducerRecord<String, Object> record) {
      this.recordsSentAttemptTotal.increment();
      String clientMessageId = MDC.get("clientMessageId");
      if (clientMessageId == null || clientMessageId.isEmpty()) {
         log.warn("CustomProducerInterceptor: Không tìm thấy clientMessageId trong MDC, đang tạo một ID mới.");
         clientMessageId = UUID.randomUUID().toString();
         MDC.put("clientMessageId", clientMessageId);
      }

      record.headers().add("clientMessageId", clientMessageId.getBytes(StandardCharsets.UTF_8));
      String transactionId = UUID.randomUUID().toString();
      record.headers().add("transactionId", transactionId.getBytes(StandardCharsets.UTF_8));
      log.info("CustomProducerInterceptor: Đang gửi tin nhắn. Chủ đề: {}, ClientMessageId: {}, TransactionId: {}", new Object[]{record.topic(), clientMessageId, transactionId});
      return record;
   }

   public void onAcknowledgement(RecordMetadata metadata, Exception exception) {
      if (exception == null) {
         this.recordsSentSuccessTotal.increment();
         log.info("CustomProducerInterceptor: Tin nhắn đã được xác nhận. Chủ đề: {}, Partition: {}, Offset: {}", new Object[]{metadata.topic(), metadata.partition(), metadata.offset()});
      } else {
         this.recordsSentFailureTotal.increment();
         log.error("CustomProducerInterceptor: Gửi tin nhắn thất bại. Chủ đề: {}. Lỗi: {}", new Object[]{metadata != null ? metadata.topic() : "KHÔNG RÕ", exception.getMessage(), exception});
      }

   }

   public void close() {
      log.info("CustomProducerInterceptor: Đang đóng producer interceptor.");
   }

   public void configure(Map<String, ?> configs) {
      log.debug("CustomProducerInterceptor: Đang cấu hình producer interceptor với configs: {}", configs);
      Object publisher = configs.get("outbox.event.publisher.instance");
      if (publisher instanceof OutboxEventPublisher) {
         log.info("CustomProducerInterceptor: Đã cấu hình thành công OutboxEventPublisher instance qua configs.");
      } else {
         log.warn("CustomProducerInterceptor: Không tìm thấy OutboxEventPublisher instance trong configs hoặc kiểu không khớp.");
      }

   }
}
