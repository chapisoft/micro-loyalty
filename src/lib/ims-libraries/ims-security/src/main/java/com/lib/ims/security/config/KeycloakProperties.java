package com.lib.ims.security.config;

import java.util.Arrays;
import java.util.Map;
import lombok.Generated;



public class KeycloakProperties {
   private String serverUrl;
   private String realm;
   private String clientId;
   private String clientSecret;
   private String authorizationGrantType;
   private String username;
   private String password;
   private String[] patterns;
   private String memberServerUrl;
   private String memberRealm;
   private String memberClientId;
   private String memberClientSecret;
   private String memberAuthorizationGrantType;
   private String msCoreServerUrl;
   private String msCoreRealm;
   private String msCoreClientId;
   private String msCoreClientSecret;
   private String msCoreAuthorizationGrantType;
   private Map<String, String> internalClient;
   private Map<String, String> msCoreClient;

   public KeycloakSecurity.ClientConfig getClientConfig(Map<String, String> configMap, String purpose) {
      if (configMap == null) {
         return new KeycloakSecurity.ClientConfig(this.clientId, this.clientSecret);
      } else {
         String clientIdKey = purpose + "-client-id";
         String clientSecretKey = purpose + "-client-secret";
         return configMap.containsKey(clientIdKey) && configMap.containsKey(clientSecretKey) ? new KeycloakSecurity.ClientConfig((String)configMap.get(clientIdKey), (String)configMap.get(clientSecretKey)) : new KeycloakSecurity.ClientConfig(this.clientId, this.clientSecret);
      }
   }

   @Generated
   public String getServerUrl() {
      return this.serverUrl;
   }

   @Generated
   public String getRealm() {
      return this.realm;
   }

   @Generated
   public String getClientId() {
      return this.clientId;
   }

   @Generated
   public String getClientSecret() {
      return this.clientSecret;
   }

   @Generated
   public String getAuthorizationGrantType() {
      return this.authorizationGrantType;
   }

   @Generated
   public String getUsername() {
      return this.username;
   }

   @Generated
   public String getPassword() {
      return this.password;
   }

   @Generated
   public String[] getPatterns() {
      return this.patterns;
   }

   @Generated
   public String getMemberServerUrl() {
      return this.memberServerUrl;
   }

   @Generated
   public String getMemberRealm() {
      return this.memberRealm;
   }

   @Generated
   public String getMemberClientId() {
      return this.memberClientId;
   }

   @Generated
   public String getMemberClientSecret() {
      return this.memberClientSecret;
   }

   @Generated
   public String getMemberAuthorizationGrantType() {
      return this.memberAuthorizationGrantType;
   }

   @Generated
   public String getMsCoreServerUrl() {
      return this.msCoreServerUrl;
   }

   @Generated
   public String getMsCoreRealm() {
      return this.msCoreRealm;
   }

   @Generated
   public String getMsCoreClientId() {
      return this.msCoreClientId;
   }

   @Generated
   public String getMsCoreClientSecret() {
      return this.msCoreClientSecret;
   }

   @Generated
   public String getMsCoreAuthorizationGrantType() {
      return this.msCoreAuthorizationGrantType;
   }

   @Generated
   public Map<String, String> getInternalClient() {
      return this.internalClient;
   }

   @Generated
   public Map<String, String> getMsCoreClient() {
      return this.msCoreClient;
   }

   @Generated
   public void setServerUrl(String serverUrl) {
      this.serverUrl = serverUrl;
   }

   @Generated
   public void setRealm(String realm) {
      this.realm = realm;
   }

   @Generated
   public void setClientId(String clientId) {
      this.clientId = clientId;
   }

   @Generated
   public void setClientSecret(String clientSecret) {
      this.clientSecret = clientSecret;
   }

   @Generated
   public void setAuthorizationGrantType(String authorizationGrantType) {
      this.authorizationGrantType = authorizationGrantType;
   }

   @Generated
   public void setUsername(String username) {
      this.username = username;
   }

   @Generated
   public void setPassword(String password) {
      this.password = password;
   }

   @Generated
   public void setPatterns(String[] patterns) {
      this.patterns = patterns;
   }

   @Generated
   public void setMemberServerUrl(String memberServerUrl) {
      this.memberServerUrl = memberServerUrl;
   }

