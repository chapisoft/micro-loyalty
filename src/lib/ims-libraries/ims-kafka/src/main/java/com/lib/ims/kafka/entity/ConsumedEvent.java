package com.lib.ims.kafka.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Generated;



@Entity
@Table(
   name = "consumed_events"
)
public class ConsumedEvent {
   @Id
   private String id;
   @Column(
      name = "topic",
      nullable = false,
      length = 255
   )
   private String topic;
   @Column(
      name = "partition_id"
   )
   private Integer partition;
   @Column(
      name = "offset_id"
   )
   private Long offset;
   @Column(
      name = "client_message_id",
      length = 255
   )
   private String clientMessageId;
   @Column(
      name = "consumed_at",
      nullable = false
   )
   private LocalDateTime consumedAt;
   @Column(
      name = "completed_at"
   )
   private LocalDateTime completedAt;
   @Column(
      name = "status",
      nullable = false,
      length = 20
   )
   private String status;
   @Lob
   @Column(
      name = "error_message"
   )
   private String errorMessage;

   @PrePersist
   protected void onCreate() {
      if (this.consumedAt == null) {
         this.consumedAt = LocalDateTime.now();
      }

      if (this.status == null) {
         this.status = "PROCESSING";
      }

   }

   @Generated
   public static ConsumedEvent.ConsumedEventBuilder builder() {
      return new ConsumedEvent.ConsumedEventBuilder();
   }

   @Generated
   public String getId() {
      return this.id;
   }

   @Generated
   public String getTopic() {
      return this.topic;
   }

   @Generated
   public Integer getPartition() {
      return this.partition;
   }

   @Generated
   public Long getOffset() {
      return this.offset;
   }

   @Generated
   public String getClientMessageId() {
      return this.clientMessageId;
   }

   @Generated
   public LocalDateTime getConsumedAt() {
      return this.consumedAt;
   }

   @Generated
   public LocalDateTime getCompletedAt() {
      return this.completedAt;
   }

   @Generated
   public String getStatus() {
      return this.status;
   }

   @Generated
   public String getErrorMessage() {
      return this.errorMessage;
   }

   @Generated
   public void setId(String id) {
      this.id = id;
   }

   @Generated
   public void setTopic(String topic) {
      this.topic = topic;
   }

   @Generated
   public void setPartition(Integer partition) {
      this.partition = partition;
   }

   @Generated
   public void setOffset(Long offset) {
      this.offset = offset;
   }

   @Generated
   public void setClientMessageId(String clientMessageId) {
      this.clientMessageId = clientMessageId;
   }

   @Generated
   public void setConsumedAt(LocalDateTime consumedAt) {
      this.consumedAt = consumedAt;
   }

   @Generated
   public void setCompletedAt(LocalDateTime completedAt) {
      this.completedAt = completedAt;
   }

   @Generated
   public void setStatus(String status) {
      this.status = status;
   }

