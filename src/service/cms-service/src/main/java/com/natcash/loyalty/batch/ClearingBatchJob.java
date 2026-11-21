package com.natcash.loyalty.batch;

import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.HoldStatus;
import com.natcash.loyalty.domain.enums.ReconciliationStatus;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyPaymentHoldEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyPaymentHoldRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
public class ClearingBatchJob {

    private static final Logger log = LoggerFactory.getLogger(ClearingBatchJob.class);
    private static final String LOCK_KEY = RedisKeys.LOCK_BATCH_CLEARING;

    private final ClearingTransactionRepository clearingRepository;
    private final DistributedLockHelper lockHelper;

    @Autowired(required = false)
    private LoyaltyPaymentHoldRepository holdRepository;

    public ClearingBatchJob(ClearingTransactionRepository clearingRepository,
                            DistributedLockHelper lockHelper) {
        this.clearingRepository = clearingRepository;
        this.lockHelper = lockHelper;
    }

    /**
     * Chạy định kỳ lúc 02:00 hàng ngày để dọn phiên Hold quá hạn và rà soát giao dịch chưa khớp 3 bên (UNMATCHED / PENDING quá 24h).
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void executeDailyClearingAudit() {
        lockHelper.executeWithLock(LOCK_KEY, () -> {
            log.info("[BATCH-CLEARING-AUDIT-START] Bắt đầu rà soát hold quá hạn và đối soát giao dịch bù trừ ngày");
            Instant now = Instant.now();
            Instant yesterday = now.minusSeconds(86400);

            int expiredHolds = expireOverduePaymentHolds(now);

            List<ClearingTransactionEntity> overduePending = clearingRepository.findByStatusAndCreatedAtBefore(
                    ClearingStatus.PENDING, yesterday);
            List<ClearingTransactionEntity> overdueUnmatched = clearingRepository.findByReconciliationStatusAndCreatedAtBefore(
                    ReconciliationStatus.UNMATCHED, yesterday);

            if (!overduePending.isEmpty() || !overdueUnmatched.isEmpty()) {
                log.warn("[BATCH-CLEARING-ALERT] expiredHolds={}, pendingOver24h={}, unmatchedOver24h={}",
                        expiredHolds, overduePending.size(), overdueUnmatched.size());
            } else {
                log.info("[BATCH-CLEARING-AUDIT-CLEAN] expiredHolds={}, toàn bộ giao dịch đối soát trong trạng thái ổn định",
                        expiredHolds);
            }
            return overduePending.size() + overdueUnmatched.size();
        });
    }

    private int expireOverduePaymentHolds(Instant now) {
        if (holdRepository == null) {
            return 0;
        }
        List<LoyaltyPaymentHoldEntity> staleHolds = holdRepository.findAll().stream()
                .filter(h -> h.getStatus() == HoldStatus.HELD && h.getExpiresAt() != null && h.getExpiresAt().isBefore(now))
                .toList();
        if (staleHolds.isEmpty()) {
            return 0;
        }
        staleHolds.forEach(h -> h.setStatus(HoldStatus.EXPIRED));
        holdRepository.saveAll(staleHolds);
        return staleHolds.size();
    }
}
