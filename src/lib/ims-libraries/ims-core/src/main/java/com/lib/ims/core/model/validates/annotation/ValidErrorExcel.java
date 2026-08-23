package com.lib.ims.core.model.validates.annotation;

import com.lib.ims.core.model.validates.constraint.ValidErrorExcelConstraint;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Constraint(
   validatedBy = {ValidErrorExcelConstraint.class}
)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidErrorExcel {
   String message() default "Bản ghi lỗi";

   Class<?>[] groups() default {};

   Class<? extends Payload>[] payload() default {};
}
