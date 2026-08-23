package com.lib.ims.redis.service;

import com.lib.ims.redis.config.CacheDefinition;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import lombok.Generated;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

@Service
public class RedisService {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(RedisService.class);
   private static final Duration DEFAULT_EXPIRE_TIME = Duration.ofHours(1L);
   private final StringRedisTemplate redisTemplate;
   private final RedissonClient redissonClient;
   private static final long DEFAULT_WAIT_TIME = 10L;
   private static final long DEFAULT_LEASE_TIME = 30L;
   private static final TimeUnit DEFAULT_TIME_UNIT;
   private static final String GET_AND_DELETE_SCRIPT = "local value = redis.call('GET', KEYS[1]) if value then   redis.call('DEL', KEYS[1])   return value else   return nil end";
   private static final String SET_IF_NOT_EXISTS_SCRIPT = "if redis.call('EXISTS', KEYS[1]) == 0 then   redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])   return 1 else   return 0 end";

   public String get(String key) {
      long startTime = System.currentTimeMillis();

      long duration;
      try {
         String value = (String)this.redisTemplate.opsForValue().get(key);
         duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-GET] key={}, exists={}, duration={}ms", new Object[]{key, value != null, duration});
         return value;
      } catch (Exception var7) {
         duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-GET-ERROR] key={}, duration={}ms, error={}", new Object[]{key, duration, var7.getMessage(), var7});
         throw var7;
      }
   }

   public String get(CacheDefinition cacheDefinition, String key) {
      String var10000 = cacheDefinition.getName();
      String keyFinal = var10000 + key;
      return this.get(keyFinal);
   }

   public void set(String key, String value) {
      this.set(key, value, DEFAULT_EXPIRE_TIME);
   }

   public void set(String key, String value, Duration duration) {
      long startTime = System.currentTimeMillis();

      try {
         this.redisTemplate.opsForValue().set(key, value, duration);
         long execDuration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-SET] key={}, ttl={}s, duration={}ms", new Object[]{key, duration.getSeconds(), execDuration});
      } catch (Exception var9) {
         long execDuration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-SET-ERROR] key={}, ttl={}s, duration={}ms, error={}", new Object[]{key, duration.getSeconds(), execDuration, var9.getMessage(), var9});
         throw var9;
      }
   }

   public void set(CacheDefinition cacheDefinition, String value) {
      this.set(cacheDefinition.getName(), value, cacheDefinition.getTtl());
   }

   public void set(CacheDefinition cacheDefinition, String key, String value) {
      String var10000 = cacheDefinition.getName();
      String keyFinal = var10000 + key;
      this.set(keyFinal, value, cacheDefinition.getTtl());
   }

   public String getAndDelete(String key) {
      long startTime = System.currentTimeMillis();

      try {
         DefaultRedisScript<String> script = new DefaultRedisScript();
         script.setScriptText("local value = redis.call('GET', KEYS[1]) if value then   redis.call('DEL', KEYS[1])   return value else   return nil end");
         script.setResultType(String.class);
         String value = (String)this.redisTemplate.execute(script, Collections.singletonList(key), new Object[0]);
         long duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-GET-DELETE] key={}, found={}, duration={}ms", new Object[]{key, true, duration});
         return value;
      } catch (Exception var8) {
         long duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-GET-DELETE-ERROR] key={}, duration={}ms, error={}", new Object[]{key, duration, var8.getMessage(), var8});
         throw var8;
      }
   }

   public Boolean setIfNotExists(String key, String value, Duration duration) {
      long startTime = System.currentTimeMillis();

      long execDuration;
      try {
         Boolean result = this.redisTemplate.opsForValue().setIfAbsent(key, value, duration);
         execDuration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-SETNX] key={}, success={}, ttl={}s, duration={}ms", new Object[]{key, result, duration.getSeconds(), execDuration});
         return result != null && result;
      } catch (Exception var9) {
         execDuration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-SETNX-ERROR] key={}, ttl={}s, duration={}ms, error={}", new Object[]{key, duration.getSeconds(), execDuration, var9.getMessage(), var9});
         throw var9;
      }
   }

   public Boolean setIfExists(String key, String value, Duration duration) {
      long startTime = System.currentTimeMillis();

      long execDuration;
      try {
         Boolean result = this.redisTemplate.opsForValue().setIfPresent(key, value, duration);
         execDuration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-SETXX] key={}, success={}, ttl={}s, duration={}ms", new Object[]{key, result, duration.getSeconds(), execDuration});
         return result != null && result;
      } catch (Exception var9) {
         execDuration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-SETXX-ERROR] key={}, ttl={}s, duration={}ms, error={}", new Object[]{key, duration.getSeconds(), execDuration, var9.getMessage(), var9});
         throw var9;
      }
   }

   public Boolean delete(String key) {
      long startTime = System.currentTimeMillis();

      long duration;
      try {
         Boolean result = this.redisTemplate.delete(key);
         duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-DELETE] key={}, deleted={}, duration={}ms", new Object[]{key, result, duration});
         return result;
      } catch (Exception var7) {
         duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-DELETE-ERROR] key={}, duration={}ms, error={}", new Object[]{key, duration, var7.getMessage(), var7});
         throw var7;
      }
   }

   public Boolean delete(CacheDefinition cacheDefinition, String key) {
      String var10000 = cacheDefinition.getName();
      String keyFinal = var10000 + key;
      return this.delete(keyFinal);
   }

   public boolean tryLock(String lockKey) {
      return this.tryLock(lockKey, 10L, 30L, DEFAULT_TIME_UNIT);
   }

   public boolean tryLock(String lockKey, long waitTime, long leaseTime, TimeUnit timeUnit) {
      RLock lock = this.redissonClient.getLock(lockKey);

      try {
         boolean acquired = lock.tryLock(waitTime, leaseTime, timeUnit);
         log.debug("[REDIS-LOCK] key={}, success={}", lockKey, acquired);
         return acquired;
      } catch (InterruptedException var9) {
         Thread.currentThread().interrupt();
         log.error("[REDIS-LOCK-ERROR] key={}, error={}", new Object[]{lockKey, var9.getMessage(), var9});
         return false;
      } catch (Exception var10) {
         log.error("[REDIS-LOCK-ERROR] key={}, error={}", new Object[]{lockKey, var10.getMessage(), var10});
         return false;
      }
   }

   public void unlock(String lockKey) {
      RLock lock = this.redissonClient.getLock(lockKey);
      if (lock.isHeldByCurrentThread()) {
         try {
            lock.unlock();
            log.debug("[REDIS-UNLOCK] key={}, success=true", lockKey);
         } catch (IllegalMonitorStateException var4) {
            log.warn("[REDIS-UNLOCK-WARN] key={}, message=Không thể mở khóa vì không phải chủ sở hữu", lockKey);
         } catch (Exception var5) {
            log.error("[REDIS-UNLOCK-ERROR] key={}, error={}", new Object[]{lockKey, var5.getMessage(), var5});
         }
      }

   }

   public <T> T doWithLock(String lockKey, Supplier<T> task) {
      return this.doWithLock(lockKey, 10L, 30L, DEFAULT_TIME_UNIT, task);
   }

   public <T> T doWithLock(String lockKey, long waitTime, long leaseTime, TimeUnit timeUnit, Supplier<T> task) {
      if (this.tryLock(lockKey, waitTime, leaseTime, timeUnit)) {
         Object var8;
         try {
            log.debug("[REDIS-LOCK-EXEC] key={}, action=start", lockKey);
            var8 = task.get();
         } finally {
            this.unlock(lockKey);
            log.debug("[REDIS-LOCK-EXEC] key={}, action=end", lockKey);
         }

         return var8;
      } else {
         log.warn("[REDIS-LOCK-WARN] key={}, message=Không thể lấy khóa để thực thi tác vụ", lockKey);
         return null;
      }
   }

   public void doWithLock(String lockKey, Runnable task) {
      this.doWithLock(lockKey, 10L, 30L, DEFAULT_TIME_UNIT, task);
   }

   public void doWithLock(String lockKey, long waitTime, long leaseTime, TimeUnit timeUnit, Runnable task) {
      if (this.tryLock(lockKey, waitTime, leaseTime, timeUnit)) {
         try {
            log.debug("[REDIS-LOCK-EXEC] key={}, action=start", lockKey);
            task.run();
         } finally {
            this.unlock(lockKey);
            log.debug("[REDIS-LOCK-EXEC] key={}, action=end", lockKey);
         }
      } else {
         log.warn("[REDIS-LOCK-WARN] key={}, message=Không thể lấy khóa để thực thi tác vụ", lockKey);
      }

   }

   public boolean isLocked(String lockKey) {
      RLock lock = this.redissonClient.getLock(lockKey);
      boolean locked = lock.isLocked();
      log.debug("[REDIS-LOCK-CHECK] key={}, locked={}", lockKey, locked);
      return locked;
   }

   public void forceUnlock(String lockKey) {
      RLock lock = this.redissonClient.getLock(lockKey);
      if (lock.isLocked() && lock.isHeldByCurrentThread()) {
         try {
            lock.forceUnlock();
            log.warn("[REDIS-FORCE-UNLOCK] key={}, message=Đã mở khóa cưỡng chế", lockKey);
         } catch (Exception var4) {
            log.error("[REDIS-FORCE-UNLOCK-ERROR] key={}, error={}", new Object[]{lockKey, var4.getMessage(), var4});
         }
      }

   }

   public void clearAllKeys() {
      long startTime = System.currentTimeMillis();
      Set<String> keys = this.redisTemplate.keys("*");
      if (!keys.isEmpty()) {
         this.redisTemplate.delete(keys);
         long duration = System.currentTimeMillis() - startTime;
         log.warn("[REDIS-CLEAR-ALL] cleared={} keys, duration={}ms", keys.size(), duration);
      } else {
         log.info("[REDIS-CLEAR-ALL] no keys to clear");
      }

   }

   public Boolean hasKey(String key) {
      try {
         Boolean result = this.redisTemplate.hasKey(key);
         log.info("[REDIS-EXISTS] key={}, exists={}", key, result);
         return result;
      } catch (Exception var3) {
         log.error("[REDIS-EXISTS-ERROR] key={}, error={}", key, var3.getMessage());
         throw var3;
      }
   }

   public Boolean expire(String key, Duration duration) {
      try {
         Boolean result = this.redisTemplate.expire(key, duration);
         log.info("[REDIS-EXPIRE] key={}, ttl={}s, success={}", new Object[]{key, duration.getSeconds(), result});
         return result;
      } catch (Exception var4) {
         log.error("[REDIS-EXPIRE-ERROR] key={}, ttl={}s, error={}", new Object[]{key, duration.getSeconds(), var4.getMessage()});
         throw var4;
      }
   }

   public Long getExpire(String key) {
      try {
         Long ttl = this.redisTemplate.getExpire(key);
         log.debug("[REDIS-TTL] key={}, ttl={}s", key, ttl);
         return ttl;
      } catch (Exception var3) {
         log.error("[REDIS-TTL-ERROR] key={}, error={}", key, var3.getMessage());
         throw var3;
      }
   }

   public void setex(String key, String value, long seconds) {
      this.set(key, value, Duration.ofSeconds(seconds));
   }

   public Long sadd(String key, String... values) {
      long startTime = System.currentTimeMillis();

      long duration;
      try {
         Long result = this.redisTemplate.opsForSet().add(key, values);
         duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-SADD] key={}, added={}, duration={}ms", new Object[]{key, result, duration});
         return result;
      } catch (Exception var8) {
         duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-SADD-ERROR] key={}, duration={}ms, error={}", new Object[]{key, duration, var8.getMessage(), var8});
         throw var8;
      }
   }

   public Boolean sismember(String key, String value) {
      try {
         Boolean result = this.redisTemplate.opsForSet().isMember(key, value);
         log.debug("[REDIS-SISMEMBER] key={}, value={}, exists={}", new Object[]{key, value, result});
         return result;
      } catch (Exception var4) {
         log.error("[REDIS-SISMEMBER-ERROR] key={}, error={}", key, var4.getMessage());
         throw var4;
      }
   }

   public Long scard(String key) {
      try {
         Long result = this.redisTemplate.opsForSet().size(key);
         log.debug("[REDIS-SCARD] key={}, size={}", key, result);
         return result;
      } catch (Exception var3) {
         log.error("[REDIS-SCARD-ERROR] key={}, error={}", key, var3.getMessage());
         throw var3;
      }
   }

   public Set<String> smembers(String key) {
      try {
         Set<String> result = this.redisTemplate.opsForSet().members(key);
         log.debug("[REDIS-SMEMBERS] key={}, count={}", key, result != null ? result.size() : 0);
         return result;
      } catch (Exception var3) {
         log.error("[REDIS-SMEMBERS-ERROR] key={}, error={}", key, var3.getMessage());
         throw var3;
      }
   }

   public Long srem(String key, String... values) {
      long startTime = System.currentTimeMillis();

      long duration;
      try {
         Long result = this.redisTemplate.opsForSet().remove(key, (Object[])values);
         duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-SREM] key={}, removed={}, duration={}ms", new Object[]{key, result, duration});
         return result;
      } catch (Exception var8) {
         duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-SREM-ERROR] key={}, duration={}ms, error={}", new Object[]{key, duration, var8.getMessage(), var8});
         throw var8;
      }
   }

   public Boolean expire(String key, long seconds) {
      return this.expire(key, Duration.ofSeconds(seconds));
   }

   public Boolean expireAt(String key, long timestamp) {
      try {
         Boolean result = this.redisTemplate.expireAt(key, Instant.ofEpochSecond(timestamp));
         log.info("[REDIS-EXPIREAT] key={}, timestamp={}, success={}", new Object[]{key, timestamp, result});
         return result;
      } catch (Exception var5) {
         log.error("[REDIS-EXPIREAT-ERROR] key={}, timestamp={}, error={}", new Object[]{key, timestamp, var5.getMessage()});
         throw var5;
      }
   }

   public Set<String> keys(String pattern) {
      long startTime = System.currentTimeMillis();

      long duration;
      try {
         Set<String> keys = this.redisTemplate.keys(pattern);
         duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-KEYS] pattern={}, found={}, duration={}ms", new Object[]{pattern, keys.size(), duration});
         return keys;
      } catch (Exception var7) {
         duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-KEYS-ERROR] pattern={}, duration={}ms, error={}", new Object[]{pattern, duration, var7.getMessage(), var7});
         throw var7;
      }
   }

   public Long delete(String... keys) {
      if (keys != null && keys.length != 0) {
         long startTime = System.currentTimeMillis();

         long duration;
         try {
            Long result = this.redisTemplate.delete(Arrays.asList(keys));
            duration = System.currentTimeMillis() - startTime;
            log.info("[REDIS-DELETE-MULTI] count={}, deleted={}, duration={}ms", new Object[]{keys.length, result, duration});
            return result;
         } catch (Exception var7) {
            duration = System.currentTimeMillis() - startTime;
            log.error("[REDIS-DELETE-MULTI-ERROR] count={}, duration={}ms, error={}", new Object[]{keys.length, duration, var7.getMessage(), var7});
            throw var7;
         }
      } else {
         log.warn("[REDIS-DELETE-MULTI] no keys provided");
         return 0L;
      }
   }

   public Long deleteByPattern(String pattern) {
      long startTime = System.currentTimeMillis();
      Set<String> keys = this.keys(pattern);
      if (keys != null && !keys.isEmpty()) {
         long duration;
         try {
            Long result = this.redisTemplate.delete(keys);
            duration = System.currentTimeMillis() - startTime;
            log.info("[REDIS-DELETE-PATTERN] pattern={}, deleted={}, duration={}ms", new Object[]{pattern, result, duration});
            return result;
         } catch (Exception var8) {
            duration = System.currentTimeMillis() - startTime;
            log.error("[REDIS-DELETE-PATTERN-ERROR] pattern={}, duration={}ms, error={}", new Object[]{pattern, duration, var8.getMessage(), var8});
            throw var8;
         }
      } else {
         log.info("[REDIS-DELETE-PATTERN] pattern={}, found=0 keys", pattern);
         return 0L;
      }
   }

   public Long incr(String key) {
      long startTime = System.currentTimeMillis();

      long duration;
      try {
         Long result = this.redisTemplate.opsForValue().increment(key);
         duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-INCR] key={}, result={}, duration={}ms", new Object[]{key, result, duration});
         return result;
      } catch (Exception var7) {
         duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-INCR-ERROR] key={}, duration={}ms, error={}", new Object[]{key, duration, var7.getMessage(), var7});
         throw var7;
      }
   }

   public Long incrementBy(String key, long increment) {
      long startTime = System.currentTimeMillis();

      long duration;
      try {
         Long result = this.redisTemplate.opsForValue().increment(key, increment);
         duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-INCRBY] key={}, by={}, result={}, duration={}ms", new Object[]{key, increment, result, duration});
         return result;
      } catch (Exception var9) {
         duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-INCRBY-ERROR] key={}, by={}, duration={}ms, error={}", new Object[]{key, increment, duration, var9.getMessage(), var9});
         throw var9;
      }
   }

   public Long decr(String key) {
      long startTime = System.currentTimeMillis();

      long duration;
      try {
         Long result = this.redisTemplate.opsForValue().decrement(key);
         duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-DECR] key={}, result={}, duration={}ms", new Object[]{key, result, duration});
         return result;
      } catch (Exception var7) {
         duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-DECR-ERROR] key={}, duration={}ms, error={}", new Object[]{key, duration, var7.getMessage(), var7});
         throw var7;
      }
   }

   public Long decrBy(String key, long decrement) {
      long startTime = System.currentTimeMillis();

      long duration;
      try {
         Long result = this.redisTemplate.opsForValue().decrement(key, decrement);
         duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-DECRBY] key={}, by={}, result={}, duration={}ms", new Object[]{key, decrement, result, duration});
         return result;
      } catch (Exception var9) {
         duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-DECRBY-ERROR] key={}, by={}, duration={}ms, error={}", new Object[]{key, decrement, duration, var9.getMessage(), var9});
         throw var9;
      }
   }

   public Long leftPushAll(String key, String... values) {
      long startTime = System.currentTimeMillis();

      long duration;
      try {
         Long result = this.redisTemplate.opsForList().leftPushAll(key, values);
         duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-LPUSH] key={}, added={}, duration={}ms", new Object[]{key, result, duration});
         return result;
      } catch (Exception var8) {
         duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-LPUSH-ERROR] key={}, duration={}ms, error={}", new Object[]{key, duration, var8.getMessage(), var8});
         throw var8;
      }
   }

   public Long rightPushAll(String key, String... values) {
      long startTime = System.currentTimeMillis();

      long duration;
      try {
         Long result = this.redisTemplate.opsForList().rightPushAll(key, values);
         duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-RPUSH] key={}, added={}, duration={}ms", new Object[]{key, result, duration});
         return result;
      } catch (Exception var8) {
         duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-RPUSH-ERROR] key={}, duration={}ms, error={}", new Object[]{key, duration, var8.getMessage(), var8});
         throw var8;
      }
   }

   public String lpop(String key) {
      long startTime = System.currentTimeMillis();

      long duration;
      try {
         String result = (String)this.redisTemplate.opsForList().leftPop(key);
         duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-LPOP] key={}, found={}, duration={}ms", new Object[]{key, result != null, duration});
         return result;
      } catch (Exception var7) {
         duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-LPOP-ERROR] key={}, duration={}ms, error={}", new Object[]{key, duration, var7.getMessage(), var7});
         throw var7;
      }
   }

   public String rightPop(String key) {
      long startTime = System.currentTimeMillis();

      long duration;
      try {
         String result = (String)this.redisTemplate.opsForList().rightPop(key);
         duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-RPOP] key={}, found={}, duration={}ms", new Object[]{key, result != null, duration});
         return result;
      } catch (Exception var7) {
         duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-RPOP-ERROR] key={}, duration={}ms, error={}", new Object[]{key, duration, var7.getMessage(), var7});
         throw var7;
      }
   }

   public Long listLength(String key) {
      try {
         Long result = this.redisTemplate.opsForList().size(key);
         log.debug("[REDIS-LLEN] key={}, length={}", key, result);
         return result;
      } catch (Exception var3) {
         log.error("[REDIS-LLEN-ERROR] key={}, error={}", key, var3.getMessage());
         throw var3;
      }
   }

   public List<String> listRange(String key, long start, long end) {
      try {
         List<String> result = this.redisTemplate.opsForList().range(key, start, end);
         log.debug("[REDIS-LRANGE] key={}, range=[{},{}], size={}", new Object[]{key, start, end, result != null ? result.size() : 0});
         return result;
      } catch (Exception var7) {
         log.error("[REDIS-LRANGE-ERROR] key={}, range=[{},{}], error={}", new Object[]{key, start, end, var7.getMessage()});
         throw var7;
      }
   }

   public List<Object> executePipelined(RedisCallback<Object> action) {
      long startTime = System.currentTimeMillis();

      long duration;
      try {
         List<Object> results = this.redisTemplate.executePipelined(action);
         duration = System.currentTimeMillis() - startTime;
         log.info("[REDIS-PIPELINE] số lượng hoạt động={}, thời gian thực hiện={}ms", results.size(), duration);
         return results;
      } catch (Exception var7) {
         duration = System.currentTimeMillis() - startTime;
         log.error("[REDIS-PIPELINE-ERROR] duration={}ms, error={}", new Object[]{duration, var7.getMessage(), var7});
         throw var7;
      }
   }

   public <T> T executeScript(DefaultRedisScript<T> script, List<String> keys, List<String> args) {
      try {
         T result = this.redisTemplate.execute(script, keys, args.toArray());
         log.info("Redis Lua script executed successfully");
         return result;
      } catch (Exception var5) {
         log.error("[REDIS-executeScript] status=FAILED, error= Redis Lua script execution failed {}", var5.getMessage());
         throw var5;
      }
   }

   public boolean isHealthy() {
      try {
         String testKey = "health_check_" + System.currentTimeMillis();
         this.redisTemplate.opsForValue().get(testKey);
         log.debug("[REDIS-HEALTH] status=OK");
         return true;
      } catch (Exception var2) {
         log.error("[REDIS-HEALTH] status=FAILED, error={}", var2.getMessage());
         return false;
      }
   }

   @Generated
   public RedisService(StringRedisTemplate redisTemplate, RedissonClient redissonClient) {
      this.redisTemplate = redisTemplate;
      this.redissonClient = redissonClient;
   }

   static {
      DEFAULT_TIME_UNIT = TimeUnit.SECONDS;
   }
}
