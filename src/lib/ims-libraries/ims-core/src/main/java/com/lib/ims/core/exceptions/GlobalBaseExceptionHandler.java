package com.lib.ims.core.exceptions;

import com.lib.ims.core.model.response.BaseResponseFile;
import com.lib.ims.core.utils.ResponseUtils;
import com.lib.ims.i18n.config.I18n;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.Generated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;


@Order
@RestControllerAdvice
@SuppressWarnings({"unchecked", "rawtypes"})
public class GlobalBaseExceptionHandler extends ResponseEntityExceptionHandler {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(GlobalBaseExceptionHandler.class);

   @ExceptionHandler({Exception.class})
   protected ResponseEntity<Object> handleAllException(Exception ex) {
      log.error("Error Exception: {}", ex.getMessage(), ex);
      ErrorCode errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
      return ResponseUtils.error(errorCode.getCode(), errorCode.getMessage(), errorCode.getHttpStatus());
   }

   @ExceptionHandler({ApplicationException.class})
   protected ResponseEntity<Object> handleAllApplicationException(ApplicationException ex) {
      log.error("Error ApplicationException: {}", ex.getMessage(), ex);
      IErrorCode errorCode = ex.getErrorCode();
      String message = I18n.get(errorCode.getMessageKey());
      if (org.apache.commons.lang3.StringUtils.isNotBlank(ex.getCustomMessage())) {
          message = I18n.get(ex.getCustomMessage());
      }
      if (ex.getMessageArgs() != null && ex.getMessageArgs().length > 0) {
          message = String.format(message, ex.getMessageArgs());
      }
      return ResponseUtils.error(errorCode.getCode(), message, ex.getData(), errorCode.getHttpStatus());
   }

   @ExceptionHandler({FileException.class})
   public ResponseEntity<Object> handleFileException(FileException ex) {
      log.error("Error handleFileException: {}", ex.getMessage(), ex);
      BaseResponseFile baseResponseFile = new BaseResponseFile(ex.getFileData(), ex.getFileName(), ex.getMineType());
      return ResponseUtils.getResponseFile(baseResponseFile);
   }

   @ExceptionHandler({StreamFileException.class})
   public ResponseEntity<Object> handleStreamFileException(StreamFileException ex) throws IOException {
      log.error("Error handleStreamFileException: {}", ex.getMessage(), ex);
      BaseResponseFile baseResponseFile = new BaseResponseFile(Files.readAllBytes(Paths.get(ex.getPath())), ex.getFileName(), ex.getMineType());
      return ResponseUtils.getResponseFile(baseResponseFile);
   }

   @ExceptionHandler({ConstraintViolationException.class})
   public ResponseEntity<Object> handleConstraintViolationException(ConstraintViolationException ex) {
      log.error("Invalid request exception occurred {}", ex.getMessage(), ex);
      ErrorCode errorCode = ErrorCode.ARGUMENT_NOT_VALID;
      return ResponseUtils.error(errorCode.getCode(), errorCode.getMessage(), this.getSubErrors(ex), errorCode.getHttpStatus());
   }

