package com.lib.ims.core;

import com.lib.ims.core.log.MdcQueryLoggingListener;
import net.ttddyy.dsproxy.listener.QueryExecutionListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan(basePackages = { "com.lib.ims.core" })
public class IMSCoreAutoConfiguration {
   @Bean
   public QueryExecutionListener queryExecutionListener() {
      return new MdcQueryLoggingListener();
   }
}
