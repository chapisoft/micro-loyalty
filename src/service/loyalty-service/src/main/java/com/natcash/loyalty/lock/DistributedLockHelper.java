package com.natcash.loyalty.lock;

import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.exception.LoyaltyException;

import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Component
public class DistributedLockHelper {

    private static final Logger log = LoggerFactory.getLogger(DistributedLockHelper.class);

    private static final long DEFAULT_WAIT_TIME_MS = 3000L;
    private static final long DEFAULT_LEASE_TIME_MS = 5000L;

    private final RedissonClient redissonClient;

    public DistributedLockHelper(RedissonClient redissonClient) {
        this.redissonClient = redissonClient;
    }

    public <T> T executeWithBurnLock(String tenantId, String userId, Supplier<T> action) {
        String lockKey = RedisKeys.getBurnLockKey(tenantId, userId);
        return executeWithLock(lockKey, DEFAULT_WAIT_TIME_MS, DEFAULT_LEASE_TIME_MS, action);
    }

    public void executeWithBurnLock(String tenantId, String userId, Runnable action) {
        String lockKey = RedisKeys.getBurnLockKey(tenantId, userId);
        executeWithLock(lockKey, DEFAULT_WAIT_TIME_MS, DEFAULT_LEASE_TIME_MS, () -> {
            action.run();
            return null;
        });
    }

    public <T> T executeWithSpinLock(String tenantId, String userId, Long gameId, Supplier<T> action) {
        String lockKey = RedisKeys.getSpinLockKey(tenantId, userId, gameId);
        return executeWithLock(lockKey, DEFAULT_WAIT_TIME_MS, DEFAULT_LEASE_TIME_MS, action);
    }

    public <T> T executeWithLock(String lockKey, Supplier<T> action) {
        return executeWithLock(lockKey, DEFAULT_WAIT_TIME_MS, DEFAULT_LEASE_TIME_MS, action);
    }

    public void executeWithLock(String lockKey, Runnable action) {
        executeWithLock(lockKey, DEFAULT_WAIT_TIME_MS, DEFAULT_LEASE_TIME_MS, () -> {
            action.run();
            return null;
        });
    }

    public <T> T executeWithLock(String lockKey, long waitTimeMs, long leaseTimeMs, Supplier<T> action) {
        RLock lock = redissonClient.getLock(lockKey);
        boolean acquired = false;
        long startTime = System.currentTimeMillis();

        try {
            log.debug("[REDISSON-LOCK-TRY] key={}, waitTime={}ms, leaseTime={}ms", lockKey, waitTimeMs, leaseTimeMs);
            acquired = lock.tryLock(waitTimeMs, leaseTimeMs, TimeUnit.MILLISECONDS);
            if (!acquired) {
                log.warn("[REDISSON-LOCK-TIMEOUT] key={}, waitTime={}ms - không chiếm được khóa", lockKey, waitTimeMs);
                throw new LoyaltyException(ErrorCode.CONCURRENT_LOCK_BUSY);
            }
            long acquireDuration = System.currentTimeMillis() - startTime;
            log.debug("[REDISSON-LOCK-ACQUIRED] key={}, acquireDuration={}ms", lockKey, acquireDuration);

            return action.get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("[REDISSON-LOCK-INTERRUPTED] key={}, error={}", lockKey, e.getMessage(), e);
            throw new LoyaltyException(ErrorCode.CONCURRENT_LOCK_BUSY, "Tiến trình chiếm khóa bị gián đoạn");
        } finally {
            if (acquired && lock.isHeldByCurrentThread()) {
                try {
                    lock.unlock();
                    log.debug("[REDISSON-LOCK-RELEASED] key={}, totalDuration={}ms", lockKey, System.currentTimeMillis() - startTime);
                } catch (Exception e) {
                    log.error("[REDISSON-LOCK-RELEASE-ERROR] key={}, error={}", lockKey, e.getMessage(), e);
                }
            }
        }
    }

    public boolean tryLock(String lockKey, long waitTimeMs, long leaseTimeMs) {
        RLock lock = redissonClient.getLock(lockKey);
        try {
            return lock.tryLock(waitTimeMs, leaseTimeMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("[REDISSON-TRYLOCK-INTERRUPTED] key={}, error={}", lockKey, e.getMessage());
            return false;
        }
    }

    public void unlock(String lockKey) {
        RLock lock = redissonClient.getLock(lockKey);
        if (lock.isHeldByCurrentThread()) {
            try {
                lock.unlock();
            } catch (Exception e) {
                log.error("[REDISSON-UNLOCK-ERROR] key={}, error={}", lockKey, e.getMessage());
            }
        }
    }
}