   @ExceptionHandler({DataIntegrityViolationException.class})
   public ResponseEntity<Object> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
      log.error("Error DataIntegrityViolationException: {}", ex.getMessage(), ex);
      ErrorCode errorCode = ErrorCode.DATA_INTEGRITY_VIOLATION;
      return ResponseUtils.error(errorCode.getCode(), errorCode.getMessage(), (Object)null, errorCode.getHttpStatus());
   }

   @Nullable
   protected ResponseEntity<Object> handleMaxUploadSizeExceededException(@NonNull MaxUploadSizeExceededException ex, @NonNull HttpHeaders headers, @NonNull HttpStatusCode status, @NonNull WebRequest request) {
      ErrorCode errorCode = ErrorCode.PAYLOAD_TOO_LARGE;
      return ResponseUtils.error(errorCode.getCode(), errorCode.getMessage(), errorCode.getHttpStatus());
   }

   protected ResponseEntity<Object> handleNoResourceFoundException(@NonNull NoResourceFoundException ex, @NonNull HttpHeaders headers, @NonNull HttpStatusCode status, @NonNull WebRequest request) {
      ErrorCode errorCode = ErrorCode.NOT_FOUND;
      return ResponseUtils.error(errorCode.getCode(), errorCode.getMessage(), errorCode.getHttpStatus());
   }

   protected ResponseEntity<Object> handleMethodArgumentNotValid(@NonNull MethodArgumentNotValidException ex, @NonNull HttpHeaders headers, @NonNull HttpStatusCode status, @NonNull WebRequest request) {
      log.error("Error Exception handleMethodArgumentNotValid: {}", ex.getMessage(), ex);
      ErrorCode errorCode = ErrorCode.ARGUMENT_NOT_VALID;
      return ResponseUtils.error(errorCode.getCode(), errorCode.getMessage(), this.getSubErrors(ex), errorCode.getHttpStatus());
   }

   protected ResponseEntity<Object> handleHandlerMethodValidationException(@NonNull HandlerMethodValidationException ex, @NonNull HttpHeaders headers, @NonNull HttpStatusCode status, @NonNull WebRequest request) {
      log.error("Error Exception HandlerMethodValidationException: {}", ex.getMessage(), ex);
      ErrorCode errorCode = ErrorCode.ARGUMENT_NOT_VALID;
      return ResponseUtils.error(errorCode.getCode(), errorCode.getMessage(), this.getSubErrors(ex), errorCode.getHttpStatus());
   }

   private List<GlobalBaseExceptionHandler.SubError> getSubErrors(MethodArgumentNotValidException e) {
      List<GlobalBaseExceptionHandler.SubError> subErrors = new ArrayList();
      List<FieldError> fieldErrors = e.getBindingResult().getFieldErrors();
      Iterator var4 = fieldErrors.iterator();

      while(var4.hasNext()) {
         FieldError fieldError = (FieldError)var4.next();
         GlobalBaseExceptionHandler.SubError subError = new GlobalBaseExceptionHandler.SubError(fieldError.getField(), Objects.equals(fieldError.getCode(), "ValidTypeFile") ? null : fieldError.getRejectedValue(), I18n.get(fieldError.getDefaultMessage()));
         subErrors.add(subError);
      }

      return subErrors;
   }

   private List<GlobalBaseExceptionHandler.SubError> getSubErrors(HandlerMethodValidationException ex) {
      return (List)ex.getAllErrors().stream().map((error) -> {
         if (error instanceof FieldError) {
            FieldError fieldError = (FieldError)error;
            return new GlobalBaseExceptionHandler.SubError(fieldError.getField(), fieldError.getRejectedValue(), fieldError.getDefaultMessage());
         } else {
            return new GlobalBaseExceptionHandler.SubError((String)null, (Object)null, error.getDefaultMessage());
         }
      }).collect(Collectors.toList());
   }

   private List<GlobalBaseExceptionHandler.SubError> getSubErrors(ConstraintViolationException ex) {
      List<GlobalBaseExceptionHandler.SubError> subErrors = new ArrayList();
      Iterator var3 = ex.getConstraintViolations().iterator();

      while(var3.hasNext()) {
         ConstraintViolation<?> violation = (ConstraintViolation)var3.next();
         GlobalBaseExceptionHandler.SubError subError = new GlobalBaseExceptionHandler.SubError(String.valueOf(violation.getPropertyPath() == null ? "" : violation.getPropertyPath()), violation.getInvalidValue(), I18n.get(violation.getMessage()));
         subErrors.add(subError);
      }

      return subErrors;
   }

   public static record SubError(String fieldName, Object fieldValue, String message) {
      public SubError(String fieldName, Object fieldValue, String message) {
         this.fieldName = fieldName;
         this.fieldValue = fieldValue;
         this.message = message;
      }

      public String fieldName() {
         return this.fieldName;
      }

      public Object fieldValue() {
         return this.fieldValue;
      }

      public String message() {
         return this.message;
      }
   }
}
