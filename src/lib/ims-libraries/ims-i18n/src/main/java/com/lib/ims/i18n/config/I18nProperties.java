package com.lib.ims.i18n.config;

import java.util.ArrayList;
import java.util.List;
import lombok.Generated;
import org.springframework.boot.context.properties.ConfigurationProperties;


@ConfigurationProperties(
   prefix = "ims.i18n"
)
@SuppressWarnings({"unchecked", "rawtypes"})
public class I18nProperties {
   private String defaultLanguage = "vi";
   private List<String> resourceBundles = new ArrayList(List.of("classpath:i18n/messages", "classpath:messages"));
   private String encoding = "UTF-8";
   private boolean useCodeAsDefaultMessage = true;
   private String localeParam = "lang";

   @Generated
   public String getDefaultLanguage() {
      return this.defaultLanguage;
   }

   @Generated
   public List<String> getResourceBundles() {
      return this.resourceBundles;
   }

   @Generated
   public String getEncoding() {
      return this.encoding;
   }

   @Generated
   public boolean isUseCodeAsDefaultMessage() {
      return this.useCodeAsDefaultMessage;
   }

   @Generated
   public String getLocaleParam() {
      return this.localeParam;
   }

   @Generated
   public void setDefaultLanguage(String defaultLanguage) {
      this.defaultLanguage = defaultLanguage;
   }

   @Generated
   public void setResourceBundles(List<String> resourceBundles) {
      this.resourceBundles = resourceBundles;
   }

   @Generated
   public void setEncoding(String encoding) {
      this.encoding = encoding;
   }

   @Generated
   public void setUseCodeAsDefaultMessage(boolean useCodeAsDefaultMessage) {
      this.useCodeAsDefaultMessage = useCodeAsDefaultMessage;
   }

   @Generated
   public void setLocaleParam(String localeParam) {
      this.localeParam = localeParam;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof I18nProperties)) {
         return false;
      } else {
         I18nProperties other = (I18nProperties)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (this.isUseCodeAsDefaultMessage() != other.isUseCodeAsDefaultMessage()) {
            return false;
         } else {
            label61: {
               Object this$defaultLanguage = this.getDefaultLanguage();
               Object other$defaultLanguage = other.getDefaultLanguage();
               if (this$defaultLanguage == null) {
                  if (other$defaultLanguage == null) {
                     break label61;
                  }
               } else if (this$defaultLanguage.equals(other$defaultLanguage)) {
                  break label61;
               }

               return false;
            }

            label54: {
               Object this$resourceBundles = this.getResourceBundles();
               Object other$resourceBundles = other.getResourceBundles();
               if (this$resourceBundles == null) {
                  if (other$resourceBundles == null) {
                     break label54;
                  }
               } else if (this$resourceBundles.equals(other$resourceBundles)) {
                  break label54;
               }

               return false;
            }

            Object this$encoding = this.getEncoding();
            Object other$encoding = other.getEncoding();
            if (this$encoding == null) {
               if (other$encoding != null) {
                  return false;
               }
            } else if (!this$encoding.equals(other$encoding)) {
               return false;
            }

            Object this$localeParam = this.getLocaleParam();
            Object other$localeParam = other.getLocaleParam();
            if (this$localeParam == null) {
               if (other$localeParam != null) {
                  return false;
               }
            } else if (!this$localeParam.equals(other$localeParam)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof I18nProperties;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      result = result * 59 + (this.isUseCodeAsDefaultMessage() ? 79 : 97);
      Object $defaultLanguage = this.getDefaultLanguage();
      result = result * 59 + ($defaultLanguage == null ? 43 : $defaultLanguage.hashCode());
      Object $resourceBundles = this.getResourceBundles();
      result = result * 59 + ($resourceBundles == null ? 43 : $resourceBundles.hashCode());
      Object $encoding = this.getEncoding();
      result = result * 59 + ($encoding == null ? 43 : $encoding.hashCode());
      Object $localeParam = this.getLocaleParam();
      result = result * 59 + ($localeParam == null ? 43 : $localeParam.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getDefaultLanguage();
      return "I18nProperties(defaultLanguage=" + var10000 + ", resourceBundles=" + String.valueOf(this.getResourceBundles()) + ", encoding=" + this.getEncoding() + ", useCodeAsDefaultMessage=" + this.isUseCodeAsDefaultMessage() + ", localeParam=" + this.getLocaleParam() + ")";
   }
}
