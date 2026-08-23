package com.lib.ims.core.exceptions;

import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpStatus;



public enum ErrorCode implements IErrorCode {
   BAD_REQUEST(400, "common.error.bad.request", HttpStatus.BAD_REQUEST),
   MISSING_REQUEST_PARAMETER(400, "common.error.missing.parameter", HttpStatus.BAD_REQUEST),
   ARGUMENT_TYPE_MISMATCH(400, "common.error.argument.type.miss.match", HttpStatus.BAD_REQUEST),
   ARGUMENT_NOT_VALID(400, "common.error.argument.not.valid", HttpStatus.BAD_REQUEST),
   UNAUTHORIZED(401, "common.error.unauthorized", HttpStatus.UNAUTHORIZED),
   FORBIDDEN(403, "common.error.forbidden", HttpStatus.FORBIDDEN),
   NOT_FOUND(404, "common.error.not.found", HttpStatus.NOT_FOUND),
   METHOD_NOT_ALLOWED(405, "common.error.method.not.allow", HttpStatus.METHOD_NOT_ALLOWED),
   NOT_ACCEPTABLE(406, "common.error.not.acceptable", HttpStatus.NOT_ACCEPTABLE),
   REQUEST_TIMEOUT(408, "common.error.request.timeout", HttpStatus.REQUEST_TIMEOUT),
   DATA_INTEGRITY_VIOLATION(409, "common.error.data.integrity.violation", HttpStatus.CONFLICT),
   GONE(410, "common.error.gone", HttpStatus.GONE),
   PAYLOAD_TOO_LARGE(413, "common.error.payload.too.large", HttpStatus.PAYLOAD_TOO_LARGE),
   UNSUPPORTED_MEDIA_TYPE(415, "common.error.un.support.media.type", HttpStatus.UNSUPPORTED_MEDIA_TYPE),
   TOO_MANY_REQUESTS(429, "common.error.too.many.requests", HttpStatus.TOO_MANY_REQUESTS),
   INTERNAL_SERVER_ERROR(500, "common.error.server.error", HttpStatus.INTERNAL_SERVER_ERROR),
   NOT_IMPLEMENTED(501, "common.error.not.implemented", HttpStatus.NOT_IMPLEMENTED),
   BAD_GATEWAY(502, "common.error.bad.gateway", HttpStatus.BAD_GATEWAY),
   SERVICE_UNAVAILABLE(503, "common.error.service.unavailable", HttpStatus.SERVICE_UNAVAILABLE),
   GATEWAY_TIMEOUT(504, "common.error.gateway.timeout", HttpStatus.GATEWAY_TIMEOUT),
   VALIDATION_ERROR(400, "common.error.validate", HttpStatus.BAD_REQUEST),
   VALIDATE_FORM_EXCEPTION(400, "common.error.validate.form", HttpStatus.BAD_REQUEST),
   VALIDATE_DUPLICATE_EXCEPTION(400, "common.error.validate.duplicate", HttpStatus.BAD_REQUEST),
   DATA_VALIDATE_EXCEPTION(400, "common.error.data.validate", HttpStatus.BAD_REQUEST),
   VALIDATE_EXCEPTION(400, "common.error.validate", HttpStatus.BAD_REQUEST),
   FILE_FORMAT_INVALID(400, "common.error.file.format.invalid", HttpStatus.BAD_REQUEST),
   COMMON_ERROR_UPLOAD_FILE(400, "common.error.uploadFile", HttpStatus.BAD_REQUEST),
   COMMON_ERROR_IMPORT_DUPLICATE(400, "common.error.import.duplicate", HttpStatus.BAD_REQUEST),
   USER_NOT_EXISTS(400, "user.not.exists", HttpStatus.BAD_REQUEST),
   RECORD_ALREADY_EXIST(400, "common.error.record.already.exist", HttpStatus.BAD_REQUEST),
   RECORD_ALREADY_EXIST_REFERENCE(400, "common.error.record.already.exist.reference", HttpStatus.BAD_REQUEST),
   RECORD_DOES_NOT_EXIST(400, "common.error.record.does.not.exist", HttpStatus.BAD_REQUEST),
   RECORD_DEACTIVATED(400, "common.error.record.deactivated", HttpStatus.BAD_REQUEST),
   ACCESS_TOKEN_INVALID(401, "common.error.access.token.invalid", HttpStatus.UNAUTHORIZED),
   ACCESS_TOKEN_EXPIRED(401, "common.error.access.token.expired", HttpStatus.UNAUTHORIZED),
   REFRESH_TOKEN_INVALID(401, "common.error.refresh.token.invalid", HttpStatus.UNAUTHORIZED),
   REFRESH_TOKEN_EXPIRED(401, "common.error.refresh.token.expired", HttpStatus.UNAUTHORIZED),
   THIRD_PARTY_SERVICE_ERROR(500, "common.error.execute.thirty.service", HttpStatus.INTERNAL_SERVER_ERROR),
   APPLICATION_EXCEPTION(500, "common.error.server.error", HttpStatus.INTERNAL_SERVER_ERROR),
   FILE_EXCEPTION(500, "common.error.file", HttpStatus.INTERNAL_SERVER_ERROR),
   ERROR_IMPORT_EXCEPTION(500, "common.error.import", HttpStatus.INTERNAL_SERVER_ERROR);

   private final int code;
   private final String messageKey;
   private final HttpStatus httpStatus;
   private final String domain;
   private final boolean allowCustomMessage;

   private ErrorCode(int code, String messageKey, HttpStatus httpStatus) {
      this(code, messageKey, httpStatus, false);
   }

   private ErrorCode(int code, String messageKey, HttpStatus httpStatus, boolean allowCustomMessage) {
      this.code = code;
      this.messageKey = messageKey;
      this.httpStatus = httpStatus;
      this.domain = "common";
      this.allowCustomMessage = allowCustomMessage;
   }

   public String getMessageKey() {
      return this.messageKey;
   }

   public int getCode() {
      return this.code;
   }

   public HttpStatus getHttpStatus() {
      return this.httpStatus;
   }

   public String getDomain() {
      return this.domain;
   }

   public String getFullCode() {
      return this.domain + "." + this.code;
   }

   public String getMessage(String... customMessage) {
      return this.allowCustomMessage && customMessage != null && customMessage.length > 0 && StringUtils.isNotBlank(customMessage[0]) ? customMessage[0] : this.messageKey;
   }
}
