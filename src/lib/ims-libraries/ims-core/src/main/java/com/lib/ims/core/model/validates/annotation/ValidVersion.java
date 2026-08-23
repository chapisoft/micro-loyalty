package com.lib.ims.core.model.validates.annotation;

import com.lib.ims.core.model.validates.constraint.ValidVersionConstraint;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(
   validatedBy = {ValidVersionConstraint.class}
)
@Target({ElementType.METHOD, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidVersion {
   String message() default "Invalid version app";

   Class<?>[] groups() default {};

   Class<? extends Payload>[] payload() default {};
}
