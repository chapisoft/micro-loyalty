package com.natcash.loyalty.ledger.service;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileRequest;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.entity.LoyaltyTierEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
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

    public PointLedgerService(LoyaltyPointLedgerRepository ledgerRepository,
                              LoyaltyAccountRepository accountRepository,
                              LoyaltyPartnerRepository partnerRepository,
                              AccountService accountService,
                              DistributedLockHelper lockHelper,
                              LoyaltyStreamProducer streamProducer) {
        this.ledgerRepository = ledgerRepository;
        this.accountRepository = accountRepository;
        this.partnerRepository = partnerRepository;
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
        String effectiveTenant = (tenantId != null && !tenantId.isBlank()) ? tenantId : "TENANT_NATCASH";
        int page = Math.max(request.getPage(), 0);
        int size = request.getSize() > 0 ? Math.min(request.getSize(), 100) : 15;
        Pageable pageable = PageRequest.of(page, size);

        Long partnerId = request.getPartnerId();
        if (partnerId == null && partnerRepository != null && request.getPartnerCode() != null && !request.getPartnerCode().isBlank() && !"ALL".equalsIgnoreCase(request.getPartnerCode())) {
            partnerId = partnerRepository.findByTenantIdAndPartnerCode(effectiveTenant, request.getPartnerCode().trim())
                    .map(LoyaltyPartnerEntity::getId)
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
                        BigDecimal pointChange = entity.getPointChange() != null ? entity.getPointChange() : BigDecimal.ZERO;
                        BigDecimal balanceAfter = entity.getBalanceAfter() != null ? entity.getBalanceAfter() : BigDecimal.ZERO;
                        BigDecimal balanceBefore = balanceAfter.subtract(pointChange);

                        Long pId = entity.getPartnerId();
                        String pCode = "TENANT_MICRO_CRM".equalsIgnoreCase(effectiveTenant) ? "DELIMART_RETAIL" : "NATCASH_WALLET";
                        String pName = "TENANT_MICRO_CRM".equalsIgnoreCase(effectiveTenant) ? "Siêu thị Delimart" : "Ví Natcash";
                        String pType = "TENANT_MICRO_CRM".equalsIgnoreCase(effectiveTenant) ? "RETAIL" : "BANKING";

                        if (pId != null) {
                            Optional<LoyaltyPartnerEntity> partnerOpt = partnerRepository.findById(pId);
                            if (partnerOpt.isPresent()) {
                                LoyaltyPartnerEntity pe = partnerOpt.get();
                                pCode = pe.getPartnerCode();
                                pName = pe.getPartnerName();
                                pType = pe.getPartnerType() != null ? pe.getPartnerType().name() : "OTHER";
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
                                .externalUserId(entity.getAccount() != null ? entity.getAccount().getExternalUserId() : "")
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
        if (partnerRepository == null) {
            return null;
        }
        if (partnerCode != null && !partnerCode.isBlank()) {
            Optional<LoyaltyPartnerEntity> partnerOpt = partnerRepository.findByTenantIdAndPartnerCode(tenantId, partnerCode.trim());
            if (partnerOpt.isPresent()) {
                return partnerOpt.get().getId();
            }
        }
        String defaultCode = "TENANT_MICRO_CRM".equalsIgnoreCase(tenantId) ? "DELIMART_RETAIL" : "NATCASH_WALLET";
        return partnerRepository.findByTenantIdAndPartnerCode(tenantId, defaultCode)
                .map(LoyaltyPartnerEntity::getId)
                .orElse(null);
    }
}
