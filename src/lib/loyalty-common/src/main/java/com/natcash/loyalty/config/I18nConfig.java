package com.natcash.loyalty.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Locale;

@Configuration
public class I18nConfig {

    @Bean
    public MessageSource messageSource() {
        ReloadableResourceBundleMessageSource source = new ReloadableResourceBundleMessageSource();
        source.setBasenames(
                "file:./etc/messages",
                "file:../etc/messages",
                "file:../../service/cms-service/etc/messages",
                "file:./src/service/cms-service/etc/messages",
                "file:/app/etc/messages",
                "file:/app/locales/messages",
                "classpath:messages/messages",
                "classpath:messages"
        );
        source.setDefaultEncoding(StandardCharsets.UTF_8.name());
        source.setUseCodeAsDefaultMessage(true);
        source.setFallbackToSystemLocale(false);
        source.setDefaultLocale(new Locale("vi"));
        return source;
    }

    @Bean
    public LocalValidatorFactoryBean getValidator(MessageSource messageSource) {
        LocalValidatorFactoryBean bean = new LocalValidatorFactoryBean();
        bean.setValidationMessageSource(messageSource);
        return bean;
    }

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setSupportedLocales(Arrays.asList(
                new Locale("vi"),
                Locale.ENGLISH,
                Locale.FRENCH,
                new Locale("ht")
        ));
        resolver.setDefaultLocale(new Locale("vi"));
        return resolver;
    }
}
