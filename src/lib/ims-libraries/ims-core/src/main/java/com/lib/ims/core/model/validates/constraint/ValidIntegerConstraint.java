package com.lib.ims.core.model.validates.constraint;

import com.lib.ims.core.model.validates.annotation.ValidInteger;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.Arrays;
import java.util.List;

public class ValidIntegerConstraint implements ConstraintValidator<ValidInteger, Integer> {
   private String[] lsValue;

   public void initialize(ValidInteger constraintAnnotation) {
      this.lsValue = constraintAnnotation.lsValue();
//      super.initialize(constraintAnnotation);
   }

   public boolean isValid(Integer s, ConstraintValidatorContext constraintValidatorContext) {
      if (s == null) {
         return true;
      } else {
         List<Integer> list = Arrays.stream(this.lsValue).map(Integer::parseInt).filter((integer) -> {
            return integer.equals(s);
         }).toList();
         return !list.isEmpty();
      }
   }
}