   @Generated
   public void setErrorMessage(String errorMessage) {
      this.errorMessage = errorMessage;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof ConsumedEvent)) {
         return false;
      } else {
         ConsumedEvent other = (ConsumedEvent)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            label119: {
               Object this$partition = this.getPartition();
               Object other$partition = other.getPartition();
               if (this$partition == null) {
                  if (other$partition == null) {
                     break label119;
                  }
               } else if (this$partition.equals(other$partition)) {
                  break label119;
               }

               return false;
            }

            Object this$offset = this.getOffset();
            Object other$offset = other.getOffset();
            if (this$offset == null) {
               if (other$offset != null) {
                  return false;
               }
            } else if (!this$offset.equals(other$offset)) {
               return false;
            }

            label105: {
               Object this$id = this.getId();
               Object other$id = other.getId();
               if (this$id == null) {
                  if (other$id == null) {
                     break label105;
                  }
               } else if (this$id.equals(other$id)) {
                  break label105;
               }

               return false;
            }

            Object this$topic = this.getTopic();
            Object other$topic = other.getTopic();
            if (this$topic == null) {
               if (other$topic != null) {
                  return false;
               }
            } else if (!this$topic.equals(other$topic)) {
               return false;
            }

            label91: {
               Object this$clientMessageId = this.getClientMessageId();
               Object other$clientMessageId = other.getClientMessageId();
               if (this$clientMessageId == null) {
                  if (other$clientMessageId == null) {
                     break label91;
                  }
               } else if (this$clientMessageId.equals(other$clientMessageId)) {
                  break label91;
               }

               return false;
            }

            Object this$consumedAt = this.getConsumedAt();
            Object other$consumedAt = other.getConsumedAt();
            if (this$consumedAt == null) {
               if (other$consumedAt != null) {
                  return false;
               }
            } else if (!this$consumedAt.equals(other$consumedAt)) {
               return false;
            }

            label77: {
               Object this$completedAt = this.getCompletedAt();
               Object other$completedAt = other.getCompletedAt();
               if (this$completedAt == null) {
                  if (other$completedAt == null) {
                     break label77;
                  }
               } else if (this$completedAt.equals(other$completedAt)) {
                  break label77;
               }

               return false;
            }

            label70: {
               Object this$status = this.getStatus();
               Object other$status = other.getStatus();
               if (this$status == null) {
                  if (other$status == null) {
                     break label70;
                  }
               } else if (this$status.equals(other$status)) {
                  break label70;
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

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof ConsumedEvent;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $partition = this.getPartition();
      result = result * 59 + ($partition == null ? 43 : $partition.hashCode());
      Object $offset = this.getOffset();
      result = result * 59 + ($offset == null ? 43 : $offset.hashCode());
      Object $id = this.getId();
      result = result * 59 + ($id == null ? 43 : $id.hashCode());
      Object $topic = this.getTopic();
      result = result * 59 + ($topic == null ? 43 : $topic.hashCode());
      Object $clientMessageId = this.getClientMessageId();
      result = result * 59 + ($clientMessageId == null ? 43 : $clientMessageId.hashCode());
      Object $consumedAt = this.getConsumedAt();
      result = result * 59 + ($consumedAt == null ? 43 : $consumedAt.hashCode());
      Object $completedAt = this.getCompletedAt();
      result = result * 59 + ($completedAt == null ? 43 : $completedAt.hashCode());
      Object $status = this.getStatus();
      result = result * 59 + ($status == null ? 43 : $status.hashCode());
      Object $errorMessage = this.getErrorMessage();
      result = result * 59 + ($errorMessage == null ? 43 : $errorMessage.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getId();
      return "ConsumedEvent(id=" + var10000 + ", topic=" + this.getTopic() + ", partition=" + this.getPartition() + ", offset=" + this.getOffset() + ", clientMessageId=" + this.getClientMessageId() + ", consumedAt=" + String.valueOf(this.getConsumedAt()) + ", completedAt=" + String.valueOf(this.getCompletedAt()) + ", status=" + this.getStatus() + ", errorMessage=" + this.getErrorMessage() + ")";
   }

   @Generated
   public ConsumedEvent() {
   }

   @Generated
   public ConsumedEvent(String id, String topic, Integer partition, Long offset, String clientMessageId, LocalDateTime consumedAt, LocalDateTime completedAt, String status, String errorMessage) {
      this.id = id;
      this.topic = topic;
      this.partition = partition;
      this.offset = offset;
      this.clientMessageId = clientMessageId;
      this.consumedAt = consumedAt;
      this.completedAt = completedAt;
      this.status = status;
      this.errorMessage = errorMessage;
   }

   @Generated
   public static class ConsumedEventBuilder {
      @Generated
      private String id;
      @Generated
      private String topic;
      @Generated
      private Integer partition;
      @Generated
      private Long offset;
      @Generated
      private String clientMessageId;
      @Generated
      private LocalDateTime consumedAt;
      @Generated
      private LocalDateTime completedAt;
      @Generated
      private String status;
      @Generated
      private String errorMessage;

      @Generated
      ConsumedEventBuilder() {
      }

      @Generated
      public ConsumedEvent.ConsumedEventBuilder id(String id) {
         this.id = id;
         return this;
      }

      @Generated
      public ConsumedEvent.ConsumedEventBuilder topic(String topic) {
         this.topic = topic;
         return this;
      }

      @Generated
      public ConsumedEvent.ConsumedEventBuilder partition(Integer partition) {
         this.partition = partition;
         return this;
      }

      @Generated
      public ConsumedEvent.ConsumedEventBuilder offset(Long offset) {
         this.offset = offset;
         return this;
      }

      @Generated
      public ConsumedEvent.ConsumedEventBuilder clientMessageId(String clientMessageId) {
         this.clientMessageId = clientMessageId;
         return this;
      }

      @Generated
      public ConsumedEvent.ConsumedEventBuilder consumedAt(LocalDateTime consumedAt) {
         this.consumedAt = consumedAt;
         return this;
      }

      @Generated
      public ConsumedEvent.ConsumedEventBuilder completedAt(LocalDateTime completedAt) {
         this.completedAt = completedAt;
         return this;
      }

      @Generated
      public ConsumedEvent.ConsumedEventBuilder status(String status) {
         this.status = status;
         return this;
      }

      @Generated
      public ConsumedEvent.ConsumedEventBuilder errorMessage(String errorMessage) {
         this.errorMessage = errorMessage;
         return this;
      }

      @Generated
      public ConsumedEvent build() {
         return new ConsumedEvent(this.id, this.topic, this.partition, this.offset, this.clientMessageId, this.consumedAt, this.completedAt, this.status, this.errorMessage);
      }

      @Generated
      public String toString() {
         String var10000 = this.id;
         return "ConsumedEvent.ConsumedEventBuilder(id=" + var10000 + ", topic=" + this.topic + ", partition=" + this.partition + ", offset=" + this.offset + ", clientMessageId=" + this.clientMessageId + ", consumedAt=" + String.valueOf(this.consumedAt) + ", completedAt=" + String.valueOf(this.completedAt) + ", status=" + this.status + ", errorMessage=" + this.errorMessage + ")";
      }
   }
}
