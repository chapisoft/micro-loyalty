package com.natcash.loyalty.account.service;

import com.natcash.loyalty.account.dto.ProfileDto.NextTierProgress;
import com.natcash.loyalty.account.dto.ProfileDto.ProfileRequest;
import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;
import com.natcash.loyalty.account.dto.ProfileDto.TierInfo;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyTierEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyTierRepository;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.TierLevel;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.stream.LoyaltyStreamEvent;
import com.natcash.loyalty.stream.LoyaltyStreamProducer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountService.class);

    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyTierRepository tierRepository;
    private final LoyaltyStreamProducer streamProducer;

    public AccountService(LoyaltyAccountRepository accountRepository,
                          LoyaltyTierRepository tierRepository,
                          LoyaltyStreamProducer streamProducer) {
        this.accountRepository = accountRepository;
        this.tierRepository = tierRepository;
        this.streamProducer = streamProducer;
    }

    @Transactional
    public ProfileResponse getOrCreateProfile(String tenantId, ProfileRequest request) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            throw new LoyaltyException(ErrorCode.TENANT_INVALID, "Mã đối tác định danh không được để trống");
        }

        LoyaltyAccountEntity account = accountRepository
                .findByTenantIdAndExternalUserId(tenantId, request.getExternalUserId())
                .orElseGet(() -> createDefaultAccount(tenantId, request));

        // Cập nhật thông tin bổ sung nếu có thay đổi
        boolean updated = false;
        if (request.getFullName() != null && !request.getFullName().equals(account.getFullName())) {
            account.setFullName(request.getFullName());
            updated = true;
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().equals(account.getPhoneNumber())) {
            account.setPhoneNumber(request.getPhoneNumber());
            updated = true;
        }
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().equals(account.getDateOfBirth())) {
            account.setDateOfBirth(request.getDateOfBirth());
            updated = true;
        }

        if (updated) {
            account = accountRepository.save(account);
        }

        return mapToProfileResponse(account);
    }

    @Transactional
    public LoyaltyAccountEntity getAccountForUpdate(String tenantId, String externalUserId) {
        return accountRepository.findByTenantIdAndExternalUserIdForUpdate(tenantId, externalUserId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND, "Không tìm thấy tài khoản hội viên"));
    }

    @Transactional
    public boolean checkAndUpgradeTier(LoyaltyAccountEntity account) {
        String tenantId = account.getTenantId();
        BigDecimal tierPoints = account.getTierPoints() != null ? account.getTierPoints() : BigDecimal.ZERO;

        List<LoyaltyTierEntity> tiers = tierRepository.findByTenantIdOrderByTierLevelAsc(tenantId);
        if (tiers.isEmpty()) {
            return false;
        }

        LoyaltyTierEntity eligibleTier = tiers.get(0);
        for (LoyaltyTierEntity tier : tiers) {
            if (tierPoints.compareTo(tier.getMinPoints()) >= 0) {
                eligibleTier = tier;
            }
        }

        LoyaltyTierEntity currentTier = account.getTier();
        if (currentTier == null || eligibleTier.getTierLevel() > currentTier.getTierLevel()) {
            log.info("[TIER-UPGRADE] user={}, from={}, to={}",
                    account.getExternalUserId(),
                    currentTier != null ? currentTier.getCode() : "NONE",
                    eligibleTier.getCode());

            account.setTier(eligibleTier);
            account.setTierUpdatedAt(Instant.now());
            accountRepository.save(account);

            // Bắn sự kiện lên Redis Streams
            LoyaltyStreamEvent event = LoyaltyStreamEvent.builder()
                    .tenantId(tenantId)
                    .eventType("TIER_UPGRADED")
                    .externalUserId(account.getExternalUserId())
                    .amount(tierPoints.longValue())
                    .timestamp(Instant.now())
                    .build();
            streamProducer.publishEvent(event);
            return true;
        }
        return false;
    }

    private LoyaltyAccountEntity createDefaultAccount(String tenantId, ProfileRequest request) {
        LoyaltyTierEntity defaultTier = tierRepository.findByTenantIdAndCode(tenantId, TierLevel.SILVER)
                .orElseGet(() -> createDefaultSilverTier(tenantId));

        LoyaltyAccountEntity newAccount = LoyaltyAccountEntity.builder()
                .tenantId(tenantId)
                .externalUserId(request.getExternalUserId())
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .dateOfBirth(request.getDateOfBirth())
                .tier(defaultTier)
                .currentPoints(BigDecimal.ZERO)
                .tierPoints(BigDecimal.ZERO)
                .tierUpdatedAt(Instant.now())
                .status("ACTIVE")
                .build();

        log.info("[ACCOUNT-CREATED] tenantId={}, user={}, tier={}",
                tenantId, request.getExternalUserId(), defaultTier.getCode());

        return accountRepository.save(newAccount);
    }

    private LoyaltyTierEntity createDefaultSilverTier(String tenantId) {
        LoyaltyTierEntity silver = LoyaltyTierEntity.builder()
                .tenantId(tenantId)
                .code(TierLevel.SILVER)
                .name("Hạng Bạc")
                .tierLevel(1)
                .minPoints(BigDecimal.ZERO)
                .pointMultiplier(BigDecimal.ONE)
                .freeDailyTurns(1)
                .description("Hạng hội viên Bạc khởi đầu")
                .status("ACTIVE")
                .build();
        return tierRepository.save(silver);
    }

    public ProfileResponse mapToProfileResponse(LoyaltyAccountEntity account) {
        LoyaltyTierEntity tier = account.getTier();
        TierInfo tierInfo = null;
        if (tier != null) {
            tierInfo = TierInfo.builder()
                    .id(tier.getId())
                    .code(tier.getCode())
                    .name(tier.getName())
                    .tierLevel(tier.getTierLevel())
                    .minPoints(tier.getMinPoints())
                    .pointMultiplier(tier.getPointMultiplier())
                    .freeDailyTurns(tier.getFreeDailyTurns())
                    .description(tier.getDescription())
                    .build();
        }

        NextTierProgress nextTierProgress = calculateNextTierProgress(account);

        return ProfileResponse.builder()
                .accountId(account.getId())
                .tenantId(account.getTenantId())
                .externalUserId(account.getExternalUserId())
                .phoneNumber(account.getPhoneNumber())
                .fullName(account.getFullName())
                .dateOfBirth(account.getDateOfBirth())
                .currentPoints(account.getCurrentPoints())
                .tierPoints(account.getTierPoints())
                .tier(tierInfo)
                .nextTierProgress(nextTierProgress)
                .status(account.getStatus())
                .createdAt(account.getCreatedAt())
                .build();
    }

    private NextTierProgress calculateNextTierProgress(LoyaltyAccountEntity account) {
        LoyaltyTierEntity currentTier = account.getTier();
        int currentLevel = currentTier != null ? currentTier.getTierLevel() : 1;
        BigDecimal currentTierPoints = account.getTierPoints() != null ? account.getTierPoints() : BigDecimal.ZERO;

        Optional<LoyaltyTierEntity> nextTierOpt = tierRepository.findByTenantIdAndTierLevel(
                account.getTenantId(), currentLevel + 1);

        if (nextTierOpt.isEmpty()) {
            return NextTierProgress.builder()
                    .nextTierCode(null)
                    .nextTierName("Hạng cao nhất")
                    .pointsNeeded(BigDecimal.ZERO)
                    .currentTierPoints(currentTierPoints)
                    .targetTierPoints(currentTierPoints)
                    .progressPercentage(100.0)
                    .build();
        }

        LoyaltyTierEntity nextTier = nextTierOpt.get();
        BigDecimal targetPoints = nextTier.getMinPoints();
        BigDecimal currentMin = currentTier != null ? currentTier.getMinPoints() : BigDecimal.ZERO;

        BigDecimal pointsNeeded = targetPoints.subtract(currentTierPoints);
        if (pointsNeeded.compareTo(BigDecimal.ZERO) < 0) {
            pointsNeeded = BigDecimal.ZERO;
        }

        BigDecimal span = targetPoints.subtract(currentMin);
        double percentage = 100.0;
        if (span.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal progress = currentTierPoints.subtract(currentMin);
            if (progress.compareTo(BigDecimal.ZERO) < 0) {
                progress = BigDecimal.ZERO;
            }
            percentage = progress.divide(span, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
            if (percentage > 100.0) {
                percentage = 100.0;
            }
        }

        return NextTierProgress.builder()
                .nextTierCode(nextTier.getCode())
                .nextTierName(nextTier.getName())
                .pointsNeeded(pointsNeeded)
                .currentTierPoints(currentTierPoints)
                .targetTierPoints(targetPoints)
                .progressPercentage(Math.round(percentage * 10.0) / 10.0)
                .build();
    }
}
