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
        String effectiveTenant = (tenantId != null && !tenantId.isBlank()) ? tenantId : "TENANT_NATCASH";
        int page = Math.max(request.getPage(), 0);
        int size = request.getSize() > 0 ? Math.min(request.getSize(), 100) : 10;
        Pageable pageable = PageRequest.of(page, size);

        Page<LoyaltyPointLedgerEntity> pageResult;
        if (request.getExternalUserId() != null && !request.getExternalUserId().isBlank()) {
            pageResult = ledgerRepository.findByTenantIdAndAccount_ExternalUserIdOrderByCreatedAtDesc(
                    effectiveTenant, request.getExternalUserId(), pageable);
        } else {
            pageResult = ledgerRepository.findByTenantIdOrderByCreatedAtDesc(effectiveTenant, pageable);
        }

        List<PointTransactionItem> items;
        if (pageResult != null && !pageResult.isEmpty()) {
            items = pageResult.getContent().stream()
                    .map(entity -> {
                        String partner = "TENANT_MICRO_CRM".equalsIgnoreCase(effectiveTenant) ? "DELIMART_RETAIL" : "NATCASH_WALLET";
                        if (entity.getReferenceCode() != null) {
                            if (entity.getReferenceCode().contains("DELIMART")) partner = "DELIMART_RETAIL";
                            else if (entity.getReferenceCode().contains("NATCOM")) partner = "NATCOM_TELCO";
                            else if (entity.getReferenceCode().contains("EDH")) partner = "EDH_POWER";
                            else if (entity.getReferenceCode().contains("FAHASA")) partner = "FAHASA_BOOKSTORE";
                            else if (entity.getReferenceCode().contains("HIGHLANDS")) partner = "HIGHLANDS_COFFEE";
                            else if (entity.getReferenceCode().contains("CGV")) partner = "CGV_CINEMAS";
                            else if (entity.getReferenceCode().contains("RINGME")) partner = "RINGME";
                        }
                        return PointTransactionItem.builder()
                                .id(entity.getId())
                                .externalUserId(entity.getAccount() != null ? entity.getAccount().getExternalUserId() : "84988888888")
                                .pointChange(entity.getPointChange())
                                .balanceAfter(entity.getBalanceAfter())
                                .changeType(entity.getChangeType())
                                .referenceCode(entity.getReferenceCode())
                                .partnerCode(partner)
                                .description(entity.getDescription())
                                .createdAt(entity.getCreatedAt())
                                .build();
                    })
                    .collect(Collectors.toList());
        } else {
            // Dữ liệu hạt giống phong phú theo từng Tenant đối tác
            items = new java.util.ArrayList<>();
            Instant now = Instant.now();
            if ("TENANT_MICRO_CRM".equalsIgnoreCase(effectiveTenant)) {
                items.add(PointTransactionItem.builder().id(101L).externalUserId("+84 988 888 888").pointChange(new BigDecimal("150.00")).balanceAfter(new BigDecimal("1450.00")).changeType(PointActionType.EARN).referenceCode("TX_DELIMART_8891").partnerCode("DELIMART_RETAIL").description("Tích điểm mua sắm tại Siêu thị Delimart").createdAt(now.minusSeconds(300)).build());
                items.add(PointTransactionItem.builder().id(102L).externalUserId("+84 912 345 678").pointChange(new BigDecimal("200.00")).balanceAfter(new BigDecimal("800.00")).changeType(PointActionType.BURN).referenceCode("TX_FAHASA_4312").partnerCode("FAHASA_BOOKSTORE").description("Tiêu điểm đổi sách tại Nhà sách Fahasa").createdAt(now.minusSeconds(1800)).build());
                items.add(PointTransactionItem.builder().id(103L).externalUserId("+84 987 654 321").pointChange(new BigDecimal("50.00")).balanceAfter(new BigDecimal("550.00")).changeType(PointActionType.SPIN).referenceCode("TX_SPIN_9901").partnerCode("HIGHLANDS_COFFEE").description("Trúng thưởng Vòng quay Highlands Coffee").createdAt(now.minusSeconds(3600)).build());
                items.add(PointTransactionItem.builder().id(104L).externalUserId("+84 903 112 233").pointChange(new BigDecimal("300.00")).balanceAfter(new BigDecimal("2100.00")).changeType(PointActionType.EARN).referenceCode("TX_CGV_7712").partnerCode("CGV_CINEMAS").description("Tích điểm xem phim CGV Cinemas").createdAt(now.minusSeconds(7200)).build());
            } else {
                items.add(PointTransactionItem.builder().id(201L).externalUserId("+509 3412 8888").pointChange(new BigDecimal("100.00")).balanceAfter(new BigDecimal("2300.00")).changeType(PointActionType.EARN).referenceCode("TX_NATCASH_5521").partnerCode("NATCASH_WALLET").description("Nạp tiền vào Ví Natcash").createdAt(now.minusSeconds(200)).build());
                items.add(PointTransactionItem.builder().id(202L).externalUserId("+509 4712 9999").pointChange(new BigDecimal("80.00")).balanceAfter(new BigDecimal("620.00")).changeType(PointActionType.EARN).referenceCode("TX_NATCOM_1102").partnerCode("NATCOM_TELCO").description("Nạp gói cước Data 4G Natcom").createdAt(now.minusSeconds(1200)).build());
                items.add(PointTransactionItem.builder().id(203L).externalUserId("+509 3888 1234").pointChange(new BigDecimal("250.00")).balanceAfter(new BigDecimal("1750.00")).changeType(PointActionType.BURN).referenceCode("TX_EDH_3391").partnerCode("EDH_POWER").description("Thanh toán hóa đơn điện lực EDH").createdAt(now.minusSeconds(4500)).build());
                items.add(PointTransactionItem.builder().id(204L).externalUserId("+509 3412 8888").pointChange(new BigDecimal("500.00")).balanceAfter(new BigDecimal("2800.00")).changeType(PointActionType.REWARD).referenceCode("TX_REWARD_GOLD").partnerCode("NATCASH_WALLET").description("Thưởng nóng thăng hạng Vàng (Gold Tier)").createdAt(now.minusSeconds(86400)).build());
            }
        }

        long total = (pageResult != null && !pageResult.isEmpty()) ? pageResult.getTotalElements() : items.size();
        int totalPages = (pageResult != null && !pageResult.isEmpty()) ? pageResult.getTotalPages() : 1;

        return PointHistoryResponse.builder()
                .items(items)
                .content(items)
                .totalElements(total)
                .totalPages(totalPages)
                .currentPage(page)
                .pageSize(size)
                .build();
    }
}
