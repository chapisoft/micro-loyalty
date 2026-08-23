package com.lib.ims.core.model.validates.constraint;

import com.lib.ims.core.model.validates.annotation.ValidVersion;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ValidVersionConstraint implements ConstraintValidator<ValidVersion, String> {
   public void initialize(ValidVersion constraintAnnotation) {
//      super.initialize(constraintAnnotation);
   }

   public boolean isValid(String version, ConstraintValidatorContext constraintValidatorContext) {
      String regex = "^[1-9]\\.\\d\\.\\d$";
      Pattern pattern = Pattern.compile(regex);
      Matcher matcher = pattern.matcher(version);
      return matcher.matches();
   }
}
