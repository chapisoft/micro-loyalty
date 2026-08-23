package com.lib.ims.security.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.AntPathMatcher;

@Configuration
public class GlobalSecurityConfiguration {
   @Bean
   @ConfigurationProperties(
      prefix = "keycloak"
   )
   public KeycloakProperties keycloakProperties() {
      KeycloakProperties value = new KeycloakProperties();
      if (value.getPatterns() == null) {
         String[] newArray = new String[]{"/error", "/public"};
         value.setPatterns(newArray);
      }

      return value;
   }

   @Bean
   public AntPathMatcher antPathMatcher() {
      return new AntPathMatcher();
   }
}
