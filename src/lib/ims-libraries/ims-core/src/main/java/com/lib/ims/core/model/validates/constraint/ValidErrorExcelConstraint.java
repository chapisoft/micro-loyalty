package com.lib.ims.core.model.validates.constraint;

import com.lib.ims.core.model.validates.annotation.ValidErrorExcel;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ValidErrorExcelConstraint implements ConstraintValidator<ValidErrorExcel, String> {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(ValidErrorExcelConstraint.class);

   public void initialize(ValidErrorExcel constraintAnnotation) {
   }

   public boolean isValid(String value, ConstraintValidatorContext context) {
      if (StringUtils.isBlank(value)) {
         return true;
      } else if (!"#REF!".equals(value) && !"#VALUE!".equals(value)) {
         return true;
      } else {
         log.warn("Found #REF! value, converting to null");
         return false;
      }
   }
}
