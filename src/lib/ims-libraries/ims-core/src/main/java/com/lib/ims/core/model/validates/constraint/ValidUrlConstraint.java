package com.lib.ims.core.model.validates.constraint;

import com.lib.ims.core.model.validates.annotation.ValidUrl;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.net.URI;
import java.net.URISyntaxException;
import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ValidUrlConstraint implements ConstraintValidator<ValidUrl, String> {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(ValidUrlConstraint.class);
   private String[] fieldSubDomains;

   public void initialize(ValidUrl constraintAnnotation) {
      this.fieldSubDomains = constraintAnnotation.subDomains();
//      super.initialize(constraintAnnotation);
   }

   public boolean isValid(String url, ConstraintValidatorContext context) {
      if (StringUtils.isBlank(url)) {
         return true;
      } else {
         url = url.trim();

         try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            String normalizedHost;
            if (scheme != null && host != null) {
               if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                  log.warn("[ValidUrl] Reject URL: '{}' - invalid scheme '{}'", url, scheme);
                  return false;
               } else {
                  normalizedHost = host.toLowerCase();
                  String[] var7 = this.fieldSubDomains;
                  int var8 = var7.length;

                  for(int var9 = 0; var9 < var8; ++var9) {
                     String sub = var7[var9];
                     if (normalizedHost.equals(sub) || normalizedHost.endsWith(sub)) {
                        return true;
                     }
                  }

                  log.warn("[ValidUrl] Reject URL: '{}' - host '{}' not in whitelist", url, host);
                  return false;
               }
            } else if (scheme == null && host == null) {
               normalizedHost = uri.getPath();
               if (normalizedHost != null && normalizedHost.startsWith("/")) {
                  return true;
               } else {
                  log.warn("[ValidUrl] Reject URL: '{}' - relative url but path invalid '{}'", url, normalizedHost);
                  return false;
               }
            } else {
               log.warn("[ValidUrl] Reject URL: '{}' - invalid structure (scheme='{}', host='{}')", new Object[]{url, scheme, host});
               return false;
            }
         } catch (URISyntaxException var11) {
            log.error("[ValidUrl] URISyntaxException parsing '{}': {}", new Object[]{url, var11.getMessage(), var11});
            return false;
         }
      }
   }
}
