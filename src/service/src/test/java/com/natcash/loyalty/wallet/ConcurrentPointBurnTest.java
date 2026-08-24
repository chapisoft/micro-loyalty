package com.natcash.loyalty.wallet;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.stream.LoyaltyStreamProducer;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletRedeemRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletRedeemResponse;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRedemptionRepository;
import com.natcash.loyalty.wallet.service.RewardWalletService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ConcurrentPointBurnTest {

    @Mock
    private AccountService accountService;

    @Mock
    private LoyaltyAccountRepository accountRepository;

    @Mock
    private LoyaltyPointLedgerRepository ledgerRepository;

    @Mock
    private LoyaltyVoucherRedemptionRepository redemptionRepository;

    @Mock
    private ClearingTransactionRepository clearingRepository;

    @Mock
    private DistributedLockHelper lockHelper;

    @Mock
    private LoyaltyStreamProducer streamProducer;

    private RewardWalletService rewardWalletService;

    private LoyaltyAccountEntity account;
    private final ReentrantLock localMutex = new ReentrantLock();

    @BeforeEach
    void setUp() {
        rewardWalletService = new RewardWalletService(
                accountService,
                accountRepository,
                ledgerRepository,
                redemptionRepository,
                clearingRepository,
                lockHelper,
                streamProducer
        );

        // Khởi tạo tài khoản mẫu có 500 điểm
        account = LoyaltyAccountEntity.builder()
                .id(100L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("CUST_CONCURRENT_01")
                .currentPoints(new BigDecimal("500.00"))
                .build();

        // Mô phỏng cơ chế khóa phân tán tuần tự hóa giao dịch
        doAnswer(invocation -> {
            Supplier<?> supplier = invocation.getArgument(3);
            localMutex.lock();
            try {
                return supplier.get();
            } finally {
                localMutex.unlock();
            }
        }).when(lockHelper).executeWithLock(anyString(), anyLong(), anyLong(), any());

        // Mô phỏng khóa bi quan SELECT ... FOR UPDATE trả về thực thể tài khoản
        when(accountService.getAccountForUpdate(eq("TENANT_DELIMART"), eq("CUST_CONCURRENT_01")))
                .thenReturn(account);

        when(clearingRepository.findByTenantIdAndTransactionCode(anyString(), anyString()))
                .thenReturn(Optional.empty());

        when(clearingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(ledgerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("SEC-02: Bắn 10 luồng đồng thời trừ 500 điểm - Chỉ duy nhất 1 luồng thành công, 9 luồng bị từ chối")
    void testConcurrentPointBurn_ExactlyOneSucceeds() throws InterruptedException {
        int numberOfThreads = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        List<String> errorCodes = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < numberOfThreads; i++) {
            final int index = i;
            executorService.submit(() -> {
                try {
                    // Chờ tín hiệu xuất phát đồng thời
                    startLatch.await();

                    RewardWalletRedeemRequest req = RewardWalletRedeemRequest.builder()
                            .externalUserId("CUST_CONCURRENT_01")
                            .transactionCode("TX_CONCURRENT_" + index)
                            .totalBillAmount(new BigDecimal("1000.00"))
                            .pointsToBurn(new BigDecimal("500.00"))
                            .redeemerPartnerId(2L)
                            .build();

                    RewardWalletRedeemResponse res = rewardWalletService.redeem("TENANT_DELIMART", req);
                    if (res != null && res.getPointDiscountAmount().compareTo(new BigDecimal("500.00")) == 0) {
                        successCount.incrementAndGet();
                    }
                } catch (LoyaltyException e) {
                    failureCount.incrementAndGet();
                    errorCodes.add(e.getErrorCode() != null ? e.getErrorCode().name() : e.getMessage());
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        // Kích hoạt tất cả các luồng chạy cùng lúc
        startLatch.countDown();

        // Chờ tất cả hoàn thành tối đa 5 giây
        boolean finished = finishLatch.await(5, TimeUnit.SECONDS);
        executorService.shutdown();

        assertTrue(finished, "Toàn bộ 10 luồng phải hoàn tất trong 5 giây");

        // Xác thực kết quả toàn vẹn tài chính:
        assertEquals(1, successCount.get(), "Chỉ duy nhất 1 giao dịch được phép trừ 500 điểm thành công");
        assertEquals(9, failureCount.get(), "9 giao dịch còn lại phải bị từ chối do không đủ điểm");
        assertEquals(new BigDecimal("0.00"), account.getCurrentPoints(), "Số dư cuối cùng của tài khoản phải bằng 0.00 (không âm)");
        assertTrue(errorCodes.contains(ErrorCode.INSUFFICIENT_POINTS.name()), "Mã lỗi nhận được phải là INSUFFICIENT_POINTS");
    }
}
