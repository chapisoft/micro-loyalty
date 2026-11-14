package com.lib.ims.i18n.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@ConfigurationProperties(prefix = "ims.i18n")
public class I18nProperties {

    private String defaultLanguage = "vi";
    private List<String> resourceBundles = new ArrayList<>(List.of(
            "file:./etc/messages",
            "file:../etc/messages",
            "file:../../service/cms-service/etc/messages",
            "file:./src/service/cms-service/etc/messages",
            "file:/app/etc/messages",
            "classpath:i18n/messages",
            "classpath:messages"
    ));
    private String encoding = "UTF-8";
    private boolean useCodeAsDefaultMessage = true;
    private String localeParam = "lang";

    public String getDefaultLanguage() {
        return this.defaultLanguage;
    }

    public List<String> getResourceBundles() {
        return this.resourceBundles;
    }

    public String getEncoding() {
        return this.encoding;
    }

    public boolean isUseCodeAsDefaultMessage() {
        return this.useCodeAsDefaultMessage;
    }

    public String getLocaleParam() {
        return this.localeParam;
    }

    public void setDefaultLanguage(String defaultLanguage) {
        this.defaultLanguage = defaultLanguage;
    }

    public void setResourceBundles(List<String> resourceBundles) {
        this.resourceBundles = resourceBundles;
    }

    public void setEncoding(String encoding) {
        this.encoding = encoding;
    }

    public void setUseCodeAsDefaultMessage(boolean useCodeAsDefaultMessage) {
        this.useCodeAsDefaultMessage = useCodeAsDefaultMessage;
    }

    public void setLocaleParam(String localeParam) {
        this.localeParam = localeParam;
    }

    @Override
    public boolean equals(Object o) {
        if (o == this) {
            return true;
        }
        if (!(o instanceof I18nProperties other)) {
            return false;
        }
        if (!other.canEqual(this)) {
            return false;
        }
        return this.isUseCodeAsDefaultMessage() == other.isUseCodeAsDefaultMessage()
                && Objects.equals(this.getDefaultLanguage(), other.getDefaultLanguage())
                && Objects.equals(this.getResourceBundles(), other.getResourceBundles())
                && Objects.equals(this.getEncoding(), other.getEncoding())
                && Objects.equals(this.getLocaleParam(), other.getLocaleParam());
    }

    protected boolean canEqual(Object other) {
        return other instanceof I18nProperties;
    }

    @Override
    public int hashCode() {
        return Objects.hash(
                this.isUseCodeAsDefaultMessage(),
                this.getDefaultLanguage(),
                this.getResourceBundles(),
                this.getEncoding(),
                this.getLocaleParam()
        );
    }

    @Override
    public String toString() {
        return "I18nProperties(defaultLanguage=" + this.getDefaultLanguage()
                + ", resourceBundles=" + this.getResourceBundles()
                + ", encoding=" + this.getEncoding()
                + ", useCodeAsDefaultMessage=" + this.isUseCodeAsDefaultMessage()
                + ", localeParam=" + this.getLocaleParam() + ")";
    }
}
