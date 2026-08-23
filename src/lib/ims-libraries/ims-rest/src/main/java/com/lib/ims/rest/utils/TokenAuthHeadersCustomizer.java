package com.lib.ims.rest.utils;

import com.lib.ims.security.config.TokenProvider;
import com.lib.ims.security.config.KeycloakSecurity.ClientConfig;
import com.lib.ims.security.config.KeycloakSecurity.KeycloakProvider;
import java.util.function.BiConsumer;
import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRequest;

public class TokenAuthHeadersCustomizer implements BiConsumer<HttpRequest, HttpHeaders> {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(TokenAuthHeadersCustomizer.class);
   private final TokenProvider tokenProvider;
   private final KeycloakProvider provider;
   private final ClientConfig clientConfig;

   public TokenAuthHeadersCustomizer(TokenProvider tokenProvider, KeycloakProvider provider, ClientConfig clientConfig) {
      this.tokenProvider = tokenProvider;
      this.provider = provider;
      this.clientConfig = clientConfig;
   }

   public void accept(HttpRequest request, HttpHeaders headers) {
      log.info("[accept] called, set Token by header custom");
      String token = this.tokenProvider.getToken(this.provider, this.clientConfig, true);
      if (StringUtils.isNotBlank(token)) {
         headers.set("Authorization", token);
         log.debug("Đã thêm token xác thực cho {}/{}", this.provider, this.clientConfig.clientId());
      } else {
         log.error("Không thể lấy token xác thực cho {}/{}", this.provider, this.clientConfig.clientId());
      }

   }
}
