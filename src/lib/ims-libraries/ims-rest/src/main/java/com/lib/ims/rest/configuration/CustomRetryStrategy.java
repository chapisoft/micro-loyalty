package com.lib.ims.rest.configuration;

import java.io.InterruptedIOException;
import java.net.ConnectException;
import java.net.NoRouteToHostException;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.Collection;
import javax.net.ssl.SSLException;
import lombok.Generated;
import org.apache.hc.client5.http.impl.DefaultHttpRequestRetryStrategy;
import org.apache.hc.core5.http.ConnectionClosedException;
import org.apache.hc.core5.util.TimeValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CustomRetryStrategy extends DefaultHttpRequestRetryStrategy {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(CustomRetryStrategy.class);

   public CustomRetryStrategy(int maxRetries, TimeValue defaultRetryInterval, Collection<Integer> codes) {
      super(maxRetries, defaultRetryInterval, Arrays.asList(InterruptedIOException.class, UnknownHostException.class, ConnectException.class, ConnectionClosedException.class, NoRouteToHostException.class, SSLException.class), codes);
   }
}
