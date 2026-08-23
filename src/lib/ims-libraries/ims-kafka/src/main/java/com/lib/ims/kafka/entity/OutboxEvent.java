package com.lib.ims.kafka.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Generated;
import org.springframework.data.annotation.CreatedDate;



@Entity
@Table(
   name = "outbox_events"
)
public class OutboxEvent {
   @Id
   @Column(
      length = 255
   )
   private String id;
   @Column(
      name = "processed",
      nullable = false
   )
   private boolean processed = false;
   @Column(
      name = "retry_count",
      nullable = false
   )
   private int retryCount = 0;
   @Column(
      name = "priority",
      nullable = false
   )
   private int priority = 5;
   @Column(
      name = "is_dead_letter",
      nullable = false
   )
   private boolean isDeadLetter = false;
   @Column(
      name = "topic",
      length = 255,
      nullable = false
   )
   private String topic;
   @Column(
      name = "event_type",
      length = 255,
      nullable = false
   )
   private String eventType;
   @Lob
   @Column(
      name = "payload",
      nullable = false
   )
   private String payload;
   @Column(
      name = "created_at",
      nullable = false
   )
   @CreatedDate
   private LocalDateTime createdAt;
   @Column(
      name = "processed_at"
   )
   private LocalDateTime processedAt;
   @Column(
      name = "partition_key",
      length = 255
   )
   private String partitionKey;
   @Column(
      name = "next_retry_at"
   )
   private LocalDateTime nextRetryAt;
   @Lob
   @Column(
      name = "error_message"
   )
   private String errorMessage;
   @Column(
      name = "status",
      length = 50
   )
   private OutboxEvent.EventStatus status;

   @PrePersist
   public void prePersist() {
      if (this.id == null) {
         this.id = UUID.randomUUID().toString();
      }

      if (this.createdAt == null) {
         this.createdAt = LocalDateTime.now();
      }

   }

   @Generated
   public String getId() {
      return this.id;
   }

   @Generated
   public boolean isProcessed() {
      return this.processed;
   }

   @Generated
   public int getRetryCount() {
      return this.retryCount;
   }

   @Generated
   public int getPriority() {
      return this.priority;
   }

   @Generated
   public boolean isDeadLetter() {
      return this.isDeadLetter;
   }

   @Generated
   public String getTopic() {
      return this.topic;
   }

   @Generated
   public String getEventType() {
      return this.eventType;
   }

   @Generated
   public String getPayload() {
      return this.payload;
   }

   @Generated
   public LocalDateTime getCreatedAt() {
      return this.createdAt;
   }

   @Generated
   public LocalDateTime getProcessedAt() {
      return this.processedAt;
   }

   @Generated
   public String getPartitionKey() {
      return this.partitionKey;
   }

   @Generated
   public LocalDateTime getNextRetryAt() {
      return this.nextRetryAt;
   }

   @Generated
   public String getErrorMessage() {
      return this.errorMessage;
   }

   @Generated
   public OutboxEvent.EventStatus getStatus() {
      return this.status;
   }

   @Generated
   public void setId(String id) {
      this.id = id;
   }

   @Generated
   public void setProcessed(boolean processed) {
      this.processed = processed;
   }

   @Generated
   public void setRetryCount(int retryCount) {
      this.retryCount = retryCount;
   }

   @Generated
   public void setPriority(int priority) {
      this.priority = priority;
   }

   @Generated
   public void setDeadLetter(boolean isDeadLetter) {
      this.isDeadLetter = isDeadLetter;
   }

   @Generated
   public void setTopic(String topic) {
      this.topic = topic;
   }

   @Generated
   public void setEventType(String eventType) {
      this.eventType = eventType;
   }

   @Generated
   public void setPayload(String payload) {
      this.payload = payload;
   }

   @Generated
   public void setCreatedAt(LocalDateTime createdAt) {
      this.createdAt = createdAt;
   }

   @Generated
   public void setProcessedAt(LocalDateTime processedAt) {
      this.processedAt = processedAt;
   }

   @Generated
   public void setPartitionKey(String partitionKey) {
      this.partitionKey = partitionKey;
   }

   @Generated
   public void setNextRetryAt(LocalDateTime nextRetryAt) {
      this.nextRetryAt = nextRetryAt;
   }

   @Generated
   public void setErrorMessage(String errorMessage) {
      this.errorMessage = errorMessage;
   }

