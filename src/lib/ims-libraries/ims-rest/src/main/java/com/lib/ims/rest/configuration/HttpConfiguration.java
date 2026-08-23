package com.lib.ims.rest.configuration;

import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.concurrent.TimeUnit;
import lombok.Generated;
import org.apache.hc.client5.http.config.ConnectionConfig;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.config.RequestConfig.Builder;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.core5.util.TimeValue;
import org.apache.hc.core5.util.Timeout;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;


@Configuration
@SuppressWarnings({"unchecked", "rawtypes"})
public class HttpConfiguration {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(HttpConfiguration.class);

   @Bean
   @ConfigurationProperties(
      prefix = "http-client.connection-pool"
   )
   public HttpConnPoolProperties httpConnPoolProperties() {
      return new HttpConnPoolProperties();
   }

   @Bean
   public CircuitBreakerProperties circuitBreakerProperties(HttpConnPoolProperties httpConnPoolProperties) {
      return httpConnPoolProperties.getCircuitBreaker();
   }

   @Bean
   public CircuitBreakerRegistry circuitBreakerRegistry(CircuitBreakerProperties circuitBreakerProperties) {
      CircuitBreakerConfig circuitBreakerConfig = CircuitBreakerConfig.custom().slidingWindowSize(circuitBreakerProperties.getSlidingWindowSize()).failureRateThreshold(circuitBreakerProperties.getFailureRateThreshold()).waitDurationInOpenState(Duration.ofMillis((long)circuitBreakerProperties.getWaitDurationInOpenStateMillis())).permittedNumberOfCallsInHalfOpenState(circuitBreakerProperties.getPermittedNumberOfCallsInHalfOpenState()).slowCallRateThreshold((float)circuitBreakerProperties.getSlowCallRateThreshold()).slowCallDurationThreshold(Duration.ofMillis((long)circuitBreakerProperties.getSlowCallDurationThresholdMillis())).build();
      CircuitBreakerRegistry circuitBreakerRegistry = CircuitBreakerRegistry.of(circuitBreakerConfig);
      circuitBreakerRegistry.circuitBreaker(circuitBreakerProperties.getBaseNamePrefix());
      if (circuitBreakerProperties.getHostnames() != null) {
         Iterator var5 = circuitBreakerProperties.getHostnames().iterator();

         while(var5.hasNext()) {
            String hostname = (String)var5.next();
            String var10000 = circuitBreakerProperties.getBaseNamePrefix();
            String cbName = var10000 + "." + hostname;
            circuitBreakerRegistry.circuitBreaker(cbName);
            log.info("Đã khởi tạo sẵn CircuitBreaker cho hostname: {}", hostname);
         }
      }

      log.info("Đã tạo CircuitBreaker toàn cục: {}, với cấu hình: {}", circuitBreakerProperties.getBaseNamePrefix(), circuitBreakerConfig);
      log.info("Circuit Breaker theo dịch vụ: {}", circuitBreakerProperties.isPerServiceEnabled() ? "Đã kích hoạt" : "Đã vô hiệu hóa");
      return circuitBreakerRegistry;
   }

   @Bean
   PoolingHttpClientConnectionManager connectionManager(HttpConnPoolProperties connPoolProperties) {
      log.info("Creating PoolingHttpClientConnectionManager with properties: {}", connPoolProperties);
      ConnectionConfig connectionConfig = ConnectionConfig.custom().setConnectTimeout((long)connPoolProperties.getConnectTimeout(), TimeUnit.MILLISECONDS).setSocketTimeout(connPoolProperties.getSocketTimeout(), TimeUnit.MILLISECONDS).setTimeToLive((long)connPoolProperties.getTtl(), TimeUnit.MILLISECONDS).setValidateAfterInactivity((long)connPoolProperties.getInactiveValidationTime(), TimeUnit.MILLISECONDS).build();
      return PoolingHttpClientConnectionManagerBuilder.create().setDefaultConnectionConfig(connectionConfig).setMaxConnTotal(connPoolProperties.getMaxConnections()).setMaxConnPerRoute(connPoolProperties.getMaxPerConnections()).build();
   }

   @Bean
   public HttpComponentsClientHttpRequestFactory httpComponentsClientHttpRequestFactory(HttpConnPoolProperties connPoolProperties, PoolingHttpClientConnectionManager connectionManager) {
      log.info("Creating RestClient with properties: {}", connPoolProperties);
      HttpClientBuilder httpClientBuilder = HttpClients.custom().setConnectionManager(connectionManager);
      Builder requestConfigBuilder = RequestConfig.custom();
      if (connPoolProperties.getLeaseRequestTimeout() > 0) {
         requestConfigBuilder.setConnectionRequestTimeout(Timeout.ofMilliseconds((long)connPoolProperties.getLeaseRequestTimeout()));
      }

      if (connPoolProperties.getMaxIdleTime() > 0) {
         requestConfigBuilder.setConnectionKeepAlive(TimeValue.ofMilliseconds((long)connPoolProperties.getMaxIdleTime()));
      }

      httpClientBuilder.setDefaultRequestConfig(requestConfigBuilder.build());
      if (connPoolProperties.getRetryLimit() > 0 || connPoolProperties.getRetryWaitTimeMillis() > 0) {
         int retryLimit = connPoolProperties.getRetryLimit() > 0 ? connPoolProperties.getRetryLimit() : 1;
         int retryWaitTimeMillis = connPoolProperties.getRetryWaitTimeMillis() > 0 ? connPoolProperties.getRetryWaitTimeMillis() : 750;
         httpClientBuilder.setRetryStrategy(new CustomRetryStrategy(retryLimit, TimeValue.ofMilliseconds((long)retryWaitTimeMillis), new ArrayList(Arrays.asList(connPoolProperties.getRetryException()))));
      }

      requestConfigBuilder.setResponseTimeout(1000L, TimeUnit.MILLISECONDS);
      if (connPoolProperties.isEvictExpiredConnections()) {
         httpClientBuilder.evictExpiredConnections();
      }

      if (connPoolProperties.isEvictIdleConnections() && connPoolProperties.getMaxIdleTime() > 0) {
         httpClientBuilder.evictIdleConnections(TimeValue.ofMilliseconds((long)connPoolProperties.getMaxIdleTime()));
      }

      HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
      factory.setHttpClient(httpClientBuilder.build());
      return factory;
   }
}
