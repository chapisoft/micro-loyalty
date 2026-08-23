package com.lib.ims.core.model.validates.constraint;

import com.lib.ims.core.model.validates.annotation.ValidSafeFileName;
import com.lib.ims.core.utils.IMSUtils;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class SafeFileNameConstraint implements ConstraintValidator<ValidSafeFileName, String> {
   public boolean isValid(String value, ConstraintValidatorContext context) {
      if (value != null && !value.isBlank()) {
         if (IMSUtils.isValidFileName(value)) {
            this.setMessage(context);
            return false;
         } else {
            return true;
         }
      } else {
         return false;
      }
   }

   private void setMessage(ConstraintValidatorContext context) {
      context.disableDefaultConstraintViolation();
      context.buildConstraintViolationWithTemplate("Tên file không hợp lệ: Không chứa các ký tự cấm và độ dài từ 3-255 ký tự").addConstraintViolation();
   }
}
