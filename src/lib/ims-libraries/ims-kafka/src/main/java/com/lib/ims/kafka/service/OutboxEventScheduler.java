package com.lib.ims.kafka.service;

import com.lib.ims.kafka.config.OutboxKafkaProperties;
import com.lib.ims.kafka.entity.OutboxEvent;
import com.lib.ims.kafka.repository.OutboxEventRepository;
import com.lib.ims.kafka.service.impl.KafkaMessageProducer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;


@Service
@SuppressWarnings({"unchecked", "rawtypes"})
public class OutboxEventScheduler {
   private static final Logger log = LoggerFactory.getLogger(OutboxEventScheduler.class);
   private final KafkaMessageProducer<Object> kafkaMessageProducer;
   private final OutboxEventRepository repository;
   private final OutboxKafkaProperties properties;
   private final ExecutorService executorService;
   private final AtomicBoolean isProcessing = new AtomicBoolean(false);

   public OutboxEventScheduler(KafkaMessageProducer<Object> kafkaMessageProducer, OutboxEventRepository repository, OutboxKafkaProperties properties) {
      this.kafkaMessageProducer = kafkaMessageProducer;
      this.repository = repository;
      this.properties = properties;
      this.executorService = Executors.newCachedThreadPool();
   }

   @Scheduled(
      fixedRateString = "${ims.kafka.outbox.pollingInterval:5000}"
   )
   public void processOutboxEvents() {
      if (!this.isProcessing.compareAndSet(false, true)) {
         log.warn("Scheduler đang chạy, bỏ qua lần thực thi này");
      } else {
         try {
            if (this.properties.isEnabled()) {
               log.debug("Bắt đầu xử lý sự kiện outbox. Kích thước batch: {}", this.properties.getBatchSize());
               List<OutboxEvent> pendingEvents = this.repository.findPendingEvents(OutboxEvent.EventStatus.PENDING, Pageable.ofSize(this.properties.getBatchSize()));
               if (pendingEvents.isEmpty()) {
                  return;
               }

               log.debug("Tìm thấy {} sự kiện đang chờ xử lý", pendingEvents.size());
               this.processBatchEvents(pendingEvents);
               return;
            }
         } finally {
            this.isProcessing.set(false);
         }

      }
   }

   private void processBatchEvents(List<OutboxEvent> events) {
      CompletableFuture<?>[] futures = (CompletableFuture[])events.stream().map((event) -> {
         return CompletableFuture.runAsync(() -> {
            this.processEvent(event);
         }, this.executorService);
      }).toArray((x$0) -> {
         return new CompletableFuture[x$0];
      });
      CompletableFuture.allOf(futures).join();
      log.debug("Hoàn thành xử lý batch {} events", events.size());
   }

   private void processEvent(OutboxEvent event) {
      log.debug("Đang xử lý sự kiện outbox: {}, loại: {}, khóa phân vùng: {}", new Object[]{event.getId(), event.getEventType(), event.getPartitionKey()});
      Map<String, Object> headers = new HashMap();
      headers.put("event-id", event.getId());
      if (event.getPartitionKey() != null && !event.getPartitionKey().isEmpty()) {
         headers.put("kafka_messageKey", event.getPartitionKey());
      }

      String topic = event.getTopic();
      this.kafkaMessageProducer.send(topic, event.getPayload(), headers);
   }
}
