package com.natcash.loyalty.ledger.service;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileRequest;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.entity.LoyaltyTierEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.campaign.service.MilestoneService;
import com.natcash.loyalty.config.LoyaltyProperties;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.CampaignMetric;
import com.natcash.loyalty.domain.enums.CurrencyAssetType;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.TierLevel;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.EarnPointRequest;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.EarnPointResponse;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.PointHistoryRequest;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.PointHistoryResponse;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.PointTransactionItem;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.util.MessageUtils;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.stream.LoyaltyStreamEvent;
import com.natcash.loyalty.stream.LoyaltyStreamProducer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PointLedgerService {

    private static final Logger log = LoggerFactory.getLogger(PointLedgerService.class);

    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyPartnerRepository partnerRepository;
    private final AccountService accountService;
    private final DistributedLockHelper lockHelper;
    private final LoyaltyStreamProducer streamProducer;
    private final MilestoneService milestoneService;

    @Autowired(required = false)
    private PointBucketFifoService pointBucketFifoService;

    public PointLedgerService(LoyaltyPointLedgerRepository ledgerRepository,
            LoyaltyAccountRepository accountRepository,
            LoyaltyPartnerRepository partnerRepository,
            AccountService accountService,
            DistributedLockHelper lockHelper,
            LoyaltyStreamProducer streamProducer,
            MilestoneService milestoneService) {
        this.ledgerRepository = ledgerRepository;
        this.accountRepository = accountRepository;
        this.partnerRepository = partnerRepository;
        this.accountService = accountService;
        this.lockHelper = lockHelper;
        this.streamProducer = streamProducer;
        this.milestoneService = milestoneService;
    }

    @Transactional
    public EarnPointResponse earnPoints(String tenantId, EarnPointRequest request) {
        String txCode = request.getTransactionCode();
        String userId = request.getExternalUserId();

        // 1. Kiểm tra tính lũy kế (Idempotency)
        if (ledgerRepository.existsByTenantIdAndReferenceCode(tenantId, txCode)) {
            log.warn("[EARN-DUPLICATE] tenantId={}, txCode={} - Giao dịch đã tồn tại", tenantId, txCode);
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE,
                    MessageUtils.getMessage("ledger.earn.duplicate_tx"));
        }

        // 2. Chiếm giữ khóa phân tán Redisson RLock
        String lockKey = RedisKeys.getBurnLockKey(tenantId, userId);
        SystemParameterService paramService = SystemParameterService.get();
        long waitTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_BURN_TIMEOUT_MS);
        long leaseTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_LEASE_TIME_MS);
        return lockHelper.executeWithLock(lockKey, waitTimeMs, leaseTimeMs, () -> {
            // 3. Khóa bản ghi tài khoản (Pessimistic Write Lock)
            accountService.getOrCreateProfile(tenantId, ProfileRequest.builder().externalUserId(userId).build());
            LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, userId);

            // 4. Tính toán số điểm tích lũy theo hệ số nhân hạng hội viên
            LoyaltyTierEntity tier = account.getTier();
            BigDecimal multiplier = tier != null && tier.getPointMultiplier() != null
                    ? tier.getPointMultiplier()
                    : BigDecimal.ONE;

            // 1 đơn vị tiền tệ tích 1 điểm cơ bản (tỷ lệ cấu hình mặc định)
            BigDecimal basePoints = request.getBillAmount().setScale(2, RoundingMode.HALF_UP);
            BigDecimal pointsEarned = basePoints.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);

            BigDecimal currentPoints = (account.getCurrentPoints() != null ? account.getCurrentPoints()
                    : BigDecimal.ZERO)
                    .add(pointsEarned);
            BigDecimal tierPoints = (account.getTierPoints() != null ? account.getTierPoints() : BigDecimal.ZERO)
                    .add(pointsEarned);

            account.setCurrentPoints(currentPoints);
            account.setTierPoints(tierPoints);
            accountRepository.save(account);

            Long resolvedPartnerId = resolvePartnerId(tenantId, request.getPartnerCode());

            // 5. Ghi nhận giao dịch vào Sổ cái điểm bất biến
            LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                    .tenantId(tenantId)
                    .account(account)
                    .pointChange(pointsEarned)
                    .balanceAfter(currentPoints)
                    .changeType(PointActionType.EARN)
                    .referenceCode(txCode)
                    .partnerId(resolvedPartnerId)
                    .description(request.getDescription() != null ? request.getDescription()
                            : MessageUtils.getMessage("ledger.earn.default_desc"))
                    .createdAt(Instant.now())
                    .build();
            ledgerRepository.save(ledger);

            if (pointBucketFifoService != null && account.getId() != null) {
                int expiryMonths = paramService.getInt(tenantId,
                        SystemParamSpec.WALLET_DEFAULT_POINT_EXPIRATION_MONTHS);
                Instant expiredAt = Instant.now().plus(expiryMonths * 30L, ChronoUnit.DAYS);
                pointBucketFifoService.createEarnBucket(
                        tenantId, account.getId(), pointsEarned, expiredAt, txCode, CurrencyAssetType.LOYALTY_COIN);
            }

            // 6. Kiểm tra tự động thăng hạng
            boolean tierUpgraded = accountService.checkAndUpgradeTier(account);

            // 7. Bắn sự kiện lên Redis Streams
            LoyaltyStreamEvent streamEvent = LoyaltyStreamEvent.builder()
                    .tenantId(tenantId)
                    .eventType(LoyaltyConstants.STREAM_EVENT_LOYALTY_EARN)
                    .externalUserId(userId)
                    .amount(request.getBillAmount().longValue())
                    .transactionCode(txCode)
                    .timestamp(Instant.now())
                    .build();
            streamProducer.publishEvent(streamEvent);

            // 8. Tích lũy dồn tiến độ cho các Chiến dịch Cột mốc (Milestone Tracking
            // Engine)
            if (milestoneService != null) {
                milestoneService.recordProgress(tenantId, userId, resolvedPartnerId, CampaignMetric.EARN_POINTS,
                        pointsEarned);
                milestoneService.recordProgress(tenantId, userId, resolvedPartnerId, CampaignMetric.BILL_AMOUNT,
                        request.getBillAmount());
                milestoneService.recordProgress(tenantId, userId, resolvedPartnerId, CampaignMetric.TRANSACTION_COUNT,
                        BigDecimal.ONE);
            }

            log.info("[EARN-SUCCESS] tenantId={}, user={}, txCode={}, bill={}, earned={}, balance={}",
                    tenantId, userId, txCode, request.getBillAmount(), pointsEarned, currentPoints);

            return EarnPointResponse.builder()
                    .transactionCode(txCode)
                    .basePoints(basePoints)
                    .multiplier(multiplier)
                    .pointsEarned(pointsEarned)
                    .currentPoints(currentPoints)
                    .tierPoints(tierPoints)
                    .tier(account.getTier() != null ? account.getTier().getCode() : TierLevel.SILVER)
                    .tierUpgraded(tierUpgraded)
                    .build();
        });
    }

    @Transactional(readOnly = true)
    public PointHistoryResponse getPointHistory(String tenantId, PointHistoryRequest request) {
        String effectiveTenant = (tenantId != null && !tenantId.isBlank()) ? tenantId
                : LoyaltyProperties.get().getTenant().getDefaultTenant();
        int page = Math.max(request.getPage(), 0);
        int size = request.getSize() > 0 ? Math.min(request.getSize(), 100) : 15;
        Pageable pageable = PageRequest.of(page, size);

        Long partnerId = request.getPartnerId();
        if (partnerId == null && partnerRepository != null && request.getPartnerCode() != null
                && !request.getPartnerCode().isBlank()
                && !LoyaltyConstants.FILTER_ALL.equalsIgnoreCase(request.getPartnerCode())) {
            partnerId = partnerRepository.findByTenantIdAndPartnerCode(effectiveTenant, request.getPartnerCode().trim())
                    .map(p -> p != null ? p.getId() : null)
                    .orElse(null);
        }

        Page<LoyaltyPointLedgerEntity> pageResult = ledgerRepository.findLedgerWithFilters(
                effectiveTenant,
                request.getExternalUserId(),
                request.getActionType(),
                partnerId,
                request.getKeyword(),
                pageable);

        List<PointTransactionItem> items;
        if (pageResult != null && !pageResult.isEmpty()) {
            items = pageResult.getContent().stream()
                    .map(entity -> {
                        BigDecimal pointChange = entity.getPointChange() != null ? entity.getPointChange()
                                : BigDecimal.ZERO;
                        BigDecimal balanceAfter = entity.getBalanceAfter() != null ? entity.getBalanceAfter()
                                : BigDecimal.ZERO;
                        BigDecimal balanceBefore = balanceAfter.subtract(pointChange);

                        Long pId = entity.getPartnerId();
                        String pCode = null;
                        String pName = null;
                        String pType = null;

                        if (pId != null) {
                            Optional<LoyaltyPartnerEntity> partnerOpt = partnerRepository.findById(pId);
                            if (partnerOpt.isPresent()) {
                                LoyaltyPartnerEntity pe = partnerOpt.get();
                                pCode = pe.getPartnerCode();
                                pName = pe.getPartnerName();
                                pType = pe.getPartnerType() != null ? pe.getPartnerType().name() : null;
                            }
                        }

                        String status = "COMPLETED";
                        if (entity.getChangeType() == PointActionType.REFUND) {
                            status = "REFUNDED";
                        } else if (entity.getChangeType() == PointActionType.EXPIRE) {
                            status = "EXPIRED";
                        }

                        return PointTransactionItem.builder()
                                .id(entity.getId())
                                .externalUserId(
                                        entity.getAccount() != null ? entity.getAccount().getExternalUserId() : "")
                                .pointChange(pointChange)
                                .balanceBefore(balanceBefore)
                                .balanceAfter(balanceAfter)
                                .changeType(entity.getChangeType())
                                .referenceCode(entity.getReferenceCode())
                                .partnerId(pId)
                                .partnerCode(pCode)
                                .partnerName(pName)
                                .partnerType(pType)
                                .description(entity.getDescription())
                                .status(status)
                                .createdAt(entity.getCreatedAt())
                                .build();
                    })
                    .collect(Collectors.toList());
        } else {
            items = Collections.emptyList();
        }

        long total = pageResult != null ? pageResult.getTotalElements() : 0;
        int totalPages = pageResult != null ? pageResult.getTotalPages() : 0;

        return PointHistoryResponse.builder()
                .items(items)
                .content(items)
                .totalElements(total)
                .totalPages(totalPages)
                .currentPage(page)
                .pageSize(size)
                .build();
    }

    public Long resolvePartnerId(String tenantId, String partnerCode) {
        if (partnerRepository == null || partnerCode == null || partnerCode.isBlank()) {
            return null;
        }
        return partnerRepository.findByTenantIdAndPartnerCode(tenantId, partnerCode.trim())
                .map(LoyaltyPartnerEntity::getId)
                .orElse(null);
    }
}
