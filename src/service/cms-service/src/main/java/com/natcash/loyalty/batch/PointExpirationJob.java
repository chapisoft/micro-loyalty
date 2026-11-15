package com.natcash.loyalty.batch;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.codegeneration.domain.CodeType;
import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.ledger.service.PointBucketFifoService;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.util.MessageUtils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Component
public class PointExpirationJob {

    private static final Logger log = LoggerFactory.getLogger(PointExpirationJob.class);
    private static final String LOCK_KEY = RedisKeys.LOCK_BATCH_POINT_EXPIRATION;

    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final DistributedLockHelper lockHelper;

    @Autowired(required = false)
    private PointBucketFifoService pointBucketFifoService;

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
            int batchChunkSize = SystemParameterService.get().getInt(null, SystemParamSpec.POINT_EXPIRATION_BATCH_CHUNK_SIZE);
            log.info("[BATCH-POINT-EXPIRATION-START] Bắt đầu tiến trình quét điểm hết hạn định kỳ (Chunk {} FIFO)", batchChunkSize);
            int totalProcessedAccounts = 0;
            int pageNumber = 0;
            Page<LoyaltyAccountEntity> page;

            do {
                page = accountRepository.findAll(PageRequest.of(pageNumber, batchChunkSize));
                for (LoyaltyAccountEntity account : page.getContent()) {
                    processAccountPointExpiration(account);
                    totalProcessedAccounts++;
                }
                pageNumber++;
            } while (page.hasNext());

            int expiredBuckets = pointBucketFifoService != null ? pointBucketFifoService.expireDueBuckets() : 0;
            log.info("[BATCH-POINT-EXPIRATION-COMPLETED] Hoàn thành quét điểm hết hạn cho {} tài khoản hội viên, {} lô FIFO hết hạn",
                    totalProcessedAccounts, expiredBuckets);
            return totalProcessedAccounts;
        });
    }

    @Transactional
    public void processAccountPointExpiration(LoyaltyAccountEntity account) {
        if (account.getCurrentPoints().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        lockHelper.executeWithBurnLock(account.getTenantId(), account.getExternalUserId(), () -> {
            // Re-fetch to ensure fresh state inside lock
            LoyaltyAccountEntity freshAccount = accountRepository.findById(account.getId()).orElse(null);
            if (freshAccount == null || freshAccount.getCurrentPoints().compareTo(BigDecimal.ZERO) <= 0) {
                return;
            }

            int chunkSize = SystemParameterService.get().getInt(
                    freshAccount.getTenantId(), SystemParamSpec.POINT_EXPIRATION_BATCH_CHUNK_SIZE);
            Pageable batchPageable = PageRequest.of(0, chunkSize);

            // Scan point credit batches where expired_at <= now()
            List<LoyaltyPointLedgerEntity> expiredEntries = ledgerRepository
                    .findByAccount_IdAndChangeTypeInAndExpiredAtBeforeAndExpiredAtIsNotNullOrderByIdAsc(
                            freshAccount.getId(),
                            List.of(PointActionType.EARN, PointActionType.CASHBACK),
                            Instant.now(),
                            batchPageable);

            BigDecimal totalExpiredForAccount = BigDecimal.ZERO;
            for (LoyaltyPointLedgerEntity entry : expiredEntries) {
                if (entry.getPointChange() != null && entry.getPointChange().compareTo(BigDecimal.ZERO) > 0) {
                    totalExpiredForAccount = totalExpiredForAccount.add(entry.getPointChange());
                    // Mark processed by clearing expired_at to avoid re-scanning
                    entry.setExpiredAt(null);
                    ledgerRepository.save(entry);
                }
            }

            if (totalExpiredForAccount.compareTo(BigDecimal.ZERO) > 0) {
                // Do not deduct more than available balance
                BigDecimal actualDeduct = totalExpiredForAccount.min(freshAccount.getCurrentPoints());
                BigDecimal newBalance = freshAccount.getCurrentPoints().subtract(actualDeduct);
                freshAccount.setCurrentPoints(newBalance);
                accountRepository.save(freshAccount);

                String txCode = CentralizedCodeGeneratorService.get().generateCode(CodeType.POINT_EXPIRY_TX);
                LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                        .tenantId(freshAccount.getTenantId())
                        .account(freshAccount)
                        .pointChange(actualDeduct.negate())
                        .balanceAfter(newBalance)
                        .changeType(PointActionType.EXPIRE)
                        .referenceCode(txCode)
                        .description(MessageUtils.getMessage("batch.expiration.fifo_desc", actualDeduct))
                        .createdAt(Instant.now())
                        .build();
                ledgerRepository.save(ledger);

                log.info("[ACCOUNT-POINTS-EXPIRED] user={}, deductedPoints={}, newBalance={}",
                        freshAccount.getExternalUserId(), actualDeduct, newBalance);
            }
        });
    }
}
