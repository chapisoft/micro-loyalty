package com.lib.ims.i18n;

import com.lib.ims.i18n.config.I18n;
import com.lib.ims.i18n.config.I18nLocaleResolver;
import com.lib.ims.i18n.config.I18nProperties;
import jakarta.annotation.PostConstruct;
import java.util.Locale;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.LocaleChangeInterceptor;



@Configuration
@EnableConfigurationProperties({I18nProperties.class})
@SuppressWarnings("null")
public class IMSI18nAutoConfiguration implements WebMvcConfigurer {
   private final I18nProperties properties;
   private final MessageSource messageSource;

   public IMSI18nAutoConfiguration(I18nProperties properties, MessageSource messageSource) {
      this.properties = properties;
      this.messageSource = messageSource;
   }

   @PostConstruct
   public void init() {
      I18n.init(this.messageSource);
   }

   @Bean
   @ConditionalOnMissingBean
   public MessageSource messageSource() {
      ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
      if (this.properties.getResourceBundles() != null) {
         messageSource.setBasenames(this.properties.getResourceBundles().toArray(new String[0]));
      }
      messageSource.setCacheSeconds(-1);
      messageSource.setDefaultEncoding(this.properties.getEncoding() != null ? this.properties.getEncoding() : "UTF-8");
      messageSource.setUseCodeAsDefaultMessage(this.properties.isUseCodeAsDefaultMessage());
      messageSource.setFallbackToSystemLocale(false);
      String defaultLang = this.properties.getDefaultLanguage() != null ? this.properties.getDefaultLanguage() : "vi";
      messageSource.setDefaultLocale(Locale.forLanguageTag(defaultLang));
      return messageSource;
   }

   @Bean
   @ConditionalOnWebApplication
   @ConditionalOnMissingBean
   public LocaleResolver localeResolver() {
      return new I18nLocaleResolver(this.properties);
   }

   @Bean
   @ConditionalOnWebApplication
   @ConditionalOnMissingBean
   public LocaleChangeInterceptor localeChangeInterceptor() {
      LocaleChangeInterceptor interceptor = new LocaleChangeInterceptor();
      String localeParam = this.properties.getLocaleParam();
      interceptor.setParamName(localeParam != null ? localeParam : "lang");
      return interceptor;
   }

   public void addInterceptors(@NonNull InterceptorRegistry registry) {
      registry.addInterceptor(this.localeChangeInterceptor());
   }
}
