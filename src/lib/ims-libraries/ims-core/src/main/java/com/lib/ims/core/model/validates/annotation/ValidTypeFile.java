package com.lib.ims.core.model.validates.annotation;

import com.lib.ims.core.model.validates.constraint.TypeFileConstraint;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(
   validatedBy = {TypeFileConstraint.class}
)
@Target({ElementType.METHOD, ElementType.FIELD, ElementType.TYPE_USE, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidTypeFile {
   String message() default "File không hợp lệ hoặc vượt quá kích thước cho phép";

   Class<?>[] groups() default {};

   Class<? extends Payload>[] payload() default {};

   String[] types() default {};

   int maxSize() default 1;

   int maxLength() default 0;
}
