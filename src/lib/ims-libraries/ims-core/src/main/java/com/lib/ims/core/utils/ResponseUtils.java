package com.lib.ims.core.utils;

import com.lib.ims.core.exceptions.ApplicationException;
import com.lib.ims.core.model.ResponseData;
import com.lib.ims.core.model.ResponseError;
import com.lib.ims.core.model.ServiceHeader;
import com.lib.ims.core.model.response.BaseResponseFile;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseEntity.BodyBuilder;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;


@SuppressWarnings({"unchecked", "rawtypes"})
public class ResponseUtils {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(ResponseUtils.class);

   private ResponseUtils() {
      throw new IllegalStateException("ResponseUtils");
   }

   public static <T> ResponseEntity<ResponseData<T>> success() {
      ServiceHeader serviceHeader = extractServiceHeader();
      return ResponseEntity.ok(new ResponseData(serviceHeader.getClientMessageId(), serviceHeader.getTransactionId(), serviceHeader.getHttpPath()));
   }

   public static <T> ResponseEntity<ResponseData<T>> success(T o) {
      ServiceHeader serviceHeader = extractServiceHeader();
      return ResponseEntity.ok((new ResponseData(serviceHeader.getClientMessageId(), serviceHeader.getTransactionId(), serviceHeader.getHttpPath())).success(o));
   }

   public static <T> ResponseEntity<ResponseData<T>> created() {
      ServiceHeader serviceHeader = extractServiceHeader();
      return ResponseEntity.status(HttpStatus.CREATED).body(new ResponseData(serviceHeader.getClientMessageId(), serviceHeader.getTransactionId(), serviceHeader.getHttpPath()));
   }

   public static <T> ResponseEntity<ResponseData<T>> created(T o) {
      ServiceHeader serviceHeader = extractServiceHeader();
      return ResponseEntity.status(HttpStatus.CREATED).body((new ResponseData(serviceHeader.getClientMessageId(), serviceHeader.getTransactionId(), serviceHeader.getHttpPath())).success(o));
   }

   public static ResponseEntity<Object> getResponseFile(BaseResponseFile baseResponseFile) {
      try {
         String filenameFinal = URLEncoder.encode(baseResponseFile.fileName(), StandardCharsets.UTF_8).replace("+", "%20");
         MediaType mediaType = StringUtils.isNotBlank(baseResponseFile.mineType()) ? MediaType.parseMediaType(baseResponseFile.mineType()) : MediaType.APPLICATION_OCTET_STREAM;
         HttpHeaders headers = new HttpHeaders();
         headers.setAccessControlExposeHeaders(List.of("Content-Disposition"));
         headers.setContentDisposition(ContentDisposition.builder("attachment").filename(filenameFinal).build());
         headers.setContentType(mediaType);
         return ((BodyBuilder)ResponseEntity.ok().headers(headers)).body(baseResponseFile.bytes());
      } catch (Exception var4) {
         log.error("[ResponseUtils getResponseLargeFileEntity] has error {} {}", var4, var4.getMessage());
         throw new ApplicationException(var4.getMessage());
      }
   }

   public static ResponseEntity<StreamingResponseBody> getResponseStreamingFile(BaseResponseFile baseResponseFile) {
      try {
         String filenameFinal = URLEncoder.encode(baseResponseFile.fileName(), StandardCharsets.UTF_8).replace("+", "%20");
         MediaType mediaType = StringUtils.isNotBlank(baseResponseFile.mineType()) ? MediaType.parseMediaType(baseResponseFile.mineType()) : MediaType.APPLICATION_OCTET_STREAM;
         HttpHeaders headers = new HttpHeaders();
         headers.setAccessControlExposeHeaders(List.of("Content-Disposition", "Content-Length"));
         headers.setContentDisposition(ContentDisposition.builder("attachment").filename(filenameFinal).build());
         headers.setContentType(mediaType);
         headers.set("Accept-Ranges", "bytes");
         Long contentLength = null;
         StreamingResponseBody responseBody;
         if (baseResponseFile.bytes() != null) {
            contentLength = (long)baseResponseFile.bytes().length;
            responseBody = createByteArrayStreamingBody(baseResponseFile.bytes());
         } else if (StringUtils.isNotBlank(baseResponseFile.path())) {
            Path path = Paths.get(baseResponseFile.path());
            contentLength = getFileSize(path);
            responseBody = createFileStreamingBody(path);
         } else if (baseResponseFile.inputStream() != null) {
            responseBody = createInputStreamStreamingBody(baseResponseFile.inputStream());
         } else {
            if (baseResponseFile.streamingResponseBody() == null) {
               log.error("[ResponseUtils getResponseStreamingFile] No file data found to stream");
               throw new ApplicationException();
            }

            responseBody = baseResponseFile.streamingResponseBody();
         }

         if (contentLength != null && contentLength > 0L) {
            headers.setContentLength(contentLength);
         }

         return ((BodyBuilder)ResponseEntity.ok().headers(headers)).body(responseBody);
      } catch (Exception var7) {
         log.error("[ResponseUtils getResponseStreamingFile] Error: {}", var7.getMessage(), var7);
         throw new ApplicationException();
      }
   }

