package com.lib.ims.security.config;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.Generated;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.AccessTokenResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;


@Component
@SuppressWarnings({"unchecked", "rawtypes"})
public class TokenProvider {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(TokenProvider.class);
   private final KeycloakSecurity keycloakSecurity;
   private final Map<String, TokenProvider.TokenCache> tokenCacheMap = new ConcurrentHashMap();

   public String getToken(KeycloakSecurity.KeycloakProvider provider, KeycloakSecurity.ClientConfig clientConfig, boolean includedBearer) {
      String clientId = clientConfig.clientId();
      String cacheKey = this.generateCacheKey(provider, clientId);
      TokenProvider.TokenCache tokenCache = (TokenProvider.TokenCache)this.tokenCacheMap.get(cacheKey);
      if (tokenCache != null && !tokenCache.isExpired()) {
         log.info("Sử dụng token từ cache cho {}/{}", provider, clientId);
         return this.formatToken(tokenCache.token(), includedBearer);
      } else {
         log.info("Lấy token mới cho {}/{}", provider, clientId);

         try {
            Keycloak keycloak = this.keycloakSecurity.getKeycloakInstance(provider, clientConfig);

            String var15;
            try {
               AccessTokenResponse tokenResponse = keycloak.tokenManager().getAccessToken();
               long expiresIn = tokenResponse.getExpiresIn();
               long safetyBuffer = 60L;
               Instant expiryTime;
               if (expiresIn > safetyBuffer) {
                  expiryTime = Instant.now().plusSeconds(expiresIn - safetyBuffer);
               } else {
                  expiryTime = Instant.now().plusSeconds(Math.max(0L, expiresIn / 2L));
               }

               TokenProvider.TokenCache newTokenCache = new TokenProvider.TokenCache(tokenResponse.getToken(), expiryTime);
               this.tokenCacheMap.put(cacheKey, newTokenCache);
               var15 = this.formatToken(tokenResponse.getToken(), includedBearer);
            } catch (Throwable var17) {
               if (keycloak != null) {
                  try {
                     keycloak.close();
                  } catch (Throwable var16) {
                     var17.addSuppressed(var16);
                  }
               }

               throw var17;
            }

            if (keycloak != null) {
               keycloak.close();
            }

            return var15;
         } catch (Exception var18) {
            log.error("Lỗi khi lấy token cho {}/{}: {}", new Object[]{provider, clientId, var18.getMessage(), var18});
            return "";
         }
      }
   }

   private String generateCacheKey(KeycloakSecurity.KeycloakProvider provider, String clientId) {
      String var10000 = provider.name();
      return var10000 + "-" + clientId;
   }

   private String formatToken(String token, boolean includedBearer) {
      return includedBearer ? "Bearer " + token : token;
   }

   @Generated
   public TokenProvider(KeycloakSecurity keycloakSecurity) {
      this.keycloakSecurity = keycloakSecurity;
   }

   private static record TokenCache(String token, Instant expiresAt) {
      private TokenCache(String token, Instant expiresAt) {
         this.token = token;
         this.expiresAt = expiresAt;
      }

      public boolean isExpired() {
         return Instant.now().isAfter(this.expiresAt);
      }

      public String token() {
         return this.token;
      }

      public Instant expiresAt() {
         return this.expiresAt;
      }
   }
}