   @Generated
   public void setMemberRealm(String memberRealm) {
      this.memberRealm = memberRealm;
   }

   @Generated
   public void setMemberClientId(String memberClientId) {
      this.memberClientId = memberClientId;
   }

   @Generated
   public void setMemberClientSecret(String memberClientSecret) {
      this.memberClientSecret = memberClientSecret;
   }

   @Generated
   public void setMemberAuthorizationGrantType(String memberAuthorizationGrantType) {
      this.memberAuthorizationGrantType = memberAuthorizationGrantType;
   }

   @Generated
   public void setMsCoreServerUrl(String msCoreServerUrl) {
      this.msCoreServerUrl = msCoreServerUrl;
   }

   @Generated
   public void setMsCoreRealm(String msCoreRealm) {
      this.msCoreRealm = msCoreRealm;
   }

   @Generated
   public void setMsCoreClientId(String msCoreClientId) {
      this.msCoreClientId = msCoreClientId;
   }

   @Generated
   public void setMsCoreClientSecret(String msCoreClientSecret) {
      this.msCoreClientSecret = msCoreClientSecret;
   }

   @Generated
   public void setMsCoreAuthorizationGrantType(String msCoreAuthorizationGrantType) {
      this.msCoreAuthorizationGrantType = msCoreAuthorizationGrantType;
   }

   @Generated
   public void setInternalClient(Map<String, String> internalClient) {
      this.internalClient = internalClient;
   }

