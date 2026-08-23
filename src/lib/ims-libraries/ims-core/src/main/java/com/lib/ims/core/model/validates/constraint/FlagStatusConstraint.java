package com.lib.ims.core.model.validates.constraint;

import com.lib.ims.core.model.validates.annotation.ValidFlagStatus;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class FlagStatusConstraint implements ConstraintValidator<ValidFlagStatus, Integer> {
   public void initialize(ValidFlagStatus constraintAnnotation) {
//      super.initialize(constraintAnnotation);
   }

   public boolean isValid(Integer s, ConstraintValidatorContext constraintValidatorContext) {
      return s == null || s == 1 || s == 0;
   }
}
