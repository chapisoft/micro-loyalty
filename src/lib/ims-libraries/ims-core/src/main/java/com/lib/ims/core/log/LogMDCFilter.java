package com.lib.ims.core.log;

import com.lib.ims.core.exceptions.ApplicationException;
import com.lib.ims.core.model.ResponseData;
import com.lib.ims.core.model.UserInfo;
import com.lib.ims.core.utils.JsonUtil;
import com.lib.ims.security.config.KeycloakProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;


@Order(Integer.MIN_VALUE)
@Component
public final class LogMDCFilter extends OncePerRequestFilter {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(LogMDCFilter.class);
   private final KeycloakProperties keycloakProperties;
   private final AntPathMatcher antPathMatcher;

   private boolean whitelistValid(List<String> list, String path) {
      return list.stream().anyMatch((allow) -> {
         return this.antPathMatcher.match(allow, path);
      });
   }

   protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {
      MDC.clear();
      String path = request.getServletPath();
      boolean isWhitelisted = this.whitelistValid(Arrays.asList(this.keycloakProperties.getPatterns()), path);
      long startTime = System.nanoTime();
      request.setAttribute("startTime", startTime);
      String clientMessageId = (String)Optional.ofNullable(request.getHeader("clientMessageId")).orElse(UUID.randomUUID().toString());
      String transactionId = UUID.randomUUID().toString();
      MDC.put("clientMessageId", clientMessageId);
      MDC.put("transactionId", transactionId);
      MDC.put("logType", "http-request");
      String sourceApp = (String)StringUtils.defaultIfBlank(request.getHeader("X-Source"), "unknown");
      String sourceIp = (String)StringUtils.defaultIfBlank(request.getHeader("x-original-forwarded-for"), request.getRemoteAddr());
      MDC.put("sourceApp", sourceApp);
      MDC.put("sourceAppIp", request.getRemoteAddr());
      MDC.put("sourceIpAddress", sourceIp);

      try {
         MDC.put("ipServer", InetAddress.getLocalHost().getHostAddress());
      } catch (Exception var34) {
         MDC.put("ipServer", "unknown");
      }

      MDC.put("destinationAppIp", request.getLocalAddr());
      MDC.put("destinationAppPort", String.valueOf(request.getLocalPort()));
      String urlPath = getFullURL(request);
      MDC.put("urlPath", urlPath);
      MDC.put("method", request.getMethod());
      MDC.put("status", "on");
      MDC.put("typeSystem", "DC");
      MDC.put("userAgent", request.getHeader("User-Agent"));
      MDC.put("host", request.getHeader("Host"));
      MDC.put("origin", request.getHeader("Origin"));
      MDC.put("contentType", request.getContentType());

      try {
         MDC.put("contentLength", String.valueOf(request.getContentLengthLong()));
      } catch (Exception var33) {
         MDC.put("contentLength", "0");
      }

      log.info("Start API: {}, ClientMessageId: {}, TransactionId: {}", new Object[]{request.getRequestURI(), clientMessageId, transactionId});
      MDC.remove("logType");
      if (!isWhitelisted) {
         try {
            this.processUserInfo(request);
         } catch (ApplicationException var31) {
            log.error("Error processing user information: {}", var31.getMessage(), var31);
            this.writeError(response, clientMessageId, transactionId, path, var31);
            MDC.clear();
            return;
         } catch (Exception var32) {
            log.error("Unexpected error when resolving user info: {}", var32.getMessage(), var32);
            this.writeError(response, clientMessageId, transactionId, path, var32);
            MDC.clear();
            return;
         }
      } else {
         log.info("Đường dẫn {} nằm trong whitelist, bỏ qua kiểm tra người dùng", path);
      }

      boolean var29 = false;

      try {
         var29 = true;
         filterChain.doFilter(request, response);
         var29 = false;
      } finally {
         if (var29) {
            long var19 = System.nanoTime() - startTime;
            double durationMs = (double)var19 / 1000000.0D;
            int status = response.getStatus();
            MDC.put("duration", String.format("%.3f", durationMs));
            MDC.put("responseCode", String.valueOf(status));
            MDC.put("logType", "http-response");
            log.info("Response: {}, API: {}, ClientMessageId: {}, Duration: {} ms", new Object[]{status, request.getRequestURI(), clientMessageId, String.format("%.3f", durationMs)});
            MDC.clear();
         }
      }

      long durationNs = System.nanoTime() - startTime;
      double durationMs = (double)durationNs / 1000000.0D;
      int status = response.getStatus();
      MDC.put("duration", String.format("%.3f", durationMs));
      MDC.put("responseCode", String.valueOf(status));
      MDC.put("logType", "http-response");
      log.info("Response: {}, API: {}, ClientMessageId: {}, Duration: {} ms", new Object[]{status, request.getRequestURI(), clientMessageId, String.format("%.3f", durationMs)});
      MDC.clear();
   }

   private void processUserInfo(HttpServletRequest request) {
      String header = request.getHeader("x-user-info");
      if (header != null) {
         byte[] decoded = Base64.getDecoder().decode(header);
         String xUserInfo = new String(decoded, StandardCharsets.UTF_8);
         UserInfo userInfo = (UserInfo)Optional.of(xUserInfo).map((json) -> {
            return (UserInfo)JsonUtil.fromJson(json, UserInfo.class);
         }).orElseThrow(() -> {
            log.error("Lỗi khi parse thông tin người dùng ngoài filter");
            return new ApplicationException("Không tìm thấy thông tin người dùng");
         });
         String userId = userInfo.getUserId();
         String userName = userInfo.getUsername();
         if (StringUtils.isBlank(userId) || StringUtils.isBlank(userName)) {
            log.error("Thông tin người dùng không hợp lệ ngoài filter");
            throw new ApplicationException("Thông tin người dùng không hợp lệ");
         }

         MDC.put("userId", userId);
         MDC.put("userName", userName);
         MDC.put("userRequest", userName);
         MDC.put("x-user-info", header);
      }

   }

   private void writeError(HttpServletResponse response, String clientMessageId, String transactionId, String path, Exception ex) throws IOException {
      response.setStatus(400);
      response.setContentType("application/json;charset=UTF-8");
      log.error("Error in LogMDCFilter for request {}: {}", new Object[]{path, ex.getMessage(), ex});
      ResponseData<Object> body = (new ResponseData<Object>(clientMessageId, transactionId, path)).error(99, "Có lỗi trong quá trình xử lý, vui lòng thử lại sau!", (Object)null, 400);
      response.getWriter().write(JsonUtil.toJson(body));
   }

   private static String getFullURL(HttpServletRequest request) {
      StringBuilder requestURL = new StringBuilder(request.getRequestURL().toString());
      String queryString = request.getQueryString();
      return queryString == null ? requestURL.toString() : requestURL.append('?').append(queryString).toString();
   }

   @Generated
   public LogMDCFilter(KeycloakProperties keycloakProperties, AntPathMatcher antPathMatcher) {
      this.keycloakProperties = keycloakProperties;
      this.antPathMatcher = antPathMatcher;
   }
}
