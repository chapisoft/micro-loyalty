package com.lib.ims.core.model.validates.constraint;

import com.lib.ims.core.model.validates.annotation.ValidTypeFile;
import com.lib.ims.core.utils.IMSUtils;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;


@SuppressWarnings({"unchecked", "rawtypes", "null"})
public class TypeFileConstraint implements ConstraintValidator<ValidTypeFile, List<MultipartFile>> {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(TypeFileConstraint.class);
   private String[] types;
   private long maxSize;
   private int maxLength;
   private final Tika tika = new Tika();
   private static final Map<String, List<String>> FILE_TYPE_RULES = new HashMap();
   private static final Pattern DANGEROUS_PATTERNS = Pattern.compile("(?i:javascript:|<script|<!ENTITY|<!DOCTYPE|<!ELEMENT|<include|xlink:|xliff|XMLDecoder|function\\(\\)|<%@ include|<%@ page)");
   private static final Pattern PDF_JAVASCRIPT_PATTERNS = Pattern.compile("(?is)/S\\s*/JavaScript|/JS\\s*([(<])|app\\.(alert|launchURL|execMenuItem)|this\\.(submitForm|exportDataObject)");

   public void initialize(ValidTypeFile constraintAnnotation) {
      this.types = constraintAnnotation.types();
      this.maxSize = (long)constraintAnnotation.maxSize() * 1024L * 1024L;
      this.maxLength = constraintAnnotation.maxLength();
   }

   public boolean isValid(List<MultipartFile> lsFile, ConstraintValidatorContext context) {
      if (lsFile == null) {
         return true;
      } else if (this.maxLength > 0 && lsFile.size() > this.maxLength) {
         this.setMessage(context, "Số lượng file vượt quá giới hạn cho phép: " + this.maxLength);
         return false;
      } else {
         List<String> allowedTypes = Arrays.stream(this.types).map(String::toUpperCase).toList();
         Iterator var4 = lsFile.iterator();

         while(var4.hasNext()) {
            MultipartFile multipartFile = (MultipartFile)var4.next();
            String fileName = multipartFile.getOriginalFilename();
            if (StringUtils.isBlank(fileName)) {
               this.setMessage(context, "Tên file không được để trống");
               return false;
            }

            if (IMSUtils.isValidFileName(fileName)) {
               log.error("Tên file không hợp lệ {}: Chỉ chứa chữ, số, dấu gạch ngang hoặc gạch dưới, độ dài 3-255 ký tự", fileName);
               this.setMessage(context, "Tên file không hợp lệ: Chỉ chứa chữ, số, dấu gạch ngang hoặc gạch dưới, độ dài 3-255 ký tự");
               return false;
            }

            String ext = getFileExtension(fileName);
            if (StringUtils.isBlank(ext) || !allowedTypes.contains(ext)) {
               this.setMessage(context, "File " + fileName + " có extension [" + ext + "] không nằm trong danh sách cho phép " + String.valueOf(allowedTypes));
               return false;
            }

            if (multipartFile.getSize() > this.maxSize) {
               this.setMessage(context, "File " + fileName + " vượt quá dung lượng cho phép: " + this.maxSize / 1024L / 1024L + "MB");
               return false;
            }

            try {
               BufferedInputStream is = new BufferedInputStream(multipartFile.getInputStream());

               String detectedMime;
               try {
                  is.mark(16384);
                  detectedMime = this.tika.detect(is, multipartFile.getOriginalFilename());
               } catch (Throwable var13) {
                  try {
                     is.close();
                  } catch (Throwable var12) {
                     var13.addSuppressed(var12);
                  }

                  throw var13;
               }

               is.close();
               if (StringUtils.isBlank(detectedMime)) {
                  this.setMessage(context, "Không thể xác định MIME type cho file " + fileName);
                  return false;
               }

               List<String> validMimes = (List)FILE_TYPE_RULES.getOrDefault(ext, Collections.emptyList());
               if (!validMimes.contains(detectedMime)) {
                  this.setMessage(context, "File " + fileName + " có MIME type [" + detectedMime + "] không khớp với extension [" + ext + "]");
                  return false;
               }

               log.info("File {} hợp lệ - Loại: {} - MIME: {}", new Object[]{fileName, ext, detectedMime});
               byte var11 = -1;
               switch(ext.hashCode()) {
               case 79058:
                  if (ext.equals("PDF")) {
                     var11 = 0;
                  }
               default:
                  switch(var11) {
                  case 0:
                     if (!validatePdfContent(multipartFile.getInputStream(), fileName)) {
                        this.setMessage(context, "File PDF " + fileName + " chứa nội dung nguy hiểm (JavaScript hoặc external references)");
                        return false;
                     }
                  }
               }
            } catch (IOException var14) {
               this.setMessage(context, "Không đọc được nội dung file " + fileName);
               return false;
            }
         }

         return true;
      }
   }

   private void setMessage(ConstraintValidatorContext context, String message) {
      context.disableDefaultConstraintViolation();
      context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
   }

   private static String getFileExtension(String fileName) {
      if (StringUtils.isBlank(fileName)) {
         return "";
      } else {
         int lastDotIndex = fileName.lastIndexOf(46);
         return lastDotIndex == -1 ? "" : fileName.substring(lastDotIndex + 1).toUpperCase();
      }
   }

