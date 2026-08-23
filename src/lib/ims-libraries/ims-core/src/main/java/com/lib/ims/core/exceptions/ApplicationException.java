package com.lib.ims.core.exceptions;

import com.lib.ims.i18n.config.I18n;
import java.util.Arrays;
import lombok.Generated;
import org.apache.commons.lang3.StringUtils;

public class ApplicationException extends RuntimeException {
   private final IErrorCode errorCode;
   private final Object data;
   private final String customMessage;
   private final Object[] messageArgs;

   public ApplicationException() {
      this(ErrorCode.INTERNAL_SERVER_ERROR, (String)null, (Object)null, (Object[])null);
   }

   public ApplicationException(String message) {
      this(ErrorCode.INTERNAL_SERVER_ERROR, message, (Object)null, (Object[])null);
   }

   public ApplicationException(String message, Object[] messageArgs) {
      this(ErrorCode.INTERNAL_SERVER_ERROR, message, (Object)null, messageArgs);
   }

   public ApplicationException(IErrorCode errorCode) {
      this(errorCode, (String)null, (Object)null, (Object[])null);
   }

   public ApplicationException(IErrorCode errorCode, String customMessage) {
      this(errorCode, customMessage, (Object)null, (Object[])null);
   }

   public ApplicationException(IErrorCode errorCode, Object data) {
      this(errorCode, (String)null, data, (Object[])null);
   }

   public ApplicationException(IErrorCode errorCode, Object[] messageArgs) {
      this(errorCode, (String)null, (Object)null, messageArgs);
   }

   public ApplicationException(IErrorCode errorCode, String customMessage, Object data, Object[] messageArgs) {
      super(buildMessage(errorCode, customMessage, messageArgs));
      this.errorCode = (IErrorCode)(errorCode != null ? errorCode : ErrorCode.INTERNAL_SERVER_ERROR);
      this.customMessage = customMessage;
      this.data = data;
      this.messageArgs = messageArgs;
   }

   public ApplicationException(IErrorCode errorCode, Throwable cause, String customMessage, Object data, Object[] messageArgs) {
      super(errorCode != null ? errorCode.getMessageKey() : null, cause);
      this.errorCode = (IErrorCode)(errorCode != null ? errorCode : ErrorCode.INTERNAL_SERVER_ERROR);
      this.customMessage = customMessage;
      this.data = data;
      this.messageArgs = messageArgs;
   }

   private static String buildMessage(IErrorCode errorCode, String customMessage, Object[] args) {
      String message;
      if (StringUtils.isNotBlank(customMessage)) {
         message = I18n.get(customMessage);
      } else if (errorCode != null) {
         message = I18n.get(errorCode instanceof ErrorCode ? ((ErrorCode)errorCode).getMessage() : errorCode.getMessageKey());
      } else {
         message = "Internal server error";
      }

      return args == null ? message : String.format(message, args);
   }

   public String getLocalizedMessage() {
      String var10000 = this.getClass().getSimpleName();
      return var10000 + "[" + this.errorCode.getDomain() + "." + this.errorCode.getCode() + "-" + this.getMessage() + "-" + String.valueOf(this.errorCode.getHttpStatus()) + "]";
   }

   @Generated
   public static ApplicationException.ApplicationExceptionBuilder builder() {
      return new ApplicationException.ApplicationExceptionBuilder();
   }

   @Generated
   public IErrorCode getErrorCode() {
      return this.errorCode;
   }

   @Generated
   public Object getData() {
      return this.data;
   }

   @Generated
   public String getCustomMessage() {
      return this.customMessage;
   }

   @Generated
   public Object[] getMessageArgs() {
      return this.messageArgs;
   }

   @Generated
   public static class ApplicationExceptionBuilder {
      @Generated
      private IErrorCode errorCode;
      @Generated
      private String customMessage;
      @Generated
      private Object data;
      @Generated
      private Object[] messageArgs;

      @Generated
      ApplicationExceptionBuilder() {
      }

      @Generated
      public ApplicationException.ApplicationExceptionBuilder errorCode(IErrorCode errorCode) {
         this.errorCode = errorCode;
         return this;
      }

      @Generated
      public ApplicationException.ApplicationExceptionBuilder customMessage(String customMessage) {
         this.customMessage = customMessage;
         return this;
      }

      @Generated
      public ApplicationException.ApplicationExceptionBuilder data(Object data) {
         this.data = data;
         return this;
      }

      @Generated
      public ApplicationException.ApplicationExceptionBuilder messageArgs(Object[] messageArgs) {
         this.messageArgs = messageArgs;
         return this;
      }

      @Generated
      public ApplicationException build() {
         return new ApplicationException(this.errorCode, this.customMessage, this.data, this.messageArgs);
      }

      @Generated
      public String toString() {
         String var10000 = String.valueOf(this.errorCode);
         return "ApplicationException.ApplicationExceptionBuilder(errorCode=" + var10000 + ", customMessage=" + this.customMessage + ", data=" + String.valueOf(this.data) + ", messageArgs=" + Arrays.deepToString(this.messageArgs) + ")";
      }
   }
}
