package com.lib.ims.core.model.validates.constraint;

import com.lib.ims.core.model.validates.annotation.ValidStoredXSS;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

public class ValidStoredXSSValidator implements ConstraintValidator<ValidStoredXSS, String> {
   public void initialize(ValidStoredXSS constraintAnnotation) {
   }

   public boolean isValid(String value, ConstraintValidatorContext context) {
      return value == null ? true : Jsoup.isValid(value, Safelist.none());
   }
}