   private static boolean validatePdfContent(InputStream inputStream, String fileName) throws IOException {
      BufferedInputStream is = new BufferedInputStream(inputStream, 8192);

      boolean var11;
      label52: {
         label51: {
            label50: {
               try {
                  byte[] buffer = new byte[8192];
                  long totalRead = 0L;
                  long maxReadSize = 20971520L;

                  int bytesRead;
                  while((bytesRead = is.read(buffer)) != -1 && totalRead < maxReadSize) {
                     String chunk = new String(buffer, 0, bytesRead, StandardCharsets.ISO_8859_1);
                     totalRead += (long)bytesRead;
                     String normalized = normalizeContent(chunk);
                     if (PDF_JAVASCRIPT_PATTERNS.matcher(normalized).find()) {
                        log.warn("PDF file chứa JavaScript hoặc actions nguy hiểm: {}", fileName);
                        var11 = false;
                        break label52;
                     }

                     if (DANGEROUS_PATTERNS.matcher(normalized).find()) {
                        log.warn("PDF file chứa pattern nguy hiểm: {}", fileName);
                        var11 = false;
                        break label51;
                     }

                     if (containsDangerousPdfObjects(normalized)) {
                        log.warn("PDF file chứa PDF objects nguy hiểm: {}", fileName);
                        var11 = false;
                        break label50;
                     }
                  }
               } catch (Throwable var13) {
                  try {
                     is.close();
                  } catch (Throwable var12) {
                     var13.addSuppressed(var12);
                  }

                  throw var13;
               }

               is.close();
               return true;
            }

            is.close();
            return var11;
         }

         is.close();
         return var11;
      }

      is.close();
      return var11;
   }

   private static boolean containsDangerousPdfObjects(String content) {
      if (content.matches("(?s).*/AA\\s*<<.*")) {
         log.debug("Phát hiện /AA (Additional Actions) trong PDF");
         return true;
      } else if (content.matches("(?s).*/OpenAction\\s*<<.*")) {
         log.debug("Phát hiện /OpenAction trong PDF");
         return true;
      } else if (content.matches("(?s).*/AcroForm.*/JavaScript.*")) {
         log.debug("Phát hiện AcroForm với JavaScript trong PDF");
         return true;
      } else if (content.matches("(?s).*/EmbeddedFile.*")) {
         log.debug("Phát hiện embedded files trong PDF");
         return true;
      } else if (content.matches("(?s).*/S\\s*/Launch.*")) {
         log.debug("Phát hiện Launch action trong PDF");
         return true;
      } else if (content.matches("(?s).*/S\\s*/SubmitForm.*")) {
         log.debug("Phát hiện SubmitForm action trong PDF");
         return true;
      } else if (content.matches("(?s).*/S\\s*/ImportData.*")) {
         log.debug("Phát hiện ImportData action trong PDF");
         return true;
      } else if (content.matches("(?s).*/S\\s*/URI.*/URI\\s*\\(http.*")) {
         log.debug("Phát hiện URI action với external link trong PDF");
         return true;
      } else if (content.matches("(?s).*/RichMedia.*")) {
         log.debug("Phát hiện RichMedia trong PDF");
         return true;
      } else {
         return false;
      }
   }

   private static String normalizeContent(String content) {
      if (content == null) {
         return "";
      } else {
         String normalized = content.replace("\\(", "(").replace("\\)", ")").replace("\\\\", "\\").replace("\\r", "\r").replace("\\n", "\n");
         normalized = normalized.replaceAll("\\s+", " ");
         return normalized;
      }
   }

   static {
      FILE_TYPE_RULES.put("PDF", List.of("application/pdf"));
      FILE_TYPE_RULES.put("XLS", List.of("application/x-tika-msoffice", "application/vnd.ms-excel", "application/x-tika-ooxml"));
      FILE_TYPE_RULES.put("XLSX", List.of("application/x-tika-ooxml", "application/x-tika-msoffice", "application/zip", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
      FILE_TYPE_RULES.put("DOC", List.of("application/x-tika-msoffice", "application/msword"));
      FILE_TYPE_RULES.put("DOCX", List.of("application/x-tika-ooxml", "application/zip", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/x-tika-msoffice"));
      FILE_TYPE_RULES.put("JPG", List.of("image/jpeg"));
      FILE_TYPE_RULES.put("JPEG", List.of("image/jpeg"));
      FILE_TYPE_RULES.put("PNG", List.of("image/png"));
      FILE_TYPE_RULES.put("XML", List.of("application/xml", "application/vnd.oasis.opendocument.tika.flat.document", "text/xml"));
      FILE_TYPE_RULES.put("HEIC", List.of("image/heic"));
      FILE_TYPE_RULES.put("PPT", List.of("application/x-tika-msoffice"));
      FILE_TYPE_RULES.put("PPTX", List.of("application/x-tika-ooxml"));
      FILE_TYPE_RULES.put("RAR", List.of("application/x-rar-compressed; version=4", "application/x-rar-compressed; version=5"));
      FILE_TYPE_RULES.put("ZIP", List.of("application/zip"));
      FILE_TYPE_RULES.put("WAV", List.of("audio/vnd.wave"));
      FILE_TYPE_RULES.put("BMP", List.of("image/bmp"));
      FILE_TYPE_RULES.put("GIF", List.of("image/gif"));
      FILE_TYPE_RULES.put("MSG", List.of("application/x-tika-msoffice", "application/vnd.ms-outlook"));
      FILE_TYPE_RULES.put("CSV", List.of("text/csv"));
      FILE_TYPE_RULES.put("TXT", List.of("text/plain"));
      FILE_TYPE_RULES.put("WEBP", List.of("image/webp"));
      FILE_TYPE_RULES.put("MP3", List.of("audio/mpeg"));
      FILE_TYPE_RULES.put("MP4", List.of("video/mp4"));
      FILE_TYPE_RULES.put("M4A", List.of("audio/mp4"));
   }
}
