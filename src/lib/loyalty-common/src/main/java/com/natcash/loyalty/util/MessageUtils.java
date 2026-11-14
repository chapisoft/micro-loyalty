package com.natcash.loyalty.util;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Component
public class MessageUtils {

    private static MessageSource messageSource;
    private static volatile MessageSource fallbackMessageSource;

    public MessageUtils(MessageSource messageSource) {
        MessageUtils.messageSource = messageSource;
    }

    private static MessageSource getEffectiveMessageSource() {
        if (messageSource != null) {
            return messageSource;
        }
        if (fallbackMessageSource == null) {
            synchronized (MessageUtils.class) {
                if (fallbackMessageSource == null) {
                    ReloadableResourceBundleMessageSource source = new ReloadableResourceBundleMessageSource();
                    source.setBasenames(
                            "file:./etc/messages",
                            "file:../etc/messages",
                            "file:../../service/cms-service/etc/messages",
                            "file:./src/service/cms-service/etc/messages",
                            "file:/app/etc/messages",
                            "file:/app/locales/messages",
                            "classpath:messages/messages",
                            "classpath:messages");
                    source.setDefaultEncoding(StandardCharsets.UTF_8.name());
                    source.setUseCodeAsDefaultMessage(true);
                    source.setFallbackToSystemLocale(false);
                    source.setDefaultLocale(new Locale("vi"));
                    fallbackMessageSource = source;
                }
            }
        }
        return fallbackMessageSource;
    }

    public static String getMessage(String code, Object... args) {
        Locale locale = LocaleContextHolder.getLocale();
        return getEffectiveMessageSource().getMessage(code, args, code, locale);
    }

    public static String getMessage(String code, Locale locale, Object... args) {
        return getEffectiveMessageSource().getMessage(code, args, code, locale);
    }
}
