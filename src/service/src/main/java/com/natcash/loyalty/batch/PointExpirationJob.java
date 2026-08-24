package com.natcash.loyalty.batch;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class PointExpirationJob {

    private static final Logger log = LoggerFactory.getLogger(PointExpirationJob.class);
    private static final String LOCK_KEY = "lock:batch:point-expiration";

    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final DistributedLockHelper lockHelper;

    public PointExpirationJob(LoyaltyAccountRepository accountRepository,
                              LoyaltyPointLedgerRepository ledgerRepository,
                              DistributedLockHelper lockHelper) {
        this.accountRepository = accountRepository;
        this.ledgerRepository = ledgerRepository;
        this.lockHelper = lockHelper;
    }

    /**
     * Chạy định kỳ lúc 00:30 hàng ngày để quét điểm hết hạn chu kỳ
     */
    @Scheduled(cron = "0 30 0 * * ?")
    @Transactional
    public void executePointExpiration() {
        lockHelper.executeWithLock(LOCK_KEY, () -> {
            log.info("[BATCH-POINT-EXPIRATION-START] Bắt đầu tiến trình quét điểm hết hạn định kỳ");
            List<LoyaltyAccountEntity> accounts = accountRepository.findAll();
            int expiredCount = 0;

            for (LoyaltyAccountEntity account : accounts) {
                // Kiểm tra nếu tài khoản có điểm và đã quá hạn sử dụng mà không có hoạt động
                if (account.getCurrentPoints().compareTo(BigDecimal.ZERO) > 0 && account.getUpdatedAt() != null) {
                    Instant expireThreshold = Instant.now().minusSeconds(86400L * 365); // 365 ngày
                    if (account.getUpdatedAt().isBefore(expireThreshold)) {
                        BigDecimal expiredPoints = account.getCurrentPoints();
                        account.setCurrentPoints(BigDecimal.ZERO);
                        accountRepository.save(account);

                        String txCode = "EXP_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
                        LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                                .tenantId(account.getTenantId())
                                .account(account)
                                .pointChange(expiredPoints.negate())
                                .balanceAfter(BigDecimal.ZERO)
                                .changeType(PointActionType.EXPIRE)
                                .referenceCode(txCode)
                                .description("Khấu trừ điểm hết hạn sử dụng sau chu kỳ 12 tháng")
                                .createdAt(Instant.now())
                                .build();
                        ledgerRepository.save(ledger);
                        expiredCount++;
                    }
                }
            }

            log.info("[BATCH-POINT-EXPIRATION-COMPLETED] Đã hoàn thành quét điểm hết hạn cho {} tài khoản", expiredCount);
            return expiredCount;
        });
    }
}
