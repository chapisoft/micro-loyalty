package com.lib.ims.redis;

import com.lib.ims.redis.config.CacheDefinition;
import com.lib.ims.redis.service.RedisService;
import java.time.Duration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import org.redisson.api.RedissonClient;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair;
import com.fasterxml.jackson.databind.ObjectMapper;


@Configuration
@EnableCaching
@ConditionalOnClass({RedisTemplate.class, CacheManager.class})
@AutoConfiguration
@ComponentScan(
   basePackages = {"com.lib.ims.redis"}
)
@SuppressWarnings({"unchecked", "rawtypes", "null"})
public class IMSRedisAutoConfiguration {
   private RedisCacheConfiguration createCacheConfiguration(Duration ttl, ObjectMapper objectMapper) {
      return RedisCacheConfiguration.defaultCacheConfig().entryTtl(ttl).serializeKeysWith(SerializationPair.fromSerializer(new StringRedisSerializer())).serializeValuesWith(SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer(objectMapper))).disableCachingNullValues();
   }

   @Bean
   public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory, List<CacheDefinition> cacheDefinitions, ObjectMapper objectMapper) {
      RedisCacheConfiguration defaultConfig = this.createCacheConfiguration(Duration.ofMinutes(10L), objectMapper);
      Map<String, RedisCacheConfiguration> initialCacheConfigs = new HashMap();
      Iterator var6 = cacheDefinitions.iterator();

      while(var6.hasNext()) {
         CacheDefinition definition = (CacheDefinition)var6.next();
         if (definition.getName() != null && definition.getTtl() != null) {
            initialCacheConfigs.put(definition.getName(), this.createCacheConfiguration(definition.getTtl(), objectMapper));
         }
      }

      return RedisCacheManager.builder(redisConnectionFactory).cacheDefaults(defaultConfig).withInitialCacheConfigurations(initialCacheConfigs).build();
   }

   @Bean
   public RedisService redisService(StringRedisTemplate stringRedisTemplate, RedissonClient redissonClient) {
      return new RedisService(stringRedisTemplate, redissonClient);
   }
}
