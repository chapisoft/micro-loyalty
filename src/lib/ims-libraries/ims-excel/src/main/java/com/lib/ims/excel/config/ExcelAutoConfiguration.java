package com.lib.ims.excel.config;

import com.lib.ims.excel.ApplicationContextHolder;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;

@AutoConfiguration
@ComponentScan(
   basePackages = {"com.lib.ims.excel.*"}
)
public class ExcelAutoConfiguration {
   @Bean
   public ApplicationContextHolder applicationContextHolder() {
      return new ApplicationContextHolder();
   }
}