   private static StreamingResponseBody createByteArrayStreamingBody(byte[] bytes) {
      return (outputStream) -> {
         try {
            BufferedOutputStream os = new BufferedOutputStream(outputStream, 65536);

            try {
               os.write(bytes);
               os.flush();
            } catch (Throwable var6) {
               try {
                  os.close();
               } catch (Throwable var5) {
                  var6.addSuppressed(var5);
               }

               throw var6;
            }

            os.close();
         } catch (IOException var7) {
            log.error("Error streaming byte array", var7);
            throw new ApplicationException("Streaming interrupted: " + var7.getMessage());
         }
      };
   }

   private static StreamingResponseBody createFileStreamingBody(Path path) {
      IMSUtils.logMemoryUsage("Before path streaming copy");
      return (outputStream) -> {
         try {
            BufferedInputStream is = new BufferedInputStream(Files.newInputStream(path), 65536);

            try {
               BufferedOutputStream os = new BufferedOutputStream(outputStream, 65536);

               try {
                  byte[] buffer = new byte[65536];

                  int bytesRead;
                  while((bytesRead = is.read(buffer)) != -1) {
                     os.write(buffer, 0, bytesRead);
                  }

                  os.flush();
                  IMSUtils.logMemoryUsage("After path streaming copy");
               } catch (Throwable var15) {
                  try {
                     os.close();
                  } catch (Throwable var14) {
                     var15.addSuppressed(var14);
                  }

                  throw var15;
               }

               os.close();
            } catch (Throwable var16) {
               try {
                  is.close();
               } catch (Throwable var13) {
                  var16.addSuppressed(var13);
               }

               throw var16;
            }

            is.close();
         } catch (IOException var17) {
            log.error("Error streaming file: {}", path, var17);
            throw new ApplicationException("Streaming interrupted: " + var17.getMessage());
         } finally {
            ;
         }
      };
   }

   private static StreamingResponseBody createInputStreamStreamingBody(InputStream inputStream) {
      return (outputStream) -> {
         IMSUtils.logMemoryUsage("Before inputStream streaming");
         int bufferSize = 65536;

         try {
            Object is = inputStream instanceof BufferedInputStream ? inputStream : new BufferedInputStream(inputStream, bufferSize);

            try {
               BufferedOutputStream os = new BufferedOutputStream(outputStream, bufferSize);

               try {
                  log.debug("InputStream class: {}", inputStream.getClass());
                  byte[] buffer = new byte[bufferSize];
                  long totalBytesRead = 0L;

                  int bytesRead;
                  while((bytesRead = ((InputStream)is).read(buffer)) != -1) {
                     os.write(buffer, 0, bytesRead);
                     totalBytesRead += (long)bytesRead;
                     if (totalBytesRead % (long)(bufferSize * 100) == 0L) {
                        log.debug("Streamed {} bytes", totalBytesRead);
                     }
                  }

                  os.flush();
                  log.info("Total bytes streamed: {}", totalBytesRead);
                  IMSUtils.logMemoryUsage("After inputStream streaming");
               } catch (Throwable var11) {
                  try {
                     os.close();
                  } catch (Throwable var10) {
                     var11.addSuppressed(var10);
                  }

                  throw var11;
               }

               os.close();
            } catch (Throwable var12) {
               if (is != null) {
                  try {
                     ((InputStream)is).close();
                  } catch (Throwable var9) {
                     var12.addSuppressed(var9);
                  }
               }

               throw var12;
            }

            if (is != null) {
               ((InputStream)is).close();
            }

         } catch (IOException var13) {
            log.error("Error streaming input stream", var13);
            throw new ApplicationException("Streaming interrupted: " + var13.getMessage());
         }
      };
   }

   private static Long getFileSize(Path path) {
      try {
         return Files.size(path);
      } catch (IOException var2) {
         log.warn("Could not determine file size for: {}", path, var2);
         return null;
      }
   }

   public static ResponseEntity<Object> error(int code, String message, HttpStatus status) {
      return ResponseEntity.status(status).body(getResponseDataError(code, message, (Object)null, status.value()));
   }

   public static <T> ResponseEntity<Object> error(int code, String message, T data, HttpStatus status) {
      return ResponseEntity.status(status).body(getResponseDataError(code, message, data, status.value()));
   }

   public static <T> ResponseData<T> getResponseDataError(int code, String message, T data, int status) {
      ServiceHeader serviceHeader = extractServiceHeader();
      return (new ResponseData(serviceHeader.getClientMessageId(), serviceHeader.getTransactionId(), serviceHeader.getHttpPath())).error(code, message, data, status);
   }

   public static ResponseError getResponseError(int code, String message, int status) {
      ServiceHeader serviceHeader = extractServiceHeader();
      return (new ResponseError(serviceHeader.getClientMessageId(), serviceHeader.getTransactionId(), serviceHeader.getHttpPath())).error(code, message, status);
   }

   private static ServiceHeader extractServiceHeader() {
      try {
         String clientMessageId = MDC.get("clientMessageId");
         String transactionId = MDC.get("transactionId");
         String servicePath = MDC.get("servicePath");
         return ((ServiceHeader.ServiceHeaderBuilder)ServiceHeader.builder().clientMessageId(clientMessageId).transactionId(transactionId).httpPath(servicePath)).build();
      } catch (Exception var3) {
         log.warn("Failed to parse service header from MDC", var3);
         return ServiceHeader.builder().build();
      }
   }
}
