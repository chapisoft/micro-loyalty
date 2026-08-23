package com.lib.ims.rest.utils;

import com.lib.ims.rest.payload.ResponseData;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Map.Entry;
import java.util.function.Consumer;
import lombok.Generated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpHeaders;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.util.UriComponentsBuilder;

@SuppressWarnings({ "unchecked", "rawtypes", "null" })
public class RestClientUtils {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(RestClientUtils.class);

   private RestClientUtils() {
      throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
   }

   public static Map<String, String> createHeaders(String clientMessageId, String transactionId) {
      Map<String, String> headers = new HashMap();
      headers.put("clientMessageId", clientMessageId);
      headers.put("transactionId", transactionId);
      return headers;
   }

   public static String getHeader(HttpHeaders headers, String key) {
      return (String) Optional.ofNullable(headers.get(key)).filter((list) -> {
         return !list.isEmpty();
      }).map(list -> list.get(0)).orElse("");
   }

   public static String getBearerTokenHeader() {
      try {
         RequestAttributes info = RequestContextHolder.getRequestAttributes();
         return info == null ? MDC.get("Authorization")
               : ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest()
                     .getHeader("Authorization");
      } catch (Exception var1) {
         log.error("error get getBearerTokenHeader default request {} {}", var1, var1.getMessage());
         return "";
      }
   }

   public static <T> T getData(ResponseData<T> responseData) {
      return responseData.getData() == null ? null : responseData.getData();
   }

   public static String extractBearerToken(HttpServletRequest request) {
      Enumeration authorizationHeaderValues = request.getHeaders("Authorization");

      while (authorizationHeaderValues.hasMoreElements()) {
         String value = (String) authorizationHeaderValues.nextElement();
         String[] parts = value.trim().split("\\s+");
         if (parts.length == 2) {
            String bearer = parts[0];
            if (bearer.equalsIgnoreCase("Bearer")) {
               return parts[1];
            }
         }
      }

      return null;
   }

   public static Consumer<HttpHeaders> mapToConsumer(Map<String, String> headerMap) {
      return (headers) -> {
         if (headerMap != null) {
            Objects.requireNonNull(headers);
            headerMap.forEach(headers::set);
         }

      };
   }

   public static URI methodUri(String url, Map<String, String> queryParams, Object... uriVariables) {
      UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(url);
      if (queryParams != null && !queryParams.isEmpty()) {
         Iterator var4 = queryParams.entrySet().iterator();

         while (var4.hasNext()) {
            Entry<String, String> entry = (Entry) var4.next();
            builder.queryParam((String) entry.getKey(), new Object[] { entry.getValue() });
         }
      }

      return uriVariables != null && uriVariables.length > 0 ? builder.buildAndExpand(uriVariables).encode().toUri()
            : builder.build(false).toUri();
   }
}
