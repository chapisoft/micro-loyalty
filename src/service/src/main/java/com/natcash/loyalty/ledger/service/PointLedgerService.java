package com.natcash.loyalty.ledger.service;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileRequest;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyTierEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.RedisKeys;
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
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.stream.LoyaltyStreamEvent;
import com.natcash.loyalty.stream.LoyaltyStreamProducer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PointLedgerService {

    private static final Logger log = LoggerFactory.getLogger(PointLedgerService.class);

    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final LoyaltyAccountRepository accountRepository;
    private final AccountService accountService;
    private final DistributedLockHelper lockHelper;
    private final LoyaltyStreamProducer streamProducer;

    public PointLedgerService(LoyaltyPointLedgerRepository ledgerRepository,
                              LoyaltyAccountRepository accountRepository,
                              AccountService accountService,
                              DistributedLockHelper lockHelper,
                              LoyaltyStreamProducer streamProducer) {
        this.ledgerRepository = ledgerRepository;
        this.accountRepository = accountRepository;
        this.accountService = accountService;
        this.lockHelper = lockHelper;
        this.streamProducer = streamProducer;
    }

    @Transactional
    public EarnPointResponse earnPoints(String tenantId, EarnPointRequest request) {
        String txCode = request.getTransactionCode();
        String userId = request.getExternalUserId();

        // 1. Kiểm tra tính lũy kế (Idempotency)
        if (ledgerRepository.existsByTenantIdAndReferenceCode(tenantId, txCode)) {
            log.warn("[EARN-DUPLICATE] tenantId={}, txCode={} - Giao dịch đã tồn tại", tenantId, txCode);
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE, "Mã giao dịch đã được xử lý tích điểm");
        }

        // 2. Chiếm giữ khóa phân tán Redisson RLock
        String lockKey = RedisKeys.getBurnLockKey(tenantId, userId);
        return lockHelper.executeWithLock(lockKey, 3000, 10000, () -> {
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

            BigDecimal currentPoints = (account.getCurrentPoints() != null ? account.getCurrentPoints() : BigDecimal.ZERO)
                    .add(pointsEarned);
            BigDecimal tierPoints = (account.getTierPoints() != null ? account.getTierPoints() : BigDecimal.ZERO)
                    .add(pointsEarned);

            account.setCurrentPoints(currentPoints);
            account.setTierPoints(tierPoints);
            accountRepository.save(account);

            // 5. Ghi nhận giao dịch vào Sổ cái điểm bất biến
            LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                    .tenantId(tenantId)
                    .account(account)
                    .pointChange(pointsEarned)
                    .balanceAfter(currentPoints)
                    .changeType(PointActionType.EARN)
                    .referenceCode(txCode)
                    .description(request.getDescription() != null ? request.getDescription() : "Tích điểm mua hàng")
                    .createdAt(Instant.now())
                    .build();
            ledgerRepository.save(ledger);

            // 6. Kiểm tra tự động thăng hạng
            boolean tierUpgraded = accountService.checkAndUpgradeTier(account);

            // 7. Bắn sự kiện lên Redis Streams
            LoyaltyStreamEvent streamEvent = LoyaltyStreamEvent.builder()
                    .tenantId(tenantId)
                    .eventType("LOYALTY_EARN_EVENT")
                    .externalUserId(userId)
                    .amount(request.getBillAmount().longValue())
                    .transactionCode(txCode)
                    .timestamp(Instant.now())
                    .build();
            streamProducer.publishEvent(streamEvent);

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
        int page = Math.max(request.getPage(), 0);
        int size = request.getSize() > 0 ? Math.min(request.getSize(), 100) : 10;
        Pageable pageable = PageRequest.of(page, size);

        Page<LoyaltyPointLedgerEntity> pageResult = ledgerRepository
                .findByTenantIdAndAccount_ExternalUserIdOrderByCreatedAtDesc(
                        tenantId, request.getExternalUserId(), pageable);

        List<PointTransactionItem> items = pageResult.getContent().stream()
                .map(entity -> PointTransactionItem.builder()
                        .id(entity.getId())
                        .pointChange(entity.getPointChange())
                        .balanceAfter(entity.getBalanceAfter())
                        .changeType(entity.getChangeType())
                        .referenceCode(entity.getReferenceCode())
                        .description(entity.getDescription())
                        .createdAt(entity.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return PointHistoryResponse.builder()
                .items(items)
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .currentPage(page)
                .pageSize(size)
                .build();
    }
}
