package com.lib.ims.rest.payload;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.io.Serializable;
import lombok.Generated;



@JsonIgnoreProperties(
   ignoreUnknown = true
)
public class ResponseData<T> implements Serializable {
   private static final long serialVersionUID = 1L;
   private String timestamp;
   private String clientMessageId;
   private String transactionId;
   private int code;
   private String message;
   private String path;
   private int status;
   private int soaErrorCode;
   private String soaErrorDesc;
   private T data;

   @Generated
   public String getTimestamp() {
      return this.timestamp;
   }

   @Generated
   public String getClientMessageId() {
      return this.clientMessageId;
   }

   @Generated
   public String getTransactionId() {
      return this.transactionId;
   }

   @Generated
   public int getCode() {
      return this.code;
   }

   @Generated
   public String getMessage() {
      return this.message;
   }

   @Generated
   public String getPath() {
      return this.path;
   }

   @Generated
   public int getStatus() {
      return this.status;
   }

   @Generated
   public int getSoaErrorCode() {
      return this.soaErrorCode;
   }

   @Generated
   public String getSoaErrorDesc() {
      return this.soaErrorDesc;
   }

   @Generated
   public T getData() {
      return this.data;
   }

   @Generated
   public void setTimestamp(String timestamp) {
      this.timestamp = timestamp;
   }

   @Generated
   public void setClientMessageId(String clientMessageId) {
      this.clientMessageId = clientMessageId;
   }

   @Generated
   public void setTransactionId(String transactionId) {
      this.transactionId = transactionId;
   }

   @Generated
   public void setCode(int code) {
      this.code = code;
   }

   @Generated
   public void setMessage(String message) {
      this.message = message;
   }

   @Generated
   public void setPath(String path) {
      this.path = path;
   }

   @Generated
   public void setStatus(int status) {
      this.status = status;
   }

   @Generated
   public void setSoaErrorCode(int soaErrorCode) {
      this.soaErrorCode = soaErrorCode;
   }

   @Generated
   public void setSoaErrorDesc(String soaErrorDesc) {
      this.soaErrorDesc = soaErrorDesc;
   }

   @Generated
   public void setData(T data) {
      this.data = data;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof ResponseData)) {
         return false;
      } else {
         ResponseData<?> other = (ResponseData<?>)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (this.getCode() != other.getCode()) {
            return false;
         } else if (this.getStatus() != other.getStatus()) {
            return false;
         } else if (this.getSoaErrorCode() != other.getSoaErrorCode()) {
            return false;
         } else {
            label102: {
               Object this$timestamp = this.getTimestamp();
               Object other$timestamp = other.getTimestamp();
               if (this$timestamp == null) {
                  if (other$timestamp == null) {
                     break label102;
                  }
               } else if (this$timestamp.equals(other$timestamp)) {
                  break label102;
               }

               return false;
            }

            Object this$clientMessageId = this.getClientMessageId();
            Object other$clientMessageId = other.getClientMessageId();
            if (this$clientMessageId == null) {
               if (other$clientMessageId != null) {
                  return false;
               }
            } else if (!this$clientMessageId.equals(other$clientMessageId)) {
               return false;
            }

            label88: {
               Object this$transactionId = this.getTransactionId();
               Object other$transactionId = other.getTransactionId();
               if (this$transactionId == null) {
                  if (other$transactionId == null) {
                     break label88;
                  }
               } else if (this$transactionId.equals(other$transactionId)) {
                  break label88;
               }

               return false;
            }

            Object this$message = this.getMessage();
            Object other$message = other.getMessage();
            if (this$message == null) {
               if (other$message != null) {
                  return false;
               }
            } else if (!this$message.equals(other$message)) {
               return false;
            }

            label74: {
               Object this$path = this.getPath();
               Object other$path = other.getPath();
               if (this$path == null) {
                  if (other$path == null) {
                     break label74;
                  }
               } else if (this$path.equals(other$path)) {
                  break label74;
               }

               return false;
            }

            Object this$soaErrorDesc = this.getSoaErrorDesc();
            Object other$soaErrorDesc = other.getSoaErrorDesc();
            if (this$soaErrorDesc == null) {
               if (other$soaErrorDesc != null) {
                  return false;
               }
            } else if (!this$soaErrorDesc.equals(other$soaErrorDesc)) {
               return false;
            }

            Object this$data = this.getData();
            Object other$data = other.getData();
            if (this$data == null) {
               if (other$data == null) {
                  return true;
               }
            } else if (this$data.equals(other$data)) {
               return true;
            }

            return false;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof ResponseData;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      result = result * 59 + this.getCode();
      result = result * 59 + this.getStatus();
      result = result * 59 + this.getSoaErrorCode();
      Object $timestamp = this.getTimestamp();
      result = result * 59 + ($timestamp == null ? 43 : $timestamp.hashCode());
      Object $clientMessageId = this.getClientMessageId();
      result = result * 59 + ($clientMessageId == null ? 43 : $clientMessageId.hashCode());
      Object $transactionId = this.getTransactionId();
      result = result * 59 + ($transactionId == null ? 43 : $transactionId.hashCode());
      Object $message = this.getMessage();
      result = result * 59 + ($message == null ? 43 : $message.hashCode());
      Object $path = this.getPath();
      result = result * 59 + ($path == null ? 43 : $path.hashCode());
      Object $soaErrorDesc = this.getSoaErrorDesc();
      result = result * 59 + ($soaErrorDesc == null ? 43 : $soaErrorDesc.hashCode());
      Object $data = this.getData();
      result = result * 59 + ($data == null ? 43 : $data.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getTimestamp();
      return "ResponseData(timestamp=" + var10000 + ", clientMessageId=" + this.getClientMessageId() + ", transactionId=" + this.getTransactionId() + ", code=" + this.getCode() + ", message=" + this.getMessage() + ", path=" + this.getPath() + ", status=" + this.getStatus() + ", soaErrorCode=" + this.getSoaErrorCode() + ", soaErrorDesc=" + this.getSoaErrorDesc() + ", data=" + String.valueOf(this.getData()) + ")";
   }
}
