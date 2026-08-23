package com.lib.ims.core.log;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.AntPathMatcher;
import org.zalando.logbook.Sink;
import org.zalando.logbook.Strategy;
import org.zalando.logbook.core.DefaultSink;
import org.zalando.logbook.json.JsonHttpLogFormatter;

@Configuration
public class LogbookConfig {
   @Bean
   public Sink sink() {
      return new DefaultSink(new JsonHttpLogFormatter(), new CustomHttpLogWriter());
   }

   @Bean
   public Strategy responseCustomStrategy(LogbookCustomProperties logbookCustomProperties) {
      return new CustomStrategy(logbookCustomProperties, new AntPathMatcher());
   }
}
