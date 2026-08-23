package com.lib.ims.kafka.dto;

public class EventDto {
   private String topic;
   private String eventType;
   private String partitionKey;
   private Object data;

   public EventDto() {
   }

   public EventDto(String topic, String eventType, Object data) {
      this.topic = topic;
      this.eventType = eventType;
      this.partitionKey = eventType;
      this.data = data;
   }

   public EventDto(String topic, String eventType, String partitionKey, Object data) {
      this.topic = topic;
      this.eventType = eventType;
      this.partitionKey = partitionKey;
      this.data = data;
   }

   public String getTopic() {
      return this.topic;
   }

   public void setTopic(String topic) {
      this.topic = topic;
   }

   public String getEventType() {
      return this.eventType;
   }

   public void setEventType(String eventType) {
      this.eventType = eventType;
   }

   public String getPartitionKey() {
      return this.partitionKey;
   }

   public void setPartitionKey(String partitionKey) {
      this.partitionKey = partitionKey;
   }

   public Object getData() {
      return this.data;
   }

   public void setData(Object data) {
      this.data = data;
   }

   public String toString() {
      String var10000 = this.topic;
      return "EventDto{topic='" + var10000 + "', eventType='" + this.eventType + "', partitionKey='" + this.partitionKey + "', data=" + String.valueOf(this.data) + "}";
   }
}
