package com.lib.ims.core.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.lib.ims.core.utils.JsonUtil;
import java.util.Date;
import lombok.Generated;



public class ServiceHeader extends BaseServiceHeader {
   private String servicePath;
   private String clientMessageId;
   private String transactionId;
   @SuppressWarnings("unused")
   private String serviceMessageId;
   private Date messageTimeStamp;
   private String sourceAppId;
   private String authenticationUser;
   @JsonIgnore
   private String authorization;

   public String getServiceMessageId() {
      return this.sourceAppId == null && this.clientMessageId == null ? null : String.format("%s-%s", this.sourceAppId, this.clientMessageId);
   }

   public String toString() {
      return JsonUtil.toJson(this);
   }

   @Generated
   protected ServiceHeader(ServiceHeader.ServiceHeaderBuilder<?, ?> b) {
      super(b);
      this.servicePath = b.servicePath;
      this.clientMessageId = b.clientMessageId;
      this.transactionId = b.transactionId;
      this.serviceMessageId = b.serviceMessageId;
      this.messageTimeStamp = b.messageTimeStamp;
      this.sourceAppId = b.sourceAppId;
      this.authenticationUser = b.authenticationUser;
      this.authorization = b.authorization;
   }

   @Generated
   public static ServiceHeader.ServiceHeaderBuilder<?, ?> builder() {
      return new ServiceHeader.ServiceHeaderBuilderImpl();
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof ServiceHeader)) {
         return false;
      } else {
         ServiceHeader other = (ServiceHeader)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (!super.equals(o)) {
            return false;
         } else {
            label109: {
               Object this$servicePath = this.getServicePath();
               Object other$servicePath = other.getServicePath();
               if (this$servicePath == null) {
                  if (other$servicePath == null) {
                     break label109;
                  }
               } else if (this$servicePath.equals(other$servicePath)) {
                  break label109;
               }

               return false;
            }

            label102: {
               Object this$clientMessageId = this.getClientMessageId();
               Object other$clientMessageId = other.getClientMessageId();
               if (this$clientMessageId == null) {
                  if (other$clientMessageId == null) {
                     break label102;
                  }
               } else if (this$clientMessageId.equals(other$clientMessageId)) {
                  break label102;
               }

               return false;
            }

            Object this$transactionId = this.getTransactionId();
            Object other$transactionId = other.getTransactionId();
            if (this$transactionId == null) {
               if (other$transactionId != null) {
                  return false;
               }
            } else if (!this$transactionId.equals(other$transactionId)) {
               return false;
            }

            label88: {
               Object this$serviceMessageId = this.getServiceMessageId();
               Object other$serviceMessageId = other.getServiceMessageId();
               if (this$serviceMessageId == null) {
                  if (other$serviceMessageId == null) {
                     break label88;
                  }
               } else if (this$serviceMessageId.equals(other$serviceMessageId)) {
                  break label88;
               }

               return false;
            }

            Object this$messageTimeStamp = this.getMessageTimeStamp();
            Object other$messageTimeStamp = other.getMessageTimeStamp();
            if (this$messageTimeStamp == null) {
               if (other$messageTimeStamp != null) {
                  return false;
               }
            } else if (!this$messageTimeStamp.equals(other$messageTimeStamp)) {
               return false;
            }

            label74: {
               Object this$sourceAppId = this.getSourceAppId();
               Object other$sourceAppId = other.getSourceAppId();
               if (this$sourceAppId == null) {
                  if (other$sourceAppId == null) {
                     break label74;
                  }
               } else if (this$sourceAppId.equals(other$sourceAppId)) {
                  break label74;
               }

               return false;
            }

            Object this$authenticationUser = this.getAuthenticationUser();
            Object other$authenticationUser = other.getAuthenticationUser();
            if (this$authenticationUser == null) {
               if (other$authenticationUser != null) {
                  return false;
               }
            } else if (!this$authenticationUser.equals(other$authenticationUser)) {
               return false;
            }

            Object this$authorization = this.getAuthorization();
            Object other$authorization = other.getAuthorization();
            if (this$authorization == null) {
               if (other$authorization != null) {
                  return false;
               }
            } else if (!this$authorization.equals(other$authorization)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof ServiceHeader;
   }

   @Generated
   public int hashCode() {
      int result = super.hashCode();
      Object $servicePath = this.getServicePath();
      result = result * 59 + ($servicePath == null ? 43 : $servicePath.hashCode());
      Object $clientMessageId = this.getClientMessageId();
      result = result * 59 + ($clientMessageId == null ? 43 : $clientMessageId.hashCode());
      Object $transactionId = this.getTransactionId();
      result = result * 59 + ($transactionId == null ? 43 : $transactionId.hashCode());
      Object $serviceMessageId = this.getServiceMessageId();
      result = result * 59 + ($serviceMessageId == null ? 43 : $serviceMessageId.hashCode());
      Object $messageTimeStamp = this.getMessageTimeStamp();
      result = result * 59 + ($messageTimeStamp == null ? 43 : $messageTimeStamp.hashCode());
      Object $sourceAppId = this.getSourceAppId();
      result = result * 59 + ($sourceAppId == null ? 43 : $sourceAppId.hashCode());
      Object $authenticationUser = this.getAuthenticationUser();
      result = result * 59 + ($authenticationUser == null ? 43 : $authenticationUser.hashCode());
      Object $authorization = this.getAuthorization();
      result = result * 59 + ($authorization == null ? 43 : $authorization.hashCode());
      return result;
   }

   @Generated
   public String getTransactionId() {
      return this.transactionId;
   }

   @Generated
   public String getAuthorization() {
      return this.authorization;
   }

   @Generated
   public void setAuthorization(String authorization) {
      this.authorization = authorization;
   }

   @Generated
   public ServiceHeader(String servicePath, String clientMessageId, String transactionId, String serviceMessageId, Date messageTimeStamp, String sourceAppId, String authenticationUser, String authorization) {
      this.servicePath = servicePath;
      this.clientMessageId = clientMessageId;
      this.transactionId = transactionId;
      this.serviceMessageId = serviceMessageId;
      this.messageTimeStamp = messageTimeStamp;
      this.sourceAppId = sourceAppId;
      this.authenticationUser = authenticationUser;
      this.authorization = authorization;
   }

   @Generated
   public ServiceHeader() {
   }

   @Generated
   public void setServicePath(String servicePath) {
      this.servicePath = servicePath;
   }

   @Generated
   public String getServicePath() {
      return this.servicePath;
   }

   @Generated
   public void setClientMessageId(String clientMessageId) {
      this.clientMessageId = clientMessageId;
   }

   @Generated
   public String getClientMessageId() {
      return this.clientMessageId;
   }

   @Generated
   public void setTransactionId(String transactionId) {
      this.transactionId = transactionId;
   }

   @Generated
   public void setMessageTimeStamp(Date messageTimeStamp) {
      this.messageTimeStamp = messageTimeStamp;
   }

   @Generated
   public Date getMessageTimeStamp() {
      return this.messageTimeStamp;
   }

   @Generated
   public void setSourceAppId(String sourceAppId) {
      this.sourceAppId = sourceAppId;
   }

   @Generated
   public String getSourceAppId() {
      return this.sourceAppId;
   }

   @Generated
   public void setAuthenticationUser(String authenticationUser) {
      this.authenticationUser = authenticationUser;
   }

   @Generated
   public String getAuthenticationUser() {
      return this.authenticationUser;
   }

   @Generated
   public abstract static class ServiceHeaderBuilder<C extends ServiceHeader, B extends ServiceHeader.ServiceHeaderBuilder<C, B>> extends BaseServiceHeader.BaseServiceHeaderBuilder<C, B> {
      @Generated
      private String servicePath;
      @Generated
      private String clientMessageId;
      @Generated
      private String transactionId;
      @Generated
      private String serviceMessageId;
      @Generated
      private Date messageTimeStamp;
      @Generated
      private String sourceAppId;
      @Generated
      private String authenticationUser;
      @Generated
      private String authorization;

      @Generated
      public B servicePath(String servicePath) {
         this.servicePath = servicePath;
         return this.self();
      }

      @Generated
      public B clientMessageId(String clientMessageId) {
         this.clientMessageId = clientMessageId;
         return this.self();
      }

      @Generated
      public B transactionId(String transactionId) {
         this.transactionId = transactionId;
         return this.self();
      }

      @Generated
      public B serviceMessageId(String serviceMessageId) {
         this.serviceMessageId = serviceMessageId;
         return this.self();
      }

      @Generated
      public B messageTimeStamp(Date messageTimeStamp) {
         this.messageTimeStamp = messageTimeStamp;
         return this.self();
      }

      @Generated
      public B sourceAppId(String sourceAppId) {
         this.sourceAppId = sourceAppId;
         return this.self();
      }

      @Generated
      public B authenticationUser(String authenticationUser) {
         this.authenticationUser = authenticationUser;
         return this.self();
      }

      @JsonIgnore
      @Generated
      public B authorization(String authorization) {
         this.authorization = authorization;
         return this.self();
      }

      @Generated
      protected abstract B self();

      @Generated
      public abstract C build();

      @Generated
      public String toString() {
         String var10000 = super.toString();
         return "ServiceHeader.ServiceHeaderBuilder(super=" + var10000 + ", servicePath=" + this.servicePath + ", clientMessageId=" + this.clientMessageId + ", transactionId=" + this.transactionId + ", serviceMessageId=" + this.serviceMessageId + ", messageTimeStamp=" + String.valueOf(this.messageTimeStamp) + ", sourceAppId=" + this.sourceAppId + ", authenticationUser=" + this.authenticationUser + ", authorization=" + this.authorization + ")";
      }
   }

   @Generated
   private static final class ServiceHeaderBuilderImpl extends ServiceHeader.ServiceHeaderBuilder<ServiceHeader, ServiceHeader.ServiceHeaderBuilderImpl> {
      @Generated
      protected ServiceHeader.ServiceHeaderBuilderImpl self() {
         return this;
      }

      @Generated
      public ServiceHeader build() {
         return new ServiceHeader(this);
      }
   }
}
