package com.lib.ims.kafka;

import com.lib.ims.kafka.config.OutboxKafkaProperties;
import com.lib.ims.kafka.interceptor.CustomConsumerInterceptor;
import jakarta.annotation.PostConstruct;
import org.apache.kafka.common.TopicPartition;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.kafka.autoconfigure.KafkaProperties;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;



@AutoConfiguration
@EnableConfigurationProperties({OutboxKafkaProperties.class})
@ConditionalOnProperty(
   name = {"ims.kafka.enabled"},
   havingValue = "true",
   matchIfMissing = true
)
@EnableJpaRepositories(
   basePackages = {"com.lib.ims.kafka.repository"}
)
@EntityScan(
   basePackages = {"com.lib.ims.kafka.entity"}
)
@ComponentScan(
   basePackages = {"com.lib.ims.kafka"}
)
@SuppressWarnings("null")
public class IMSKafkaAutoConfiguration {
   private final KafkaProperties kafkaProperties;

   public IMSKafkaAutoConfiguration(KafkaProperties kafkaProperties) {
      this.kafkaProperties = kafkaProperties;
   }

   @PostConstruct
   public void configureInterceptors() {
      this.kafkaProperties.getConsumer().getProperties().put("interceptor.classes", CustomConsumerInterceptor.class.getName());
   }

   @Bean
   public DeadLetterPublishingRecoverer deadLetterPublishingRecoverer(KafkaTemplate<Object, Object> kafkaTemplate) {
      return new DeadLetterPublishingRecoverer(kafkaTemplate, (record, ex) -> {
         String topic = record != null && record.topic() != null ? record.topic() : "UNKNOWN";
         int partition = record != null ? record.partition() : 0;
         return new TopicPartition(topic + ".DLT", partition);
      });
   }

   @Bean
   public DefaultErrorHandler exponentialBackoffErrorHandler(DeadLetterPublishingRecoverer deadLetterPublishingRecoverer) {
      FixedBackOff fixedBackOff = new FixedBackOff(1000L, 3L);
      return new DefaultErrorHandler(deadLetterPublishingRecoverer, fixedBackOff);
   }
}