   @Generated
   public void setStatus(OutboxEvent.EventStatus status) {
      this.status = status;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof OutboxEvent)) {
         return false;
      } else {
         OutboxEvent other = (OutboxEvent)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (this.isProcessed() != other.isProcessed()) {
            return false;
         } else if (this.getRetryCount() != other.getRetryCount()) {
            return false;
         } else if (this.getPriority() != other.getPriority()) {
            return false;
         } else if (this.isDeadLetter() != other.isDeadLetter()) {
            return false;
         } else {
            Object this$id = this.getId();
            Object other$id = other.getId();
            if (this$id == null) {
               if (other$id != null) {
                  return false;
               }
            } else if (!this$id.equals(other$id)) {
               return false;
            }

            label134: {
               Object this$topic = this.getTopic();
               Object other$topic = other.getTopic();
               if (this$topic == null) {
                  if (other$topic == null) {
                     break label134;
                  }
               } else if (this$topic.equals(other$topic)) {
                  break label134;
               }

               return false;
            }

            label127: {
               Object this$eventType = this.getEventType();
               Object other$eventType = other.getEventType();
               if (this$eventType == null) {
                  if (other$eventType == null) {
                     break label127;
                  }
               } else if (this$eventType.equals(other$eventType)) {
                  break label127;
               }

               return false;
            }

            Object this$payload = this.getPayload();
            Object other$payload = other.getPayload();
            if (this$payload == null) {
               if (other$payload != null) {
                  return false;
               }
            } else if (!this$payload.equals(other$payload)) {
               return false;
            }

            Object this$createdAt = this.getCreatedAt();
            Object other$createdAt = other.getCreatedAt();
            if (this$createdAt == null) {
               if (other$createdAt != null) {
                  return false;
               }
            } else if (!this$createdAt.equals(other$createdAt)) {
               return false;
            }

            label106: {
               Object this$processedAt = this.getProcessedAt();
               Object other$processedAt = other.getProcessedAt();
               if (this$processedAt == null) {
                  if (other$processedAt == null) {
                     break label106;
                  }
               } else if (this$processedAt.equals(other$processedAt)) {
                  break label106;
               }

               return false;
            }

            Object this$partitionKey = this.getPartitionKey();
            Object other$partitionKey = other.getPartitionKey();
            if (this$partitionKey == null) {
               if (other$partitionKey != null) {
                  return false;
               }
            } else if (!this$partitionKey.equals(other$partitionKey)) {
               return false;
            }

            label92: {
               Object this$nextRetryAt = this.getNextRetryAt();
               Object other$nextRetryAt = other.getNextRetryAt();
               if (this$nextRetryAt == null) {
                  if (other$nextRetryAt == null) {
                     break label92;
                  }
               } else if (this$nextRetryAt.equals(other$nextRetryAt)) {
                  break label92;
               }

               return false;
            }

            Object this$errorMessage = this.getErrorMessage();
            Object other$errorMessage = other.getErrorMessage();
            if (this$errorMessage == null) {
               if (other$errorMessage != null) {
                  return false;
               }
            } else if (!this$errorMessage.equals(other$errorMessage)) {
               return false;
            }

            Object this$status = this.getStatus();
            Object other$status = other.getStatus();
            if (this$status == null) {
               if (other$status != null) {
                  return false;
               }
            } else if (!this$status.equals(other$status)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof OutboxEvent;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      result = result * 59 + (this.isProcessed() ? 79 : 97);
      result = result * 59 + this.getRetryCount();
      result = result * 59 + this.getPriority();
      result = result * 59 + (this.isDeadLetter() ? 79 : 97);
      Object $id = this.getId();
      result = result * 59 + ($id == null ? 43 : $id.hashCode());
      Object $topic = this.getTopic();
      result = result * 59 + ($topic == null ? 43 : $topic.hashCode());
      Object $eventType = this.getEventType();
      result = result * 59 + ($eventType == null ? 43 : $eventType.hashCode());
      Object $payload = this.getPayload();
      result = result * 59 + ($payload == null ? 43 : $payload.hashCode());
      Object $createdAt = this.getCreatedAt();
      result = result * 59 + ($createdAt == null ? 43 : $createdAt.hashCode());
      Object $processedAt = this.getProcessedAt();
      result = result * 59 + ($processedAt == null ? 43 : $processedAt.hashCode());
      Object $partitionKey = this.getPartitionKey();
      result = result * 59 + ($partitionKey == null ? 43 : $partitionKey.hashCode());
      Object $nextRetryAt = this.getNextRetryAt();
      result = result * 59 + ($nextRetryAt == null ? 43 : $nextRetryAt.hashCode());
      Object $errorMessage = this.getErrorMessage();
      result = result * 59 + ($errorMessage == null ? 43 : $errorMessage.hashCode());
      Object $status = this.getStatus();
      result = result * 59 + ($status == null ? 43 : $status.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getId();
      return "OutboxEvent(id=" + var10000 + ", processed=" + this.isProcessed() + ", retryCount=" + this.getRetryCount() + ", priority=" + this.getPriority() + ", isDeadLetter=" + this.isDeadLetter() + ", topic=" + this.getTopic() + ", eventType=" + this.getEventType() + ", payload=" + this.getPayload() + ", createdAt=" + String.valueOf(this.getCreatedAt()) + ", processedAt=" + String.valueOf(this.getProcessedAt()) + ", partitionKey=" + this.getPartitionKey() + ", nextRetryAt=" + String.valueOf(this.getNextRetryAt()) + ", errorMessage=" + this.getErrorMessage() + ", status=" + String.valueOf(this.getStatus()) + ")";
   }

   public static enum EventStatus {
      PENDING,
      PROCESSING,
      PROCESSED,
      FAILED;
   }
}
