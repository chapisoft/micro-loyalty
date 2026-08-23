package com.lib.ims.kafka.util;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.apache.kafka.common.header.Header;
import org.apache.kafka.common.header.Headers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.messaging.MessageHeaders;

public class KafkaMDCUtil {
   public static final String CLIENT_MESSAGE_ID = "clientMessageId";
   public static final String TRANSACTION_ID = "transactionId";
   private static final Logger log = LoggerFactory.getLogger(KafkaMDCUtil.class);

   public static String extractAndSetClientMessId(MessageHeaders headers) {
      if (headers == null) {
         return setNewClientMessId();
      } else {
         Object clientMessIdObj = headers.get("clientMessageId");
         String clientMessId;
         if (clientMessIdObj != null) {
            clientMessId = clientMessIdObj.toString();
            log.debug("Trích xuất clientMessId từ tin nhắn (Spring MessageHeaders): {}", clientMessId);
         } else {
            clientMessId = UUID.randomUUID().toString();
            log.debug("Không tìm thấy clientMessId trong tin nhắn (Spring MessageHeaders), tạo một ID mới: {}", clientMessId);
         }

         MDC.put("clientMessageId", clientMessId);
         return clientMessId;
      }
   }

   public static String extractAndSetClientMessId(Headers kafkaRecordHeaders) {
      String clientMessId = null;
      if (kafkaRecordHeaders != null) {
         Header header = kafkaRecordHeaders.lastHeader("clientMessageId");
         if (header != null && header.value() != null) {
            clientMessId = new String(header.value(), StandardCharsets.UTF_8);
            log.debug("Trích xuất clientMessId từ tin nhắn (Kafka Headers): {}", clientMessId);
         }
      }

      if (clientMessId == null || clientMessId.isBlank()) {
         clientMessId = UUID.randomUUID().toString();
         log.debug("Không tìm thấy/trống clientMessId trong tin nhắn (Kafka Headers), tạo một ID mới: {}", clientMessId);
      }

      MDC.put("clientMessageId", clientMessId);
      return clientMessId;
   }

   public static String setNewClientMessId() {
      String clientMessId = UUID.randomUUID().toString();
      MDC.put("clientMessageId", clientMessId);
      return clientMessId;
   }
}
