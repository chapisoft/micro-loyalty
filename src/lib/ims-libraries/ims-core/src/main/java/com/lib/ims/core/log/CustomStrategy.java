package com.lib.ims.core.log;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import lombok.Generated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.annotation.Nonnull;
import org.springframework.util.AntPathMatcher;
import org.zalando.logbook.HttpRequest;
import org.zalando.logbook.HttpResponse;
import org.zalando.logbook.Strategy;
import org.zalando.logbook.core.DefaultStrategy;
import org.zalando.logbook.core.WithoutBodyStrategy;


public class CustomStrategy implements Strategy {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(CustomStrategy.class);
   private final Strategy delegate = new DefaultStrategy();
   private final Strategy withoutBodyStrategy = new WithoutBodyStrategy();
   private final LogbookCustomProperties logbookCustomProperties;
   private final AntPathMatcher antPathMatcher;

   public CustomStrategy(LogbookCustomProperties logbookCustomProperties, AntPathMatcher antPathMatcher) {
      this.logbookCustomProperties = logbookCustomProperties;
      this.antPathMatcher = antPathMatcher;
   }

   private boolean whitelistValid(List<String> list, String path) {
      return list.stream().anyMatch((allow) -> {
         return this.antPathMatcher.match(allow, path);
      });
   }

   @Override
   @Nonnull
   @SuppressWarnings("null")
   public HttpResponse process(@Nonnull HttpRequest request, @Nonnull HttpResponse response) throws IOException {
      List<String> skipPaths = Optional.ofNullable(this.logbookCustomProperties.getSkipBodyPaths())
              .map(Arrays::asList)
              .orElse(Collections.emptyList());
      boolean isSkipLog = this.whitelistValid(skipPaths, request.getPath());
      return isSkipLog ? this.withoutBodyStrategy.process(request, response) : this.delegate.process(request, response);
   }
}
