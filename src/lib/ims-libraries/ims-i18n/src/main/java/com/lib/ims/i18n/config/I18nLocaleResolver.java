package com.lib.ims.i18n.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Locale;
import org.apache.commons.lang3.StringUtils;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;



@SuppressWarnings("null")
public class I18nLocaleResolver extends AcceptHeaderLocaleResolver {
   private final I18nProperties properties;

   public I18nLocaleResolver(I18nProperties properties) {
      this.properties = properties;
      this.setDefaultLocale(Locale.forLanguageTag(properties.getDefaultLanguage()));
   }

   @NonNull
   public Locale resolveLocale(@NonNull HttpServletRequest request) {
      String acceptLanguage = request.getHeader("Accept-Language");
      if (StringUtils.isNotBlank(acceptLanguage)) {
         return super.resolveLocale(request);
      } else {
         String localeParam = request.getParameter(this.properties.getLocaleParam());
         return StringUtils.isNotBlank(localeParam) ? this.parseLocale(localeParam) : this.defaultLocale();
      }
   }

   @NonNull
   private Locale defaultLocale() {
      String defaultLang = this.properties.getDefaultLanguage();
      return defaultLang != null ? Locale.forLanguageTag(defaultLang) : Locale.getDefault();
   }

   public void setLocale(@NonNull HttpServletRequest request, @Nullable HttpServletResponse response, @Nullable Locale locale) {
   }

   @NonNull
   private Locale parseLocale(String localeStr) {
      if (StringUtils.isBlank(localeStr)) {
         return this.defaultLocale();
      }
      try {
         return Locale.forLanguageTag(localeStr);
      } catch (Exception var3) {
         return this.defaultLocale();
      }
   }
}
