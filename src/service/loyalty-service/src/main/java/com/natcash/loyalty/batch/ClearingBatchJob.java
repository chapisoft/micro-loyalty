package com.natcash.loyalty.batch;

import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
public class ClearingBatchJob {

    private static final Logger log = LoggerFactory.getLogger(ClearingBatchJob.class);
    private static final String LOCK_KEY = "lock:batch:clearing-reconciliation";

    private final ClearingTransactionRepository clearingRepository;
    private final DistributedLockHelper lockHelper;

    public ClearingBatchJob(ClearingTransactionRepository clearingRepository,
                            DistributedLockHelper lockHelper) {
        this.clearingRepository = clearingRepository;
        this.lockHelper = lockHelper;
    }

    /**
     * Chạy định kỳ lúc 02:00 hàng ngày để rà soát và đối soát bù trừ tự động
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional(readOnly = true)
    public void executeDailyClearingAudit() {
        lockHelper.executeWithLock(LOCK_KEY, () -> {
            log.info("[BATCH-CLEARING-AUDIT-START] Bắt đầu rà soát đối soát giao dịch bù trừ ngày");
            Instant yesterday = Instant.now().minusSeconds(86400);

            List<ClearingTransactionEntity> pendingList = clearingRepository.findAll().stream()
                    .filter(tx -> tx.getStatus() == ClearingStatus.PENDING)
                    .filter(tx -> tx.getCreatedAt().isBefore(yesterday))
                    .toList();

            if (!pendingList.isEmpty()) {
                log.warn("[BATCH-CLEARING-PENDING-ALERT] Phát hiện {} giao dịch bù trừ PENDING quá 24h chưa được quyết toán",
                        pendingList.size());
            } else {
                log.info("[BATCH-CLEARING-AUDIT-CLEAN] Toàn bộ giao dịch bù trừ trong trạng thái ổn định");
            }

            return pendingList.size();
        });
    }
}
