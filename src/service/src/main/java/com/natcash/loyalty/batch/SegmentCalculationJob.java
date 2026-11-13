package com.natcash.loyalty.batch;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.CustomerSegmentCode;
import com.natcash.loyalty.engagement.entity.CustomerSegmentEntity;
import com.natcash.loyalty.engagement.entity.CustomerSegmentMemberEntity;
import com.natcash.loyalty.engagement.repository.CustomerSegmentMemberRepository;
import com.natcash.loyalty.engagement.repository.CustomerSegmentRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SegmentCalculationJob {

    private final CustomerSegmentRepository segmentRepository;
    private final CustomerSegmentMemberRepository memberRepository;
    private final LoyaltyAccountRepository accountRepository;
    private final DistributedLockHelper lockHelper;

    @Scheduled(cron = "0 0 2 * * ?")
    public void executeScheduledRecalculation() {
        lockHelper.executeWithLock(RedisKeys.LOCK_BATCH_SEGMENT_CALC, () -> {
            List<CustomerSegmentEntity> allSegments = segmentRepository.findAll();
            allSegments.stream()
                    .map(CustomerSegmentEntity::getTenantId)
                    .distinct()
                    .forEach(this::recalculateSegments);
            return allSegments.size();
        });
    }

    @Transactional
    public List<CustomerSegmentEntity> recalculateSegments(String tenantId) {
        List<CustomerSegmentEntity> segments = segmentRepository.findByTenantIdOrderByIdAsc(tenantId);
        List<LoyaltyAccountEntity> accounts = accountRepository.findByTenantId(tenantId);
        Instant now = Instant.now();
        Instant thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS);

        for (CustomerSegmentEntity segment : segments) {
            for (LoyaltyAccountEntity account : accounts) {
                boolean matches = matchesSegment(segment.getSegmentCode(), account, thirtyDaysAgo);
                if (matches && memberRepository.findByTenantIdAndSegmentCodeAndExternalUserId(
                        tenantId, segment.getSegmentCode(), account.getExternalUserId()).isEmpty()) {
                    BigDecimal score = account.getTierPoints() != null ? account.getTierPoints() : BigDecimal.ZERO;
                    memberRepository.save(CustomerSegmentMemberEntity.builder()
                            .tenantId(tenantId)
                            .segmentId(segment.getId())
                            .segmentCode(segment.getSegmentCode())
                            .externalUserId(account.getExternalUserId())
                            .score(score)
                            .build());
                }
            }
            long actualMembers = memberRepository.countByTenantIdAndSegmentCode(tenantId, segment.getSegmentCode());
            if (actualMembers > 0) {
                segment.setMemberCount((int) actualMembers);
            }
            segment.setLastCalculatedAt(now);
            segmentRepository.save(segment);
        }
        log.info("[SEGMENT-RECALC] tenantId={} recalculated {} segments", tenantId, segments.size());
        return segments;
    }

    private boolean matchesSegment(CustomerSegmentCode code, LoyaltyAccountEntity account, Instant thirtyDaysAgo) {
        BigDecimal tierPoints = account.getTierPoints() != null ? account.getTierPoints() : BigDecimal.ZERO;
        if (code == CustomerSegmentCode.HIGH_VALUE) {
            return tierPoints.compareTo(new BigDecimal("5000")) >= 0;
        }
        if (code == CustomerSegmentCode.NEW_CUSTOMER) {
            return account.getCreatedAt() != null && account.getCreatedAt().isAfter(thirtyDaysAgo);
        }
        if (code == CustomerSegmentCode.GENERAL) {
            return true;
        }
        return false;
    }
}
