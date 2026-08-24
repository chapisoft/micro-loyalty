package com.natcash.loyalty.batch;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyTierEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyTierRepository;
import com.natcash.loyalty.domain.enums.TierLevel;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.outbox.service.OutboxService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
public class TierEvaluationJob {

    private static final Logger log = LoggerFactory.getLogger(TierEvaluationJob.class);
    private static final String LOCK_KEY = "lock:batch:tier-evaluation";

    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyTierRepository tierRepository;
    private final OutboxService outboxService;
    private final DistributedLockHelper lockHelper;

    public TierEvaluationJob(LoyaltyAccountRepository accountRepository,
                             LoyaltyTierRepository tierRepository,
                             OutboxService outboxService,
                             DistributedLockHelper lockHelper) {
        this.accountRepository = accountRepository;
        this.tierRepository = tierRepository;
        this.outboxService = outboxService;
        this.lockHelper = lockHelper;
    }

    /**
     * Chạy định kỳ lúc 01:00 hàng ngày để đánh giá lại hạng hội viên theo chu kỳ 12 tháng
     */
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void executeTierEvaluation() {
        lockHelper.executeWithLock(LOCK_KEY, () -> {
            log.info("[BATCH-TIER-EVALUATION-START] Bắt đầu đánh giá lại hạng hội viên");
            List<LoyaltyTierEntity> allTiers = tierRepository.findAll();
            List<LoyaltyAccountEntity> accounts = accountRepository.findAll();
            int evaluatedCount = 0;

            for (LoyaltyAccountEntity account : accounts) {
                // Lọc hạng phù hợp nhất theo ngưỡng điểm xét hạng tierPoints
                LoyaltyTierEntity appropriateTier = allTiers.stream()
                        .filter(t -> t.getTenantId().equals(account.getTenantId()))
                        .filter(t -> account.getTierPoints().compareTo(t.getMinPoints()) >= 0)
                        .max((t1, t2) -> t1.getMinPoints().compareTo(t2.getMinPoints()))
                        .orElse(null);

                if (appropriateTier != null && (account.getTier() == null || !appropriateTier.getId().equals(account.getTier().getId()))) {
                    TierLevel oldTier = account.getTier() != null ? account.getTier().getCode() : null;
                    account.setTier(appropriateTier);
                    account.setTierUpdatedAt(Instant.now());
                    accountRepository.save(account);

                    // Bắn sự kiện thay đổi hạng vào Transactional Outbox
                    outboxService.recordEvent(
                            account.getTenantId(),
                            "LOYALTY_TIER_UPDATED",
                            "{\"userId\":\"" + account.getExternalUserId() + "\",\"oldTier\":\"" + oldTier + "\",\"newTier\":\"" + appropriateTier.getCode() + "\"}",
                            "https://partner.webhook.internal/tier-updated"
                    );

                    log.info("[TIER-EVALUATION-CHANGED] user={}, from={}, to={}",
                            account.getExternalUserId(), oldTier, appropriateTier.getCode());
                    evaluatedCount++;
                }
            }

            log.info("[BATCH-TIER-EVALUATION-COMPLETED] Đã hoàn tất đánh giá và cập nhật hạng cho {} hội viên", evaluatedCount);
            return evaluatedCount;
        });
    }
}
