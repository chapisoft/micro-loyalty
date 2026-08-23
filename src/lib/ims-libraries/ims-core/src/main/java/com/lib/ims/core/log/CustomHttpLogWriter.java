package com.lib.ims.core.log;

import javax.annotation.Nonnull;
import lombok.Generated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.zalando.logbook.Correlation;
import org.zalando.logbook.HttpLogWriter;
import org.zalando.logbook.Precorrelation;

public class CustomHttpLogWriter implements HttpLogWriter {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(CustomHttpLogWriter.class);

   public void write(@Nonnull Precorrelation precorrelation, @Nonnull String request) {
      MDC.put("logType", "http-request");
      log.info("input {} {}", precorrelation.getId(), request);
      MDC.remove("logType");
   }

   public void write(@Nonnull Correlation correlation, @Nonnull String response) {
      String duration = "";
      String id = correlation.getId();

      try {
         duration = String.valueOf(correlation.getDuration().toMillis());
         MDC.put("duration", duration);
         MDC.put("logType", "http-response");
      } catch (Exception var6) {
         log.error("[ERROR] getDuration {}", id);
      }

      log.info("output {} {} and duration {}", new Object[]{id, response, duration});
      MDC.remove("duration");
      MDC.remove("logType");
   }
}