   @Generated
   public void setMsCoreClient(Map<String, String> msCoreClient) {
      this.msCoreClient = msCoreClient;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof KeycloakProperties)) {
         return false;
      } else {
         KeycloakProperties other = (KeycloakProperties)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            Object this$serverUrl = this.getServerUrl();
            Object other$serverUrl = other.getServerUrl();
            if (this$serverUrl == null) {
               if (other$serverUrl != null) {
                  return false;
               }
            } else if (!this$serverUrl.equals(other$serverUrl)) {
               return false;
            }

            Object this$realm = this.getRealm();
            Object other$realm = other.getRealm();
            if (this$realm == null) {
               if (other$realm != null) {
                  return false;
               }
            } else if (!this$realm.equals(other$realm)) {
               return false;
            }

            Object this$clientId = this.getClientId();
            Object other$clientId = other.getClientId();
            if (this$clientId == null) {
               if (other$clientId != null) {
                  return false;
               }
            } else if (!this$clientId.equals(other$clientId)) {
               return false;
            }

            label222: {
               Object this$clientSecret = this.getClientSecret();
               Object other$clientSecret = other.getClientSecret();
               if (this$clientSecret == null) {
                  if (other$clientSecret == null) {
                     break label222;
                  }
               } else if (this$clientSecret.equals(other$clientSecret)) {
                  break label222;
               }

               return false;
            }

            label215: {
               Object this$authorizationGrantType = this.getAuthorizationGrantType();
               Object other$authorizationGrantType = other.getAuthorizationGrantType();
               if (this$authorizationGrantType == null) {
                  if (other$authorizationGrantType == null) {
                     break label215;
                  }
               } else if (this$authorizationGrantType.equals(other$authorizationGrantType)) {
                  break label215;
               }

               return false;
            }

            Object this$username = this.getUsername();
            Object other$username = other.getUsername();
            if (this$username == null) {
               if (other$username != null) {
                  return false;
               }
            } else if (!this$username.equals(other$username)) {
               return false;
            }

            label201: {
               Object this$password = this.getPassword();
               Object other$password = other.getPassword();
               if (this$password == null) {
                  if (other$password == null) {
                     break label201;
                  }
               } else if (this$password.equals(other$password)) {
                  break label201;
               }

               return false;
            }

            if (!Arrays.deepEquals(this.getPatterns(), other.getPatterns())) {
               return false;
            } else {
               Object this$memberServerUrl = this.getMemberServerUrl();
               Object other$memberServerUrl = other.getMemberServerUrl();
               if (this$memberServerUrl == null) {
                  if (other$memberServerUrl != null) {
                     return false;
                  }
               } else if (!this$memberServerUrl.equals(other$memberServerUrl)) {
                  return false;
               }

               label186: {
                  Object this$memberRealm = this.getMemberRealm();
                  Object other$memberRealm = other.getMemberRealm();
                  if (this$memberRealm == null) {
                     if (other$memberRealm == null) {
                        break label186;
                     }
                  } else if (this$memberRealm.equals(other$memberRealm)) {
                     break label186;
                  }

                  return false;
               }

               Object this$memberClientId = this.getMemberClientId();
               Object other$memberClientId = other.getMemberClientId();
               if (this$memberClientId == null) {
                  if (other$memberClientId != null) {
                     return false;
                  }
               } else if (!this$memberClientId.equals(other$memberClientId)) {
                  return false;
               }

               label172: {
                  Object this$memberClientSecret = this.getMemberClientSecret();
                  Object other$memberClientSecret = other.getMemberClientSecret();
                  if (this$memberClientSecret == null) {
                     if (other$memberClientSecret == null) {
                        break label172;
                     }
                  } else if (this$memberClientSecret.equals(other$memberClientSecret)) {
                     break label172;
                  }

                  return false;
               }

               Object this$memberAuthorizationGrantType = this.getMemberAuthorizationGrantType();
               Object other$memberAuthorizationGrantType = other.getMemberAuthorizationGrantType();
               if (this$memberAuthorizationGrantType == null) {
                  if (other$memberAuthorizationGrantType != null) {
                     return false;
                  }
               } else if (!this$memberAuthorizationGrantType.equals(other$memberAuthorizationGrantType)) {
                  return false;
               }

               label158: {
                  Object this$msCoreServerUrl = this.getMsCoreServerUrl();
                  Object other$msCoreServerUrl = other.getMsCoreServerUrl();
                  if (this$msCoreServerUrl == null) {
                     if (other$msCoreServerUrl == null) {
                        break label158;
                     }
                  } else if (this$msCoreServerUrl.equals(other$msCoreServerUrl)) {
                     break label158;
                  }

                  return false;
               }

               label151: {
                  Object this$msCoreRealm = this.getMsCoreRealm();
                  Object other$msCoreRealm = other.getMsCoreRealm();
                  if (this$msCoreRealm == null) {
                     if (other$msCoreRealm == null) {
                        break label151;
                     }
                  } else if (this$msCoreRealm.equals(other$msCoreRealm)) {
                     break label151;
                  }

                  return false;
               }

               Object this$msCoreClientId = this.getMsCoreClientId();
               Object other$msCoreClientId = other.getMsCoreClientId();
               if (this$msCoreClientId == null) {
                  if (other$msCoreClientId != null) {
                     return false;
                  }
               } else if (!this$msCoreClientId.equals(other$msCoreClientId)) {
                  return false;
               }

               label137: {
                  Object this$msCoreClientSecret = this.getMsCoreClientSecret();
                  Object other$msCoreClientSecret = other.getMsCoreClientSecret();
                  if (this$msCoreClientSecret == null) {
                     if (other$msCoreClientSecret == null) {
                        break label137;
                     }
                  } else if (this$msCoreClientSecret.equals(other$msCoreClientSecret)) {
                     break label137;
                  }

                  return false;
               }

               label130: {
                  Object this$msCoreAuthorizationGrantType = this.getMsCoreAuthorizationGrantType();
                  Object other$msCoreAuthorizationGrantType = other.getMsCoreAuthorizationGrantType();
                  if (this$msCoreAuthorizationGrantType == null) {
                     if (other$msCoreAuthorizationGrantType == null) {
                        break label130;
                     }
                  } else if (this$msCoreAuthorizationGrantType.equals(other$msCoreAuthorizationGrantType)) {
                     break label130;
                  }

                  return false;
               }

               Object this$internalClient = this.getInternalClient();
               Object other$internalClient = other.getInternalClient();
               if (this$internalClient == null) {
                  if (other$internalClient != null) {
                     return false;
                  }
               } else if (!this$internalClient.equals(other$internalClient)) {
                  return false;
               }

               Object this$msCoreClient = this.getMsCoreClient();
               Object other$msCoreClient = other.getMsCoreClient();
               if (this$msCoreClient == null) {
                  if (other$msCoreClient != null) {
                     return false;
                  }
               } else if (!this$msCoreClient.equals(other$msCoreClient)) {
                  return false;
               }

               return true;
            }
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof KeycloakProperties;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $serverUrl = this.getServerUrl();
      result = result * 59 + ($serverUrl == null ? 43 : $serverUrl.hashCode());
      Object $realm = this.getRealm();
      result = result * 59 + ($realm == null ? 43 : $realm.hashCode());
      Object $clientId = this.getClientId();
      result = result * 59 + ($clientId == null ? 43 : $clientId.hashCode());
      Object $clientSecret = this.getClientSecret();
      result = result * 59 + ($clientSecret == null ? 43 : $clientSecret.hashCode());
      Object $authorizationGrantType = this.getAuthorizationGrantType();
      result = result * 59 + ($authorizationGrantType == null ? 43 : $authorizationGrantType.hashCode());
      Object $username = this.getUsername();
      result = result * 59 + ($username == null ? 43 : $username.hashCode());
      Object $password = this.getPassword();
      result = result * 59 + ($password == null ? 43 : $password.hashCode());
      result = result * 59 + Arrays.deepHashCode(this.getPatterns());
      Object $memberServerUrl = this.getMemberServerUrl();
      result = result * 59 + ($memberServerUrl == null ? 43 : $memberServerUrl.hashCode());
      Object $memberRealm = this.getMemberRealm();
      result = result * 59 + ($memberRealm == null ? 43 : $memberRealm.hashCode());
      Object $memberClientId = this.getMemberClientId();
      result = result * 59 + ($memberClientId == null ? 43 : $memberClientId.hashCode());
      Object $memberClientSecret = this.getMemberClientSecret();
      result = result * 59 + ($memberClientSecret == null ? 43 : $memberClientSecret.hashCode());
      Object $memberAuthorizationGrantType = this.getMemberAuthorizationGrantType();
      result = result * 59 + ($memberAuthorizationGrantType == null ? 43 : $memberAuthorizationGrantType.hashCode());
      Object $msCoreServerUrl = this.getMsCoreServerUrl();
      result = result * 59 + ($msCoreServerUrl == null ? 43 : $msCoreServerUrl.hashCode());
      Object $msCoreRealm = this.getMsCoreRealm();
      result = result * 59 + ($msCoreRealm == null ? 43 : $msCoreRealm.hashCode());
      Object $msCoreClientId = this.getMsCoreClientId();
      result = result * 59 + ($msCoreClientId == null ? 43 : $msCoreClientId.hashCode());
      Object $msCoreClientSecret = this.getMsCoreClientSecret();
      result = result * 59 + ($msCoreClientSecret == null ? 43 : $msCoreClientSecret.hashCode());
      Object $msCoreAuthorizationGrantType = this.getMsCoreAuthorizationGrantType();
      result = result * 59 + ($msCoreAuthorizationGrantType == null ? 43 : $msCoreAuthorizationGrantType.hashCode());
      Object $internalClient = this.getInternalClient();
      result = result * 59 + ($internalClient == null ? 43 : $internalClient.hashCode());
      Object $msCoreClient = this.getMsCoreClient();
      result = result * 59 + ($msCoreClient == null ? 43 : $msCoreClient.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getServerUrl();
      return "KeycloakProperties(serverUrl=" + var10000 + ", realm=" + this.getRealm() + ", clientId=" + this.getClientId() + ", clientSecret=" + this.getClientSecret() + ", authorizationGrantType=" + this.getAuthorizationGrantType() + ", username=" + this.getUsername() + ", password=" + this.getPassword() + ", patterns=" + Arrays.deepToString(this.getPatterns()) + ", memberServerUrl=" + this.getMemberServerUrl() + ", memberRealm=" + this.getMemberRealm() + ", memberClientId=" + this.getMemberClientId() + ", memberClientSecret=" + this.getMemberClientSecret() + ", memberAuthorizationGrantType=" + this.getMemberAuthorizationGrantType() + ", msCoreServerUrl=" + this.getMsCoreServerUrl() + ", msCoreRealm=" + this.getMsCoreRealm() + ", msCoreClientId=" + this.getMsCoreClientId() + ", msCoreClientSecret=" + this.getMsCoreClientSecret() + ", msCoreAuthorizationGrantType=" + this.getMsCoreAuthorizationGrantType() + ", internalClient=" + String.valueOf(this.getInternalClient()) + ", msCoreClient=" + String.valueOf(this.getMsCoreClient()) + ")";
   }
}
