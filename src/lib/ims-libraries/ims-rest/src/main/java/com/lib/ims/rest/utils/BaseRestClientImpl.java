package com.lib.ims.rest.utils;

import java.net.URI;
import java.util.Map;
import java.util.function.Consumer;
import lombok.Generated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClient.RequestBodySpec;


@Component
@SuppressWarnings({"unchecked", "rawtypes"})
public class BaseRestClientImpl implements BaseRestClient {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(BaseRestClientImpl.class);
   private final RestClient restClient;

   public <T> T get(String uri, Map<String, String> queryParams, Class<T> resultType, Map<String, String> httpHeader, Object... uriVariables) {
      Consumer<HttpHeaders> header = RestClientUtils.mapToConsumer(httpHeader);
      URI builder = RestClientUtils.methodUri(uri, queryParams, uriVariables);
      return this.restClient.get().uri(builder).headers(header).retrieve().body(resultType);
   }

   public <T> T post(String uri, Object body, Class<T> resultType, Map<String, String> httpHeader) {
      Consumer<HttpHeaders> header = RestClientUtils.mapToConsumer(httpHeader);
      return ((RequestBodySpec)((RequestBodySpec)this.restClient.post().uri(uri, new Object[0])).headers(header)).body(body).retrieve().body(resultType);
   }

   public <T> T put(String uri, Object body, Class<T> resultType, Map<String, String> httpHeader) {
      Consumer<HttpHeaders> header = RestClientUtils.mapToConsumer(httpHeader);
      return ((RequestBodySpec)this.restClient.put().headers(header)).body(body).retrieve().body(resultType);
   }

   public <T> T delete(String uri, Class<T> resultType, Map<String, String> httpHeader, Object... uriVariables) {
      Consumer<HttpHeaders> header = RestClientUtils.mapToConsumer(httpHeader);
      URI builder = RestClientUtils.methodUri(uri, (Map)null, uriVariables);
      return this.restClient.delete().uri(builder).headers(header).retrieve().body(resultType);
   }

   @Generated
   public BaseRestClientImpl(RestClient restClient) {
      this.restClient = restClient;
   }
}
