package com.lib.ims.redis.config;

import java.util.Properties;
import lombok.Generated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;

@Component
public class RedisSentinelHealthChecker implements CommandLineRunner {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(RedisSentinelHealthChecker.class);
   private final RedisConnectionFactory redisConnectionFactory;

   public void run(String... args) {
      log.info("Checking Redis/Sentinel health...");

      try {
         RedisConnection connection = this.redisConnectionFactory.getConnection();

         label58: {
            try {
               Properties info = connection.serverCommands().info("replication");
               if (info != null && !info.isEmpty()) {
                  String role = info.getProperty("role", "unknown");
                  String connectedSlaves = info.getProperty("connected_slaves", "0");
                  String masterHost = info.getProperty("master_host", "N/A");
                  log.info("Redis connection OK.");
                  log.info("Role: {}", role);
                  if ("master".equalsIgnoreCase(role)) {
                     log.info("Connected slaves: {}", connectedSlaves);
                  } else if ("slave".equalsIgnoreCase(role)) {
                     log.info("Master host: {}", masterHost);
                  }
                  break label58;
               }

               log.warn("Unable to read Redis replication info. Possibly connected to Sentinel port instead of Redis port.");
            } catch (Throwable var8) {
               if (connection != null) {
                  try {
                     connection.close();
                  } catch (Throwable var7) {
                     var8.addSuppressed(var7);
                  }
               }

               throw var8;
            }

            if (connection != null) {
               connection.close();
            }

            return;
         }

         if (connection != null) {
            connection.close();
         }
      } catch (Exception var9) {
         log.error("Failed to connect to Redis: {}", var9.getMessage(), var9);
      }

   }

   @Generated
   public RedisSentinelHealthChecker(RedisConnectionFactory redisConnectionFactory) {
      this.redisConnectionFactory = redisConnectionFactory;
   }
}
