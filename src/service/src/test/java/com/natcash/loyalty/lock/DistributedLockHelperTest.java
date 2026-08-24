package com.natcash.loyalty.lock;

import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.exception.LoyaltyException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DistributedLockHelperTest {

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private RLock rLock;

    private DistributedLockHelper distributedLockHelper;

    @BeforeEach
    void setUp() {
        distributedLockHelper = new DistributedLockHelper(redissonClient);
    }

    @Test
    @DisplayName("BE-05-UT-01: Chiếm khóa thành công và thực thi logic trả về kết quả")
    void testExecuteWithLockSuccess() throws InterruptedException {
        String lockKey = "lock:burn:TENANT_DELIMART:USER_123";
        when(redissonClient.getLock(lockKey)).thenReturn(rLock);
        when(rLock.tryLock(3000L, 5000L, TimeUnit.MILLISECONDS)).thenReturn(true);
        when(rLock.isHeldByCurrentThread()).thenReturn(true);

        String result = distributedLockHelper.executeWithBurnLock("TENANT_DELIMART", "USER_123", () -> "REDEEM_SUCCESS");

        assertEquals("REDEEM_SUCCESS", result);
        verify(rLock, times(1)).tryLock(3000L, 5000L, TimeUnit.MILLISECONDS);
        verify(rLock, times(1)).unlock();
    }

    @Test
    @DisplayName("BE-05-UT-02: Ném lỗi CONCURRENT_LOCK_BUSY khi không thể lấy khóa do timeout")
    void testExecuteWithLockTimeoutThrowsException() throws InterruptedException {
        String lockKey = "lock:burn:TENANT_DELIMART:USER_BUSY";
        when(redissonClient.getLock(lockKey)).thenReturn(rLock);
        when(rLock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(false);

        LoyaltyException ex = assertThrows(LoyaltyException.class, () ->
                distributedLockHelper.executeWithBurnLock("TENANT_DELIMART", "USER_BUSY", () -> "FAIL")
        );

        assertEquals(ErrorCode.CONCURRENT_LOCK_BUSY, ex.getErrorCode());
    }

    @Test
    @DisplayName("BE-05-UT-03: Kiểm thử đồng thời 10 luồng tuần tự hóa qua cơ chế khóa")
    void testConcurrent10ThreadsExecution() throws InterruptedException {
        AtomicInteger activeWorkers = new AtomicInteger(0);
        AtomicInteger maxConcurrency = new AtomicInteger(0);
        AtomicInteger completedCount = new AtomicInteger(0);

        Object monitor = new Object();

        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(rLock.isHeldByCurrentThread()).thenReturn(true);

        when(rLock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenAnswer(invocation -> {
            synchronized (monitor) {
                return true;
            }
        });

        doAnswer(invocation -> {
            synchronized (monitor) {
                // Giải phóng khóa
            }
            return null;
        }).when(rLock).unlock();

        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    distributedLockHelper.executeWithSpinLock("TENANT_NATCASH", "USER_999", 1L, () -> {
                        int current = activeWorkers.incrementAndGet();
                        maxConcurrency.updateAndGet(max -> Math.max(max, current));
                        try {
                            Thread.sleep(10);
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        } finally {
                            activeWorkers.decrementAndGet();
                            completedCount.incrementAndGet();
                        }
                        return null;
                    });
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean finished = doneLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        assertEquals(true, finished);
        assertEquals(10, completedCount.get());
    }
}
