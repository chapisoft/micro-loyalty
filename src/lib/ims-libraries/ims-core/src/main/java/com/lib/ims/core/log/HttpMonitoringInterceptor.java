package com.lib.ims.core.log;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.lang.reflect.Type;
import lombok.Generated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@ControllerAdvice
public class HttpMonitoringInterceptor extends RequestBodyAdviceAdapter
      implements HandlerInterceptor, ResponseBodyAdvice<Object> {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(HttpMonitoringInterceptor.class);

   public boolean preHandle(@NonNull HttpServletRequest httpServletRequest, @NonNull HttpServletResponse response,
         @NonNull Object handler) {
      Object servicePath = httpServletRequest.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
      Object servicePathPattern = httpServletRequest.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
      MDC.put("servicePath", servicePath != null ? servicePath.toString() : "unknown");
      MDC.put("servicePathPattern", servicePathPattern != null ? servicePathPattern.toString() : "unknown");
      return true;
   }

   public boolean supports(@NonNull MethodParameter methodParameter, @NonNull Type targetType,
         @NonNull Class<? extends HttpMessageConverter<?>> converterType) {
      return true;
   }

   public boolean supports(@NonNull MethodParameter returnType,
         @NonNull Class<? extends HttpMessageConverter<?>> converterType) {
      return true;
   }

   public Object beforeBodyWrite(@Nullable Object body, @NonNull MethodParameter returnType,
         @NonNull MediaType selectedContentType,
         @NonNull Class<? extends HttpMessageConverter<?>> selectedConverterType, @NonNull ServerHttpRequest request,
         @NonNull ServerHttpResponse response) {
      return body;
   }

   public void afterCompletion(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
         @NonNull Object handler, @Nullable Exception ex) {
   }
}
