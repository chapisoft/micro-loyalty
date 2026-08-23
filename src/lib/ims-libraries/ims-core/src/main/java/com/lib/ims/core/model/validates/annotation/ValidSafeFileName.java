package com.lib.ims.core.model.validates.annotation;

import com.lib.ims.core.model.validates.constraint.SafeFileNameConstraint;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(
   validatedBy = {SafeFileNameConstraint.class}
)
@Documented
public @interface ValidSafeFileName {
   String message() default "Tên file chứa ký tự không hợp lệ";

   Class<?>[] groups() default {};

   Class<? extends Payload>[] payload() default {};
}
