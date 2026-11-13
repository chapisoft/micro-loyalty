package com.natcash.loyalty.batch;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyTierEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyTierRepository;
import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.TierLevel;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.outbox.service.OutboxService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Component
public class TierEvaluationJob {

    private static final Logger log = LoggerFactory.getLogger(TierEvaluationJob.class);
    private static final String LOCK_KEY = RedisKeys.LOCK_BATCH_TIER_EVALUATION;

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

            Instant now = Instant.now();
            Instant warningCutoff = now.plus(LoyaltyConstants.TIER_EXPIRY_WARNING_DAYS, ChronoUnit.DAYS);

            for (LoyaltyAccountEntity account : accounts) {
                List<LoyaltyTierEntity> tenantTiers = allTiers.stream()
                        .filter(t -> t.getTenantId().equals(account.getTenantId()))
                        .sorted(Comparator.comparing(LoyaltyTierEntity::getTierLevel))
                        .toList();
                if (tenantTiers.isEmpty()) {
                    continue;
                }

                LoyaltyTierEntity currentTier = account.getTier();
                BigDecimal tierPoints = account.getTierPoints() != null ? account.getTierPoints() : BigDecimal.ZERO;

                LoyaltyTierEntity upgradeTier = tenantTiers.stream()
                        .filter(t -> tierPoints.compareTo(t.getMinPoints()) >= 0)
                        .max(Comparator.comparing(LoyaltyTierEntity::getMinPoints))
                        .orElse(null);

                if (upgradeTier != null && (currentTier == null
                        || upgradeTier.getTierLevel() > currentTier.getTierLevel())) {
                    TierLevel oldTier = currentTier != null ? currentTier.getCode() : null;
                    account.setTier(upgradeTier);
                    account.setTierUpdatedAt(now);
                    account.setCycleEndAt(now.plus(365, ChronoUnit.DAYS));
                    accountRepository.save(account);
                    emitTierChangeEvent(account, oldTier, upgradeTier.getCode());
                    evaluatedCount++;
                    continue;
                }

                if (currentTier != null && account.getCycleEndAt() != null) {
                    if (account.getCycleEndAt().isAfter(now) && !account.getCycleEndAt().isAfter(warningCutoff)) {
                        BigDecimal keepThreshold = currentTier.getKeepTierPoints() != null
                                ? currentTier.getKeepTierPoints()
                                : currentTier.getMinPoints();
                        if (tierPoints.compareTo(keepThreshold) < 0) {
                            outboxService.recordEvent(
                                    account.getTenantId(),
                                    "LOYALTY_TIER_EXPIRY_WARNING",
                                    "{\"userId\":\"" + account.getExternalUserId() + "\",\"tier\":\"" + currentTier.getCode() + "\",\"needed\":" + keepThreshold.subtract(tierPoints) + "}",
                                    "https://partner.webhook.internal/tier-warning"
                            );
                        }
                    } else if (!account.getCycleEndAt().isAfter(now)) {
                        boolean locked = account.getTierLockedUntil() != null && account.getTierLockedUntil().isAfter(now);
                        BigDecimal keepThreshold = currentTier.getKeepTierPoints() != null
                                ? currentTier.getKeepTierPoints()
                                : currentTier.getMinPoints();
                        if (!locked && tierPoints.compareTo(keepThreshold) < 0 && currentTier.getTierLevel() > 1) {
                            Optional<LoyaltyTierEntity> oneStepLower = tenantTiers.stream()
                                    .filter(t -> t.getTierLevel() < currentTier.getTierLevel())
                                    .max(Comparator.comparing(LoyaltyTierEntity::getTierLevel));
                            if (oneStepLower.isPresent()) {
                                TierLevel oldTier = currentTier.getCode();
                                LoyaltyTierEntity nextTier = oneStepLower.get();
                                account.setTier(nextTier);
                                account.setTierUpdatedAt(now);
                                account.setCycleEndAt(now.plus(365, ChronoUnit.DAYS));
                                accountRepository.save(account);
                                emitTierChangeEvent(account, oldTier, nextTier.getCode());
                                evaluatedCount++;
                            }
                        } else {
                            account.setCycleEndAt(now.plus(365, ChronoUnit.DAYS));
                            accountRepository.save(account);
                        }
                    }
                }
            }

            log.info("[BATCH-TIER-EVALUATION-COMPLETED] Đã hoàn tất đánh giá và cập nhật hạng cho {} hội viên", evaluatedCount);
            return evaluatedCount;
        });
    }

    private void emitTierChangeEvent(LoyaltyAccountEntity account, TierLevel oldTier, TierLevel newTier) {
        outboxService.recordEvent(
                account.getTenantId(),
                "LOYALTY_TIER_UPDATED",
                "{\"userId\":\"" + account.getExternalUserId() + "\",\"oldTier\":\"" + oldTier + "\",\"newTier\":\"" + newTier + "\"}",
                "https://partner.webhook.internal/tier-updated"
        );
        log.info("[TIER-EVALUATION-CHANGED] user={}, from={}, to={}",
                account.getExternalUserId(), oldTier, newTier);
    }
}
