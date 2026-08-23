package com.lib.ims.kafka.interceptor;

import com.lib.ims.kafka.util.KafkaMDCUtil;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import org.apache.kafka.clients.consumer.ConsumerInterceptor;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.header.Header;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@SuppressWarnings({"unchecked", "rawtypes"})
public class CustomConsumerInterceptor implements ConsumerInterceptor<String, Object> {
   private static final Logger log = LoggerFactory.getLogger(CustomConsumerInterceptor.class);
   public static final String EVENT_ID_HEADER = "event-id";

   public ConsumerRecords<String, Object> onConsume(ConsumerRecords<String, Object> records) {
      if (records.isEmpty()) {
         return records;
      } else {
         log.debug("CustomConsumerInterceptor: Intercepted {} bản ghi.", records.count());
         List<ConsumerRecord<String, Object>> processedRecords = new ArrayList();
         Iterator var3 = records.iterator();

         while(var3.hasNext()) {
            ConsumerRecord<String, Object> record = (ConsumerRecord)var3.next();
            String clientMessageId = KafkaMDCUtil.extractAndSetClientMessId(record.headers());
            String eventId = null;
            Header eventIdHeader = record.headers().lastHeader("event-id");
            if (eventIdHeader != null && eventIdHeader.value() != null) {
               eventId = new String(eventIdHeader.value(), StandardCharsets.UTF_8);
            }

            log.info("CustomConsumerInterceptor: Đang xử lý bản ghi. Topic: {}, Partition: {}, Offset: {}, Key: {}, EventId: {}, ClientMessageId: {}", new Object[]{record.topic(), record.partition(), record.offset(), record.key(), eventId, clientMessageId});
            processedRecords.add(record);
         }

         return records;
      }
   }

   public void onCommit(Map<TopicPartition, OffsetAndMetadata> offsets) {
      log.info("CustomConsumerInterceptor: Các offset đã được commit: {}", offsets);
   }

   public void close() {
      log.info("CustomConsumerInterceptor: Closed.");
   }

   public void configure(Map<String, ?> configs) {
      log.info("CustomConsumerInterceptor: Configured with: {}", configs);
   }
}
