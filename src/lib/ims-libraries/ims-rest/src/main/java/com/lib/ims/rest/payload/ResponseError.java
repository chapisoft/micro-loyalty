package com.lib.ims.rest.payload;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.Generated;

public class ResponseError implements Serializable {
   private static final long serialVersionUID = 1L;
   private final String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss"));
   private final String clientMessageId;
   private final String transactionId;
   private int code = 9999;
   private String message = "Có lỗi xảy ra! Xin vui lòng liên hệ Administrator";
   private final String path;
   private int status;

   public ResponseError(String clientMessageId, String transactionId, String path) {
      this.clientMessageId = clientMessageId;
      this.transactionId = transactionId;
      this.path = path;
      this.status = 500;
   }

   public ResponseError error(int code, String message, int status) {
      this.code = code;
      this.message = message;
      this.status = status;
      return this;
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
}
