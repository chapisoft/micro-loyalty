package com.lib.ims.security.config;

import lombok.Generated;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;



@Component
public class KeycloakSecurity {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(KeycloakSecurity.class);
   private final KeycloakProperties keycloakProperties;

   private KeycloakSecurity.ProviderConfig getProviderConfig(KeycloakSecurity.KeycloakProvider provider) {
      KeycloakSecurity.ProviderConfig var10000;
      switch(provider.ordinal()) {
      case 0:
         var10000 = new KeycloakSecurity.ProviderConfig(this.keycloakProperties.getRealm(), this.keycloakProperties.getClientId(), this.keycloakProperties.getClientSecret(), this.keycloakProperties.getServerUrl(), this.keycloakProperties.getAuthorizationGrantType());
         break;
      case 1:
         var10000 = new KeycloakSecurity.ProviderConfig(this.keycloakProperties.getMemberRealm(), this.keycloakProperties.getMemberClientId(), this.keycloakProperties.getMemberClientSecret(), this.keycloakProperties.getMemberServerUrl(), this.keycloakProperties.getMemberAuthorizationGrantType());
         break;
      case 2:
         var10000 = new KeycloakSecurity.ProviderConfig(this.keycloakProperties.getMsCoreRealm(), this.keycloakProperties.getMsCoreClientId(), this.keycloakProperties.getMsCoreClientSecret(), this.keycloakProperties.getMsCoreServerUrl(), this.keycloakProperties.getMsCoreAuthorizationGrantType());
         break;
      default:
         throw new IllegalArgumentException("Unknown provider: " + provider);
      }

      return var10000;
   }

   private KeycloakBuilder keycloakBuilder(KeycloakSecurity.KeycloakProvider provider, KeycloakSecurity.ClientConfig clientConfig) {
      KeycloakSecurity.ProviderConfig config = this.getProviderConfig(provider).withClient(clientConfig);
      return KeycloakBuilder.builder().realm(config.realm()).clientId(config.clientId()).clientSecret(config.clientSecret()).serverUrl(config.serverUrl()).grantType(config.grantType());
   }

   private KeycloakBuilder keycloakBuilder(KeycloakSecurity.KeycloakProvider provider) {
      KeycloakSecurity.ProviderConfig config = this.getProviderConfig(provider);
      return KeycloakBuilder.builder().realm(config.realm()).clientId(config.clientId()).clientSecret(config.clientSecret()).serverUrl(config.serverUrl()).grantType(config.grantType());
   }

   public Keycloak getKeycloakInstance(KeycloakSecurity.KeycloakProvider provider, KeycloakSecurity.ClientConfig clientConfig) {
      return this.keycloakBuilder(provider, clientConfig).build();
   }

   public Keycloak getKeycloakInstance(KeycloakSecurity.KeycloakProvider provider) {
      return this.keycloakBuilder(provider).build();
   }

   @Generated
   public KeycloakSecurity(KeycloakProperties keycloakProperties) {
      this.keycloakProperties = keycloakProperties;
   }

   public static enum KeycloakProvider {
      INTERNAL,
      MEMBER,
      MS_CORE;
   }

   private static record ProviderConfig(String realm, String clientId, String clientSecret, String serverUrl, String grantType) {
      private ProviderConfig(String realm, String clientId, String clientSecret, String serverUrl, String grantType) {
         this.realm = realm;
         this.clientId = clientId;
         this.clientSecret = clientSecret;
         this.serverUrl = serverUrl;
         this.grantType = grantType;
      }

      public KeycloakSecurity.ProviderConfig withClient(KeycloakSecurity.ClientConfig clientConfig) {
         return new KeycloakSecurity.ProviderConfig(this.realm, clientConfig.clientId(), clientConfig.clientSecret(), this.serverUrl, this.grantType);
      }

      public String realm() {
         return this.realm;
      }

      public String clientId() {
         return this.clientId;
      }

      public String clientSecret() {
         return this.clientSecret;
      }

      public String serverUrl() {
         return this.serverUrl;
      }

      public String grantType() {
         return this.grantType;
      }
   }

   public static record ClientConfig(String clientId, String clientSecret) {
      public ClientConfig(String clientId, String clientSecret) {
         this.clientId = clientId;
         this.clientSecret = clientSecret;
      }

      public String clientId() {
         return this.clientId;
      }

      public String clientSecret() {
         return this.clientSecret;
      }
   }
}
