package com.lib.ims.kafka.config;

import lombok.Generated;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(
   prefix = "ims.kafka.outbox"
)
public class OutboxKafkaProperties {
   private boolean enabled = true;
   private int batchSize = 100;
   private long pollingInterval = 5000L;
   private int maxRetries = 3;

   @Generated
   public void setEnabled(boolean enabled) {
      this.enabled = enabled;
   }

   @Generated
   public void setBatchSize(int batchSize) {
      this.batchSize = batchSize;
   }

   @Generated
   public void setPollingInterval(long pollingInterval) {
      this.pollingInterval = pollingInterval;
   }

   @Generated
   public void setMaxRetries(int maxRetries) {
      this.maxRetries = maxRetries;
   }

   @Generated
   public boolean isEnabled() {
      return this.enabled;
   }

   @Generated
   public int getBatchSize() {
      return this.batchSize;
   }

   @Generated
   public long getPollingInterval() {
      return this.pollingInterval;
   }

   @Generated
   public int getMaxRetries() {
      return this.maxRetries;
   }
}
