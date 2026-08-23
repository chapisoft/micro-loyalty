package com.lib.ims.core.model.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonFormat.Shape;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import java.time.LocalDateTime;
import lombok.Generated;


@JsonInclude(Include.NON_NULL)
@SuppressWarnings({"unchecked", "rawtypes"})
public class ApiResponse<T> {
   private int status;
   private boolean success;
   private String message;
   private T data;
   private String errorCode;
   @JsonFormat(
      shape = Shape.STRING,
      pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS"
   )
   private LocalDateTime timestamp;

   public static <T> ApiResponse<T> success(T data, String message) {
      return ApiResponse.<T>builder()
              .status(200)
              .success(true)
              .message(message)
              .data(data)
              .timestamp(LocalDateTime.now())
              .build();
   }

   public static <T> ApiResponse<T> success(String message) {
      return success(null, message);
   }

   public static <T> ApiResponse<T> error(int status, String message, String errorCode) {
      return ApiResponse.<T>builder()
              .status(status)
              .success(false)
              .message(message)
              .errorCode(errorCode)
              .timestamp(LocalDateTime.now())
              .build();
   }

   public static <T> ApiResponse<T> error(int status, String message) {
      return error(status, message, (String)null);
   }

   @Generated
   public static <T> ApiResponse.ApiResponseBuilder<T> builder() {
      return new ApiResponse.ApiResponseBuilder();
   }

   @Generated
   public int getStatus() {
      return this.status;
   }

   @Generated
   public boolean isSuccess() {
      return this.success;
   }

   @Generated
   public String getMessage() {
      return this.message;
   }

   @Generated
   public T getData() {
      return this.data;
   }

   @Generated
   public String getErrorCode() {
      return this.errorCode;
   }

   @Generated
   public LocalDateTime getTimestamp() {
      return this.timestamp;
   }

   @Generated
   public void setStatus(int status) {
      this.status = status;
   }

   @Generated
   public void setSuccess(boolean success) {
      this.success = success;
   }

   @Generated
   public void setMessage(String message) {
      this.message = message;
   }

   @Generated
   public void setData(T data) {
      this.data = data;
   }

   @Generated
   public void setErrorCode(String errorCode) {
      this.errorCode = errorCode;
   }

   @Generated
   public void setTimestamp(LocalDateTime timestamp) {
      this.timestamp = timestamp;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof ApiResponse)) {
         return false;
      } else {
         ApiResponse<?> other = (ApiResponse)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (this.getStatus() != other.getStatus()) {
            return false;
         } else if (this.isSuccess() != other.isSuccess()) {
            return false;
         } else {
            label64: {
               Object this$message = this.getMessage();
               Object other$message = other.getMessage();
               if (this$message == null) {
                  if (other$message == null) {
                     break label64;
                  }
               } else if (this$message.equals(other$message)) {
                  break label64;
               }

               return false;
            }

            label57: {
               Object this$data = this.getData();
               Object other$data = other.getData();
               if (this$data == null) {
                  if (other$data == null) {
                     break label57;
                  }
               } else if (this$data.equals(other$data)) {
                  break label57;
               }

               return false;
            }

            Object this$errorCode = this.getErrorCode();
            Object other$errorCode = other.getErrorCode();
            if (this$errorCode == null) {
               if (other$errorCode != null) {
                  return false;
               }
            } else if (!this$errorCode.equals(other$errorCode)) {
               return false;
            }

            Object this$timestamp = this.getTimestamp();
            Object other$timestamp = other.getTimestamp();
            if (this$timestamp == null) {
               if (other$timestamp != null) {
                  return false;
               }
            } else if (!this$timestamp.equals(other$timestamp)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof ApiResponse;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      result = result * 59 + this.getStatus();
      result = result * 59 + (this.isSuccess() ? 79 : 97);
      Object $message = this.getMessage();
      result = result * 59 + ($message == null ? 43 : $message.hashCode());
      Object $data = this.getData();
      result = result * 59 + ($data == null ? 43 : $data.hashCode());
      Object $errorCode = this.getErrorCode();
      result = result * 59 + ($errorCode == null ? 43 : $errorCode.hashCode());
      Object $timestamp = this.getTimestamp();
      result = result * 59 + ($timestamp == null ? 43 : $timestamp.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      int var10000 = this.getStatus();
      return "ApiResponse(status=" + var10000 + ", success=" + this.isSuccess() + ", message=" + this.getMessage() + ", data=" + String.valueOf(this.getData()) + ", errorCode=" + this.getErrorCode() + ", timestamp=" + String.valueOf(this.getTimestamp()) + ")";
   }

   @Generated
   public ApiResponse() {
   }

   @Generated
   public ApiResponse(int status, boolean success, String message, T data, String errorCode, LocalDateTime timestamp) {
      this.status = status;
      this.success = success;
      this.message = message;
      this.data = data;
      this.errorCode = errorCode;
      this.timestamp = timestamp;
   }

   @Generated
   public static class ApiResponseBuilder<T> {
      @Generated
      private int status;
      @Generated
      private boolean success;
      @Generated
      private String message;
      @Generated
      private T data;
      @Generated
      private String errorCode;
      @Generated
      private LocalDateTime timestamp;

      @Generated
      ApiResponseBuilder() {
      }

      @Generated
      public ApiResponse.ApiResponseBuilder<T> status(int status) {
         this.status = status;
         return this;
      }

      @Generated
      public ApiResponse.ApiResponseBuilder<T> success(boolean success) {
         this.success = success;
         return this;
      }

      @Generated
      public ApiResponse.ApiResponseBuilder<T> message(String message) {
         this.message = message;
         return this;
      }

      @Generated
      public ApiResponse.ApiResponseBuilder<T> data(T data) {
         this.data = data;
         return this;
      }

      @Generated
      public ApiResponse.ApiResponseBuilder<T> errorCode(String errorCode) {
         this.errorCode = errorCode;
         return this;
      }

      @JsonFormat(
         shape = Shape.STRING,
         pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS"
      )
      @Generated
      public ApiResponse.ApiResponseBuilder<T> timestamp(LocalDateTime timestamp) {
         this.timestamp = timestamp;
         return this;
      }

      @Generated
      public ApiResponse<T> build() {
         return new ApiResponse(this.status, this.success, this.message, this.data, this.errorCode, this.timestamp);
      }

      @Generated
      public String toString() {
         int var10000 = this.status;
         return "ApiResponse.ApiResponseBuilder(status=" + var10000 + ", success=" + this.success + ", message=" + this.message + ", data=" + String.valueOf(this.data) + ", errorCode=" + this.errorCode + ", timestamp=" + String.valueOf(this.timestamp) + ")";
      }
   }
}
