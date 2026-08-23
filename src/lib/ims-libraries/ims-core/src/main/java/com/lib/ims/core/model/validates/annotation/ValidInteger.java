package com.lib.ims.core.model.validates.annotation;

import com.lib.ims.core.model.validates.constraint.ValidIntegerConstraint;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(
   validatedBy = {ValidIntegerConstraint.class}
)
@Target({ElementType.TYPE_USE, ElementType.METHOD, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidInteger {
   String message() default "Invalid integer";

   Class<?>[] groups() default {};

   Class<? extends Payload>[] payload() default {};

   String[] lsValue() default {};
}
