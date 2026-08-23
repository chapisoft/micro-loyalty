package com.lib.ims.i18n.config;

import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;



public class I18n {
   private static final Logger log = LoggerFactory.getLogger(I18n.class);
   private static MessageSource messageSource;

   private I18n() {
   }

   public static void init(MessageSource messageSource) {
      I18n.messageSource = messageSource;
   }

   public static String get(String code) {
      return get(code, LocaleContextHolder.getLocale());
   }

   public static String get(String code, Object... args) {
      return get(code, LocaleContextHolder.getLocale(), args);
   }

   public static String get(String code, Locale locale) {
      return get(code, locale, (Object[])null);
   }

   public static String get(String code, Locale locale, Object... args) {
      String key = code != null ? code : "";
      Locale targetLocale = locale != null ? locale : LocaleContextHolder.getLocale();
      if (messageSource == null) {
         log.warn("MessageSource is not initialized. Returning fallback message for key: '{}' with locale: {}", key, targetLocale);
         return key;
      } else {
         try {
            return messageSource.getMessage(key, args, targetLocale);
         } catch (NoSuchMessageException var4) {
            log.warn("Missing message for key: '{}' with locale: {}", key, targetLocale);
            return key;
         }
      }
   }
}
