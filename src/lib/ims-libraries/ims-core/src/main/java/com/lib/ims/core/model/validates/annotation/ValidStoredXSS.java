package com.lib.ims.core.model.validates.annotation;

import com.lib.ims.core.model.validates.constraint.ValidStoredXSSValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Constraint(
   validatedBy = {ValidStoredXSSValidator.class}
)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidStoredXSS {
   String message() default "Trường này không được chứa các ký hiệu đặc biệt";

   Class<?>[] groups() default {};

   Class<? extends Payload>[] payload() default {};
}
