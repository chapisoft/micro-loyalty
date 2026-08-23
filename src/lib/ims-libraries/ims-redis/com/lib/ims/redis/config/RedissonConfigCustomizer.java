package com.lib.ims.redis.config;

import org.redisson.codec.JsonJacksonCodec;
import org.redisson.config.Config;
import org.redisson.config.SentinelServersConfig;
import org.redisson.config.SingleServerConfig;
import org.redisson.spring.starter.RedissonAutoConfigurationCustomizer;
import org.springframework.stereotype.Component;

@Component
public class RedissonConfigCustomizer implements RedissonAutoConfigurationCustomizer {
   public void customize(Config config) {
      config.setThreads(16).setNettyThreads(32).setCodec(new JsonJacksonCodec());
      if (config.isSingleConfig()) {
         SingleServerConfig single = config.useSingleServer();
         ((SingleServerConfig)single.setConnectionPoolSize(128).setIdleConnectionTimeout(10000)).setConnectTimeout(5000);
      }

      if (config.isSentinelConfig()) {
         SentinelServersConfig sentinel = config.useSentinelServers();
         ((SentinelServersConfig)((SentinelServersConfig)((SentinelServersConfig)((SentinelServersConfig)sentinel.setCheckSentinelsList(false).setMasterConnectionPoolSize(128)).setSlaveConnectionPoolSize(128)).setCheckSentinelsList(false).setTimeout(3000)).setConnectTimeout(5000)).setFailedSlaveReconnectionInterval(3000);
      }

   }
}
