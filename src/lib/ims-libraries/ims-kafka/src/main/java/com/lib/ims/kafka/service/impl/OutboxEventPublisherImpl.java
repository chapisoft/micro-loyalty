package com.lib.ims.kafka.service.impl;

import com.lib.ims.kafka.dto.EventDto;
import com.lib.ims.kafka.entity.OutboxEvent;
import com.lib.ims.kafka.repository.OutboxEventRepository;
import com.lib.ims.kafka.service.OutboxEventPublisher;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;


@Service
@SuppressWarnings({"unchecked", "rawtypes", "null"})
public class OutboxEventPublisherImpl implements OutboxEventPublisher {
   private static final Logger log = LoggerFactory.getLogger(OutboxEventPublisherImpl.class);
   private final OutboxEventRepository outboxRepository;
   private final ObjectMapper objectMapper;

   public OutboxEventPublisherImpl(OutboxEventRepository outboxRepository, ObjectMapper objectMapper) {
      this.outboxRepository = outboxRepository;
      this.objectMapper = objectMapper;
   }

   @Transactional(
      propagation = Propagation.MANDATORY
   )
   public void publishEvent(String topic, String eventType, Object eventData) {
      this.saveEvent(topic, eventType, eventType, eventData);
   }

   @Transactional(
      propagation = Propagation.MANDATORY
   )
   public void publishEvent(String topic, String eventType, String partitionKey, Object eventData) {
      this.saveEvent(topic, eventType, partitionKey, eventData);
   }

   @Transactional(
      propagation = Propagation.MANDATORY
   )
   public void publishEvents(EventDto event) {
      String partitionKey = event.getPartitionKey() != null ? event.getPartitionKey() : event.getEventType();
      this.saveEvent(event.getTopic(), event.getEventType(), partitionKey, event.getData());
   }

   @Transactional(
      propagation = Propagation.MANDATORY
   )
   public void publishEvents(List<EventDto> events) {
      if (events != null && !events.isEmpty()) {
         ArrayList outboxEventsToSave = new ArrayList(events.size());

         try {
            Iterator var3 = events.iterator();

            while(var3.hasNext()) {
               EventDto eventDto = (EventDto)var3.next();
               String eventDataJson = this.objectMapper.writeValueAsString(eventDto.getData());
               OutboxEvent outboxEvent = new OutboxEvent();
               outboxEvent.setTopic(eventDto.getTopic());
               outboxEvent.setEventType(eventDto.getEventType());
               outboxEvent.setPayload(eventDataJson);
               String partitionKey = eventDto.getPartitionKey() != null ? eventDto.getPartitionKey() : eventDto.getEventType();
               outboxEvent.setPartitionKey(partitionKey);
               outboxEvent.setStatus(OutboxEvent.EventStatus.PENDING);
               outboxEventsToSave.add(outboxEvent);
            }

            List<OutboxEvent> savedEvents = this.outboxRepository.saveAll(outboxEventsToSave);
            log.debug("Đã lưu {} sự kiện outbox.", savedEvents.size());
         } catch (Exception var8) {
            log.error("Lưu danh sách sự kiện outbox thất bại: {}", var8.getMessage(), var8);
            throw new RuntimeException("Lưu danh sách sự kiện outbox thất bại", var8);
         }
      } else {
         log.debug("No events to publish.");
      }
   }

   private void saveEvent(String topic, String eventType, String partitionKey, Object eventData) {
      try {
         String eventDataJson = this.objectMapper.writeValueAsString(eventData);
         OutboxEvent event = new OutboxEvent();
         event.setTopic(topic);
         event.setEventType(eventType);
         event.setPayload(eventDataJson);
         event.setPartitionKey(partitionKey);
         event.setStatus(OutboxEvent.EventStatus.PENDING);
         this.outboxRepository.save(event);
         log.debug("Sự kiện outbox đã được lưu: {}, loại: {}", event.getId(), eventType);
      } catch (Exception var7) {
         log.error("Lưu sự kiện outbox thất bại: {}", var7.getMessage(), var7);
         throw new RuntimeException("Lưu sự kiện outbox thất bại", var7);
      }
   }

   @Transactional(
      propagation = Propagation.REQUIRES_NEW
   )
   public void updateOutboxEventStatus(String eventId, boolean sent, String errorMessage) {
      try {
         Optional<OutboxEvent> eventOptional = this.outboxRepository.findById(eventId);
         eventOptional.ifPresent((event) -> {
            if (sent) {
               log.debug("Đang cập nhật sự kiện outbox là đã xử lý: {}", eventId);
               event.setStatus(OutboxEvent.EventStatus.PROCESSED);
               event.setProcessedAt(LocalDateTime.now());
            } else {
               log.error("Đang cập nhật sự kiện outbox là thất bại: {}", eventId);
               event.setStatus(OutboxEvent.EventStatus.FAILED);
               event.setErrorMessage(errorMessage != null ? errorMessage : "Lỗi không xác định");
               event.setRetryCount(event.getRetryCount() + 1);
               if (event.getRetryCount() < 3) {
                  event.setStatus(OutboxEvent.EventStatus.PENDING);
                  event.setNextRetryAt(LocalDateTime.now().plusMinutes(5L * (long)event.getRetryCount()));
                  log.info("Đã lên lịch thử lại cho sự kiện outbox: {} vào lúc {}", eventId, event.getNextRetryAt());
               } else {
                  log.error("Đã đạt số lần thử lại tối đa cho sự kiện outbox: {}", eventId);
               }
            }

            this.outboxRepository.save(event);
            log.debug("Đã cập nhật thành công sự kiện outbox: {} với trạng thái: {}", eventId, event.getStatus());
         });
         if (eventOptional.isEmpty()) {
            log.warn("Không tìm thấy sự kiện outbox với ID: {} để cập nhật trạng thái.", eventId);
         }
      } catch (Exception var5) {
         log.error("Cập nhật sự kiện outbox thất bại: {}", eventId, var5);
      }

   }
}
