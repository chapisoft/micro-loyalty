package com.lib.ims.core.model.validates.annotation;

import com.lib.ims.core.model.enums.BaseEnum;
import com.lib.ims.core.model.validates.constraint.ValidEnumValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(
   validatedBy = {ValidEnumValidator.class}
)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidEnum {
   String message() default "Invalid enum value";

   Class<?>[] groups() default {};

   Class<? extends Payload>[] payload() default {};

   Class<? extends BaseEnum<?>> enumClass();
}
