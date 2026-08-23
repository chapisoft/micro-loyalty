package com.lib.ims.rest.configuration;

import com.lib.ims.core.exceptions.ApplicationException;
import com.lib.ims.core.exceptions.CircuitBreakerOpenException;
import com.lib.ims.core.exceptions.ErrorCode;
import com.lib.ims.rest.utils.RestClientUtils;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;



@Component
public class RestClientInterceptor implements ClientHttpRequestInterceptor {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(RestClientInterceptor.class);
   private final CircuitBreakerRegistry circuitBreakerRegistry;
   private final CircuitBreakerProperties circuitBreakerProperties;

   @NonNull
   public ClientHttpResponse intercept(@NonNull HttpRequest request, @NonNull byte[] body, @NonNull ClientHttpRequestExecution execution) {
      try {
         this.logRequest(request);
         if (!this.circuitBreakerProperties.isEnabled()) {
            return execution.execute(request, body);
         } else {
            String host = request.getURI().getHost();
            String circuitBreakerName = this.circuitBreakerProperties.getCircuitBreakerName(host);
            if (StringUtils.isBlank(circuitBreakerName)) {
               log.debug("Không áp dụng CircuitBreaker cho hostname: {}", host);
               return execution.execute(request, body);
            } else {
               CircuitBreaker circuitBreaker = this.circuitBreakerRegistry.circuitBreaker(circuitBreakerName);
               log.debug("Đang sử dụng CircuitBreaker: {} cho yêu cầu đến {}", circuitBreakerName, request.getURI());
               Supplier<ClientHttpResponse> decoratedSupplier = CircuitBreaker.decorateSupplier(circuitBreaker, () -> {
                  try {
                     return execution.execute(request, body);
                  } catch (IOException var4) {
                     log.error("Lỗi khi thực thi yêu cầu HTTP đến {}: {}", new Object[]{request.getURI(), var4.getMessage(), var4});
                     throw new ApplicationException("Lỗi khi thực thi yêu cầu HTTP");
                  }
               });

               try {
                  long startTime = System.nanoTime();
                  ClientHttpResponse response = decoratedSupplier.get();
                  long durationInMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startTime);
                  log.info("Yêu cầu đến {} hoàn thành trong {}ms", request.getURI(), durationInMs);
                  return response;
               } catch (Exception var13) {
                  if (var13 instanceof CallNotPermittedException) {
                     log.error("Circuit breaker '{}' đang mở. Yêu cầu đến {} không được phép", circuitBreakerName, request.getURI());
                     throw new CircuitBreakerOpenException("Circuit breaker đang mở cho dịch vụ: " + host + ". Yêu cầu không được phép");
                  } else {
                     throw var13;
                  }
               }
            }
         }
      } catch (Exception var14) {
         log.error("Lỗi trong quá trình gọi HTTP: {}", var14.getMessage(), var14);
         if (var14 instanceof CircuitBreakerOpenException) {
            throw (CircuitBreakerOpenException)var14;
         } else {
            throw new ApplicationException(ErrorCode.THIRD_PARTY_SERVICE_ERROR);
         }
      }
   }

   private void logRequest(HttpRequest request) {
      HttpHeaders header = request.getHeaders();
      Map<String, String> httpHeaders = new HashMap<>();
      
      String clientMessageId = MDC.get("clientMessageId");
      if (StringUtils.isNotBlank(clientMessageId)) {
         httpHeaders.put("clientMessageId", clientMessageId);
      }
      
      String xUserInfo = MDC.get("x-user-info");
      if (StringUtils.isNotBlank(xUserInfo)) {
         httpHeaders.put("x-user-info", xUserInfo);
      }
      
      String application = MDC.get("application");
      if (StringUtils.isNotBlank(application)) {
         httpHeaders.put("X-Source", application);
      }
      
      String sourceIpAddress = MDC.get("sourceIpAddress");
      if (StringUtils.isNotBlank(sourceIpAddress)) {
         httpHeaders.put("x-original-forwarded-for", sourceIpAddress);
      }

      String token = RestClientUtils.getHeader(header, "Authorization");
      if (StringUtils.isBlank(token)) {
         token = RestClientUtils.getBearerTokenHeader();
      }

      if (StringUtils.isNotBlank(token)) {
         httpHeaders.put("Authorization", token);
      } else {
         log.info("send request not token");
      }

      header.setAll(httpHeaders);
   }

   @Generated
   public RestClientInterceptor(CircuitBreakerRegistry circuitBreakerRegistry, CircuitBreakerProperties circuitBreakerProperties) {
      this.circuitBreakerRegistry = circuitBreakerRegistry;
      this.circuitBreakerProperties = circuitBreakerProperties;
   }
}
