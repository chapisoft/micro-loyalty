package com.lib.ims.rest.configuration;

import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.function.Predicate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRequest;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClient.Builder;
import org.springframework.web.client.RestClient.ResponseSpec.ErrorHandler;
import org.zalando.logbook.spring.LogbookClientHttpRequestInterceptor;

@Component
public class RestClientFactory {
   private final HttpComponentsClientHttpRequestFactory httpComponentsClientHttpRequestFactory;
   private final LogbookClientHttpRequestInterceptor logbookClientHttpRequestInterceptor;
   private final RestClientInterceptor restClientInterceptor;

   public RestClientFactory(HttpComponentsClientHttpRequestFactory httpComponentsClientHttpRequestFactory, LogbookClientHttpRequestInterceptor logbookClientHttpRequestInterceptor, RestClientInterceptor restClientInterceptor) {
      this.httpComponentsClientHttpRequestFactory = httpComponentsClientHttpRequestFactory;
      this.logbookClientHttpRequestInterceptor = logbookClientHttpRequestInterceptor;
      this.restClientInterceptor = restClientInterceptor;
   }

   public RestClient createRestClient(Predicate<HttpStatusCode> statusPredicate, ErrorHandler errorHandler) {
      Builder builder = RestClient.builder().requestInterceptor(this.restClientInterceptor).requestInterceptor(this.logbookClientHttpRequestInterceptor).requestFactory(this.httpComponentsClientHttpRequestFactory).defaultHeaders(this.getDefaultHttpHeaders()).defaultStatusHandler(statusPredicate, errorHandler);
      return builder.build();
   }

   public RestClient createRestClient(Predicate<HttpStatusCode> statusPredicate, ErrorHandler errorHandler, BiConsumer<HttpRequest, HttpHeaders> headersCustomizer) {
      Builder builder = RestClient.builder().requestInterceptor(this.restClientInterceptor).requestInterceptor(this.logbookClientHttpRequestInterceptor).requestFactory(this.httpComponentsClientHttpRequestFactory).defaultHeaders(this.getDefaultHttpHeaders()).defaultStatusHandler(statusPredicate, errorHandler);
      if (headersCustomizer != null) {
         builder.requestInterceptor((request, body, execution) -> {
            headersCustomizer.accept(request, request.getHeaders());
            return execution.execute(request, body);
         });
      }

      return builder.build();
   }

   private Consumer<HttpHeaders> getDefaultHttpHeaders() {
      return (headers) -> {
         headers.add("Content-Type", "application/json");
      };
   }
}
