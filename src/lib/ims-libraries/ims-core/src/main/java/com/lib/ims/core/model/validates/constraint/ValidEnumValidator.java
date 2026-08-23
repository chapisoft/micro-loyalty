package com.lib.ims.core.model.validates.constraint;

import com.lib.ims.core.model.enums.BaseEnum;
import com.lib.ims.core.model.validates.annotation.ValidEnum;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;



public class ValidEnumValidator implements ConstraintValidator<ValidEnum, BaseEnum<?>> {

   @Override
   public boolean isValid(BaseEnum<?> value, ConstraintValidatorContext context) {
      return value == null ? true : value.isValid();
   }
}
