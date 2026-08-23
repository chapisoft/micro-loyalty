package com.natcash.loyalty.util;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class MessageUtils {

    private static MessageSource messageSource;

    public MessageUtils(MessageSource messageSource) {
        MessageUtils.messageSource = messageSource;
    }

    public static String getMessage(String code, Object... args) {
        if (messageSource == null) {
            return code;
        }
        Locale locale = LocaleContextHolder.getLocale();
        return messageSource.getMessage(code, args, code, locale);
    }

    public static String getMessage(String code, Locale locale, Object... args) {
        if (messageSource == null) {
            return code;
        }
        return messageSource.getMessage(code, args, code, locale);
    }
}
