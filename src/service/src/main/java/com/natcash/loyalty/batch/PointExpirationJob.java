package com.natcash.loyalty.batch;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
    private static final int BATCH_CHUNK_SIZE = 500;

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
     * Chạy định kỳ lúc 00:30 hàng ngày để quét điểm hết hạn theo nguyên tắc FIFO từng khối 500 bản ghi
     */
    @Scheduled(cron = "0 30 0 * * ?")
    public void executePointExpiration() {
        lockHelper.executeWithLock(LOCK_KEY, () -> {
            log.info("[BATCH-POINT-EXPIRATION-START] Bắt đầu tiến trình quét điểm hết hạn định kỳ (Chunk 500 FIFO)");
            int totalProcessedAccounts = 0;
            int pageNumber = 0;
            Page<LoyaltyAccountEntity> page;

            do {
                page = accountRepository.findAll(PageRequest.of(pageNumber, BATCH_CHUNK_SIZE));
                for (LoyaltyAccountEntity account : page.getContent()) {
                    processAccountPointExpiration(account);
                    totalProcessedAccounts++;
                }
                pageNumber++;
            } while (page.hasNext());

            log.info("[BATCH-POINT-EXPIRATION-COMPLETED] Hoàn thành quét điểm hết hạn cho {} tài khoản hội viên", totalProcessedAccounts);
            return totalProcessedAccounts;
        });
    }

    @Transactional
    public void processAccountPointExpiration(LoyaltyAccountEntity account) {
        if (account.getCurrentPoints().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        String userLock = RedisKeys.getBurnLockKey(account.getTenantId(), account.getExternalUserId());
        lockHelper.executeWithLock(userLock, 2000, 4000, () -> {
            // Re-fetch to ensure fresh state inside lock
            LoyaltyAccountEntity freshAccount = accountRepository.findById(account.getId()).orElse(null);
            if (freshAccount == null || freshAccount.getCurrentPoints().compareTo(BigDecimal.ZERO) <= 0) {
                return null;
            }

            // Quét các đợt cộng điểm của tài khoản có expired_at <= now()
            List<LoyaltyPointLedgerEntity> expiredEntries = ledgerRepository
                    .findTop500ByChangeTypeInAndExpiredAtBeforeAndExpiredAtIsNotNullOrderByIdAsc(
                            List.of(PointActionType.EARN, PointActionType.CASHBACK), Instant.now());

            BigDecimal totalExpiredForAccount = BigDecimal.ZERO;
            for (LoyaltyPointLedgerEntity entry : expiredEntries) {
                if (entry.getAccount().getId().equals(freshAccount.getId()) && entry.getPointChange().compareTo(BigDecimal.ZERO) > 0) {
                    totalExpiredForAccount = totalExpiredForAccount.add(entry.getPointChange());
                    // Đánh dấu đã xử lý hết hạn bằng cách xóa mốc expired_at để không quét lại
                    entry.setExpiredAt(null);
                    ledgerRepository.save(entry);
                }
            }

            if (totalExpiredForAccount.compareTo(BigDecimal.ZERO) > 0) {
                // Không trừ quá số dư hiện có
                BigDecimal actualDeduct = totalExpiredForAccount.min(freshAccount.getCurrentPoints());
                BigDecimal newBalance = freshAccount.getCurrentPoints().subtract(actualDeduct);
                freshAccount.setCurrentPoints(newBalance);
                accountRepository.save(freshAccount);

                String txCode = "EXP_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
                LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                        .tenantId(freshAccount.getTenantId())
                        .account(freshAccount)
                        .pointChange(actualDeduct.negate())
                        .balanceAfter(newBalance)
                        .changeType(PointActionType.EXPIRE)
                        .referenceCode(txCode)
                        .description("Khấu trừ điểm hết hạn chu kỳ (FIFO): -" + actualDeduct + " điểm")
                        .createdAt(Instant.now())
                        .build();
                ledgerRepository.save(ledger);

                log.info("[ACCOUNT-POINTS-EXPIRED] user={}, deductedPoints={}, newBalance={}",
                        freshAccount.getExternalUserId(), actualDeduct, newBalance);
            }
            return null;
        });
    }
}
