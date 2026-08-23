package com.lib.ims.core.model;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.Generated;



public class ResponseData<T> implements Serializable {
   private static final long serialVersionUID = 1L;
   private String timestamp;
   private String clientMessageId;
   private String transactionId;
   private int code;
   private String message;
   private String path;
   private int status;
   private T data;

   public ResponseData(String clientMessageId, String transactionId, String path) {
      this.code = 0;
      this.timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss"));
      this.message = "Successful!";
      this.clientMessageId = clientMessageId;
      this.transactionId = transactionId;
      this.path = path;
      this.status = 200;
   }

   public ResponseData<T> success(T data) {
      this.data = data;
      return this;
   }

   public ResponseData<T> error(int code, String message, int status) {
      this.code = code;
      this.message = message;
      this.status = status;
      return this;
   }

   public ResponseData<T> error(int code, String message, T data, int status) {
      this.data = data;
      this.code = code;
      this.message = message;
      this.status = status;
      return this;
   }

   public void setData(T data) {
      this.data = data;
   }

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
         } else {
            label88: {
               Object this$timestamp = this.getTimestamp();
               Object other$timestamp = other.getTimestamp();
               if (this$timestamp == null) {
                  if (other$timestamp == null) {
                     break label88;
                  }
               } else if (this$timestamp.equals(other$timestamp)) {
                  break label88;
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

            label74: {
               Object this$transactionId = this.getTransactionId();
               Object other$transactionId = other.getTransactionId();
               if (this$transactionId == null) {
                  if (other$transactionId == null) {
                     break label74;
                  }
               } else if (this$transactionId.equals(other$transactionId)) {
                  break label74;
               }

               return false;
            }

            label67: {
               Object this$message = this.getMessage();
               Object other$message = other.getMessage();
               if (this$message == null) {
                  if (other$message == null) {
                     break label67;
                  }
               } else if (this$message.equals(other$message)) {
                  break label67;
               }

               return false;
            }

            Object this$path = this.getPath();
            Object other$path = other.getPath();
            if (this$path == null) {
               if (other$path != null) {
                  return false;
               }
            } else if (!this$path.equals(other$path)) {
               return false;
            }

            Object this$data = this.getData();
            Object other$data = other.getData();
            if (this$data == null) {
               if (other$data != null) {
                  return false;
               }
            } else if (!this$data.equals(other$data)) {
               return false;
            }

            return true;
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
      Object $data = this.getData();
      result = result * 59 + ($data == null ? 43 : $data.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getTimestamp();
      return "ResponseData(timestamp=" + var10000 + ", clientMessageId=" + this.getClientMessageId() + ", transactionId=" + this.getTransactionId() + ", code=" + this.getCode() + ", message=" + this.getMessage() + ", path=" + this.getPath() + ", status=" + this.getStatus() + ", data=" + String.valueOf(this.getData()) + ")";
   }

   @Generated
   public ResponseData() {
   }

   @Generated
   public ResponseData(String timestamp, String clientMessageId, String transactionId, int code, String message, String path, int status, T data) {
      this.timestamp = timestamp;
      this.clientMessageId = clientMessageId;
      this.transactionId = transactionId;
      this.code = code;
      this.message = message;
      this.path = path;
      this.status = status;
      this.data = data;
   }
}
