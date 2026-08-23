package com.lib.ims.excel.model.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD})
public @interface ValidUniqueField {
   String message() default "Bản ghi đã tồn tại dòng %, vui lòng kiểm tra lại dữ liệu!";
}
