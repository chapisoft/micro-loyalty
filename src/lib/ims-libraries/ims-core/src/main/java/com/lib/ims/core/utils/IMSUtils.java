package com.lib.ims.core.utils;

import com.lib.ims.core.exceptions.ApplicationException;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;
import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;


@SuppressWarnings({"unchecked", "rawtypes"})
public class IMSUtils {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(IMSUtils.class);
   private static final Pattern FORBIDDEN_PATTERN = Pattern.compile("[<>=#$%*?@!^/\\\\:\"|]");

   public static String currentUserId() {
      try {
         return MDC.get("userId");
      } catch (Exception var1) {
         log.error("Error [currentUserId] {} {}", var1, var1.getMessage());
         return "";
      }
   }

   public static String currentUserName() {
      try {
         return MDC.get("userName");
      } catch (Exception var1) {
         log.error("Error [currentUserName] {} {}", var1, var1.getMessage());
         return "";
      }
   }

   public static String getUserName() {
      String userName = currentUserName();
      if (StringUtils.isBlank(userName)) {
         log.error("Error [getUserName] isBlank");
         throw new ApplicationException("Dữ liệu user không hợp lệ!!");
      } else {
         return userName;
      }
   }

   public static String getUserId() {
      String userName = currentUserId();
      if (StringUtils.isBlank(userName)) {
         log.error("Error [getUserId] isBlank");
         throw new ApplicationException("Dữ liệu user không hợp lệ!!");
      } else {
         return userName;
      }
   }

   public static List<Field> getFields(Class<?> clazz) {
      ArrayList fields;
      for(fields = new ArrayList(); clazz != null && clazz != Object.class; clazz = clazz.getSuperclass()) {
         fields.addAll(Arrays.asList(clazz.getDeclaredFields()));
      }

      return fields;
   }

   public static void logMemoryUsage(String context) {
      long usedMemory = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory();
      double usedMB = (double)usedMemory / 1024.0D / 1024.0D;
      log.info("[Memory] After {}: {} MB", context, String.format("%.2f", usedMB));
   }

   public static boolean isValidFileName(String fileName) {
      if (StringUtils.isBlank(fileName)) {
         return true;
      } else {
         int byteLength = fileName.getBytes(StandardCharsets.UTF_8).length;
         if (byteLength >= 3 && byteLength <= 255) {
            if (FORBIDDEN_PATTERN.matcher(fileName).find()) {
               log.error("Tên file không hợp lệ {}: Không chứa các ký tự cấm và độ dài từ 3-255 ký tự", fileName);
               return true;
            } else {
               return false;
            }
         } else {
            log.error("Tên file {} không hợp lệ:Độ dài 3-255 ký tự", fileName);
            return true;
         }
      }
   }
}
