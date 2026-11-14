package com.natcash.loyalty.wallet.service;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileRequest;
import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.campaign.service.MilestoneService;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.CampaignMetric;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.CurrencyAssetType;
import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.PaymentTxStatus;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.TierLevel;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.ledger.service.PointBucketFifoService;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.stream.LoyaltyStreamEvent;
import com.natcash.loyalty.stream.LoyaltyStreamProducer;
import com.natcash.loyalty.util.MessageUtils;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.AvailableVoucherDto;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.QrTokenGenerateRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.QrTokenGenerateResponse;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.QrTokenVerifyRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.QrTokenVerifyResponse;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletInquiryRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletInquiryResponse;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletRedeemRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletRedeemResponse;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletRefundRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletRefundResponse;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyAcceptancePolicyEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherRedemptionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyAcceptancePolicyRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRedemptionRepository;

import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RewardWalletService {

    private static final Logger log = LoggerFactory.getLogger(RewardWalletService.class);

    private final AccountService accountService;
    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final LoyaltyVoucherRedemptionRepository redemptionRepository;
    private final ClearingTransactionRepository clearingRepository;
    private final LoyaltyAcceptancePolicyRepository policyRepository;
    private final LoyaltyPartnerRepository partnerRepository;
    private final DistributedLockHelper lockHelper;
    private final LoyaltyStreamProducer streamProducer;
    private final MilestoneService milestoneService;
    private final RedissonClient redissonClient;

    @Autowired(required = false)
    private PointBucketFifoService pointBucketFifoService;

    public RewardWalletService(AccountService accountService,
            LoyaltyAccountRepository accountRepository,
            LoyaltyPointLedgerRepository ledgerRepository,
            LoyaltyVoucherRedemptionRepository redemptionRepository,
            ClearingTransactionRepository clearingRepository,
            LoyaltyAcceptancePolicyRepository policyRepository,
            LoyaltyPartnerRepository partnerRepository,
            DistributedLockHelper lockHelper,
            LoyaltyStreamProducer streamProducer,
            MilestoneService milestoneService,
            RedissonClient redissonClient) {
        this.accountService = accountService;
        this.accountRepository = accountRepository;
        this.ledgerRepository = ledgerRepository;
        this.redemptionRepository = redemptionRepository;
        this.clearingRepository = clearingRepository;
        this.policyRepository = policyRepository;
        this.partnerRepository = partnerRepository;
        this.lockHelper = lockHelper;
        this.streamProducer = streamProducer;
        this.milestoneService = milestoneService;
        this.redissonClient = redissonClient;
    }

    public QrTokenGenerateResponse generateQrToken(String tenantId, QrTokenGenerateRequest request) {
        String userId = request.getExternalUserId();
        String qrToken = "QR" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
        int ttlSeconds = SystemParameterService.get().getInt(tenantId, SystemParamSpec.REWARD_WALLET_DYNAMIC_QR_TTL_SECONDS);
        Instant expiresAt = Instant.now().plusSeconds(ttlSeconds);

        if (redissonClient != null) {
            String cacheKey = RedisKeys.QR_PAYMENT_TOKEN_PREFIX + tenantId + ":" + qrToken;
            RBucket<String> bucket = redissonClient.getBucket(cacheKey);
            bucket.set(userId, Duration.ofSeconds(ttlSeconds));
        }

        log.info("[QR-GENERATE] tenantId={}, user={}, token={}, expiresAt={}", tenantId, userId, qrToken, expiresAt);
        return QrTokenGenerateResponse.builder()
                .qrToken(qrToken)
                .expiresInSeconds(ttlSeconds)
                .expiresAt(expiresAt)
                .build();
    }

    public QrTokenVerifyResponse verifyQrToken(String tenantId, QrTokenVerifyRequest request) {
        String qrToken = request.getQrToken();
        String userId = null;

        if (redissonClient != null) {
            String cacheKey = RedisKeys.QR_PAYMENT_TOKEN_PREFIX + tenantId + ":" + qrToken;
            RBucket<String> bucket = redissonClient.getBucket(cacheKey);
            userId = bucket.get();
        }

        if (userId == null || userId.trim().isEmpty()) {
            throw new LoyaltyException(ErrorCode.UNAUTHORIZED, MessageUtils.getMessage("wallet.error.qr_expired"));
        }

        RewardWalletInquiryResponse inquiry = inquiry(tenantId, RewardWalletInquiryRequest.builder()
                .externalUserId(userId)
                .partnerId(request.getPartnerId())
                .build());

        return QrTokenVerifyResponse.builder()
                .externalUserId(userId)
                .tier(inquiry.getTier())
                .tierName(inquiry.getTierName())
                .currentPoints(inquiry.getCurrentPoints())
                .maxDeductiblePercentage(inquiry.getMaxDeductiblePercentage())
                .availableVouchers(inquiry.getAvailableVouchers())
                .totalVouchers(inquiry.getTotalVouchers())
                .valid(true)
                .build();
    }

    @Transactional(readOnly = true)
    public RewardWalletInquiryResponse inquiry(String tenantId, RewardWalletInquiryRequest request) {
        String userId = request.getExternalUserId();
        ProfileResponse profile = accountService.getOrCreateProfile(tenantId,
                ProfileRequest.builder().externalUserId(userId).build());

        Instant now = Instant.now();
        List<LoyaltyVoucherRedemptionEntity> redemptions = redemptionRepository
                .findByTenantIdAndAccount_ExternalUserIdAndStatusAndExpiresAtAfter(
                        tenantId, userId, VoucherStatus.ACTIVE, now);

        List<AvailableVoucherDto> voucherDtos = redemptions.stream()
                .map(r -> {
                    LoyaltyVoucherEntity v = r.getVoucher();
                    return AvailableVoucherDto.builder()
                            .redemptionId(r.getId())
                            .redemptionCode(r.getRedemptionCode())
                            .voucherCode(v != null ? v.getVoucherCode() : "")
                            .title(v != null ? v.getTitle() : "")
                            .description(v != null ? v.getDescription() : "")
                            .discountType(v != null ? v.getDiscountType() : DiscountType.FIXED_AMOUNT)
                            .discountValue(v != null ? v.getDiscountValue() : BigDecimal.ZERO)
                            .minBillAmount(v != null ? v.getMinBillAmount() : BigDecimal.ZERO)
                            .maxDiscountAmount(v != null ? v.getMaxDiscountAmount() : null)
                            .expiresAt(r.getExpiresAt())
                            .build();
                })
                .collect(Collectors.toList());

        // Lấy chính sách khấu trừ tối đa theo đối tác nếu có
        BigDecimal maxDeductiblePct = SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.MAX_DAILY_BURN_PERCENTAGE);
        if (request.getPartnerId() != null) {
            Optional<LoyaltyAcceptancePolicyEntity> policyOpt = policyRepository
                    .findByTenantIdAndPartnerId(tenantId, request.getPartnerId());
            if (policyOpt.isPresent() && policyOpt.get().getMaxBurnPercentage() != null) {
                maxDeductiblePct = policyOpt.get().getMaxBurnPercentage();
            }
        }

        String resolvedTierName = profile.getTier() != null
                ? (profile.getTier().getName() != null ? profile.getTier().getName()
                        : profile.getTier().getCode().name())
                : TierLevel.SILVER.name();

        return RewardWalletInquiryResponse.builder()
                .externalUserId(userId)
                .tier(profile.getTier() != null ? profile.getTier().getCode() : TierLevel.SILVER)
                .tierName(resolvedTierName)
                .currentPoints(profile.getCurrentPoints())
                .maxDeductiblePercentage(maxDeductiblePct)
                .availableVouchers(voucherDtos)
                .totalVouchers(voucherDtos.size())
                .build();
    }

    @Transactional
    public RewardWalletRedeemResponse redeem(String tenantId, RewardWalletRedeemRequest request) {
        String txCode = request.getTransactionCode();
        String userId = request.getExternalUserId();

        // 0. Xử lý Dynamic QR Token 60s (Single-use atomicity)
        if (request.getQrToken() != null && !request.getQrToken().trim().isEmpty()) {
            String qrToken = request.getQrToken().trim();
            String tokenUserId = null;
            if (redissonClient != null) {
                String cacheKey = RedisKeys.QR_PAYMENT_TOKEN_PREFIX + tenantId + ":" + qrToken;
                RBucket<String> bucket = redissonClient.getBucket(cacheKey);
                tokenUserId = bucket.getAndDelete();
            }
            if (tokenUserId == null || tokenUserId.trim().isEmpty()) {
                throw new LoyaltyException(ErrorCode.UNAUTHORIZED,
                        MessageUtils.getMessage("wallet.error.qr_expired"));
            }
            if (userId != null && !userId.trim().isEmpty() && !userId.equals(tokenUserId)) {
                throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, MessageUtils.getMessage("wallet.error.qr_user_mismatch"));
            }
            userId = tokenUserId;
        }

        if (userId == null || userId.trim().isEmpty()) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, MessageUtils.getMessage("wallet.error.user_or_qr_required"));
        }

        final String finalUserId = userId;

        // 1. Kiểm tra tính lũy kế (Idempotency)
        if (clearingRepository.existsByTenantIdAndTransactionCode(tenantId, txCode)) {
            log.warn("[REDEEM-DUPLICATE] tenantId={}, txCode={} - Giao dịch đã tồn tại", tenantId, txCode);
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE, MessageUtils.getMessage("wallet.error.duplicate_tx"));
        }

        // 2. Chiếm giữ Khóa phân tán Redisson RLock
        String lockKey = RedisKeys.getBurnLockKey(tenantId, finalUserId);
        SystemParameterService paramService = SystemParameterService.get();
        long waitTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_BURN_TIMEOUT_MS);
        long leaseTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_LEASE_TIME_MS);
        return lockHelper.executeWithLock(lockKey, waitTimeMs, leaseTimeMs, () -> {
                    // 3. Khóa tài khoản với Pessimistic Write Lock
                    LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, finalUserId);

                    BigDecimal billAmount = request.getTotalBillAmount();
                    BigDecimal pointsToBurn = request.getPointsToBurn() != null ? request.getPointsToBurn()
                            : BigDecimal.ZERO;
                    BigDecimal voucherDiscount = BigDecimal.ZERO;
                    String appliedVoucherCode = null;

                    // 4. Xử lý áp dụng Voucher nếu có
                    if (request.getVoucherRedemptionCode() != null
                            && !request.getVoucherRedemptionCode().trim().isEmpty()) {
                        String redemptionCode = request.getVoucherRedemptionCode().trim();
                        LoyaltyVoucherRedemptionEntity redemption = redemptionRepository
                                .findByTenantIdAndRedemptionCode(tenantId, redemptionCode)
                                .orElseThrow(() -> new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND,
                                        MessageUtils.getMessage("wallet.error.voucher_not_found")));

                        if (redemption.getStatus() != VoucherStatus.ACTIVE
                                || redemption.getExpiresAt().isBefore(Instant.now())) {
                            throw new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND,
                                    MessageUtils.getMessage("wallet.error.voucher_expired"));
                        }

                        LoyaltyVoucherEntity voucher = redemption.getVoucher();
                        if (voucher != null) {
                            if (billAmount.compareTo(voucher.getMinBillAmount()) < 0) {
                                throw new LoyaltyException(ErrorCode.POLICY_VIOLATION,
                                        MessageUtils.getMessage("wallet.error.bill_below_min_voucher"));
                            }

                            if (voucher.getDiscountType() == DiscountType.PERCENTAGE) {
                                voucherDiscount = billAmount.multiply(voucher.getDiscountValue())
                                        .divide(paramService.getDecimal(tenantId, SystemParamSpec.PERCENT_DIVISOR), 2, RoundingMode.HALF_UP);
                                if (voucher.getMaxDiscountAmount() != null
                                        && voucherDiscount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                                    voucherDiscount = voucher.getMaxDiscountAmount();
                                }
                            } else {
                                voucherDiscount = voucher.getDiscountValue();
                            }

                            if (voucherDiscount.compareTo(billAmount) > 0) {
                                voucherDiscount = billAmount;
                            }

                            appliedVoucherCode = redemptionCode;
                            redemption.setStatus(VoucherStatus.USED);
                            redemption.setUsedAt(Instant.now());
                            redemption.setUsedPartnerId(request.getRedeemerPartnerId());
                            redemptionRepository.save(redemption);
                        }
                    }

                    // 5. Tải chính sách đối tác để lấy tỷ lệ khấu trừ tối đa và tỷ giá quy đổi
                    BigDecimal maxBurnPercentage = paramService.getDecimal(tenantId, SystemParamSpec.MAX_DAILY_BURN_PERCENTAGE);
                    BigDecimal exchangeRate = paramService.getDecimal(tenantId, SystemParamSpec.LOYALTY_POINT_EXCHANGE_RATE_HTG);
                    if (request.getRedeemerPartnerId() != null) {
                        Optional<LoyaltyAcceptancePolicyEntity> policyOpt = policyRepository
                                .findByTenantIdAndPartnerId(tenantId, request.getRedeemerPartnerId());
                        if (policyOpt.isPresent()) {
                            LoyaltyAcceptancePolicyEntity policy = policyOpt.get();
                            if (policy.getMaxBurnPercentage() != null) {
                                maxBurnPercentage = policy.getMaxBurnPercentage();
                            }
                            if (policy.getPointExchangeRate() != null) {
                                exchangeRate = policy.getPointExchangeRate();
                            }
                        }
                    }

                    // Xử lý khấu trừ điểm (Theo tỷ lệ cấu hình của đối tác trên hóa đơn sau khi trừ
                    // voucher)
                    BigDecimal remainingBillAfterVoucher = billAmount.subtract(voucherDiscount);
                    BigDecimal maxAllowedPointDeduction = remainingBillAfterVoucher
                            .multiply(maxBurnPercentage)
                            .divide(paramService.getDecimal(tenantId, SystemParamSpec.PERCENT_DIVISOR), 2, RoundingMode.HALF_UP);

                    BigDecimal effectivePointsToBurn = pointsToBurn;
                    if (effectivePointsToBurn.compareTo(maxAllowedPointDeduction) > 0) {
                        effectivePointsToBurn = maxAllowedPointDeduction;
                    }

                    BigDecimal currentPoints = account.getCurrentPoints() != null ? account.getCurrentPoints()
                            : BigDecimal.ZERO;
                    if (effectivePointsToBurn.compareTo(currentPoints) > 0) {
                        throw new LoyaltyException(ErrorCode.INSUFFICIENT_POINTS,
                                MessageUtils.getMessage("wallet.error.insufficient_points"));
                    }

                    // Quy đổi điểm ra tiền mặt theo tỷ giá chính sách (fiatDiscount = points *
                    // exchangeRate)
                    BigDecimal pointDiscount = effectivePointsToBurn.multiply(exchangeRate).setScale(2,
                            RoundingMode.HALF_UP);
                    BigDecimal finalAmountToPay = remainingBillAfterVoucher.subtract(pointDiscount);
                    if (finalAmountToPay.compareTo(BigDecimal.ZERO) < 0) {
                        finalAmountToPay = BigDecimal.ZERO;
                    }

                    // 6. Cập nhật số dư điểm và ghi sổ cái bất biến
                    BigDecimal remainingPoints = currentPoints.subtract(effectivePointsToBurn);
                    account.setCurrentPoints(remainingPoints);
                    accountRepository.save(account);

                    if (effectivePointsToBurn.compareTo(BigDecimal.ZERO) > 0) {
                        if (pointBucketFifoService != null && account.getId() != null) {
                            pointBucketFifoService.consumeFifo(
                                    tenantId, account.getId(), effectivePointsToBurn, CurrencyAssetType.LOYALTY_COIN);
                        }
                        LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                                .tenantId(tenantId)
                                .account(account)
                                .pointChange(effectivePointsToBurn.negate())
                                .balanceAfter(remainingPoints)
                                .changeType(PointActionType.BURN)
                                .referenceCode(txCode)
                                .partnerId(request.getRedeemerPartnerId())
                                .description(request.getDescription() != null ? request.getDescription()
                                        : MessageUtils.getMessage("wallet.pos.burn_description"))
                                .createdAt(Instant.now())
                                .build();
                        ledgerRepository.save(ledger);
                    }

                    // 7. Ghi nhận giao dịch bù trừ liên minh (Clearing Transaction)
                    Long resolvedIssuerId = resolveIssuerPartnerId(tenantId);
                    ClearingTransactionEntity clearing = ClearingTransactionEntity.builder()
                            .tenantId(tenantId)
                            .transactionCode(txCode)
                            .issuerPartnerId(resolvedIssuerId)
                            .redeemerPartnerId(request.getRedeemerPartnerId())
                            .externalUserId(finalUserId)
                            .pointsRedeemed(effectivePointsToBurn)
                            .fiatAmount(pointDiscount)
                            .exchangeRate(exchangeRate)
                            .status(ClearingStatus.PENDING)
                            .createdAt(Instant.now())
                            .build();
                    clearingRepository.save(clearing);

                    // 8. Bắn sự kiện lên Redis Streams
                    LoyaltyStreamEvent streamEvent = LoyaltyStreamEvent.builder()
                            .tenantId(tenantId)
                            .eventType("POINTS_REDEEMED")
                            .externalUserId(finalUserId)
                            .amount(pointDiscount.longValue())
                            .transactionCode(txCode)
                            .timestamp(Instant.now())
                            .build();
                    streamProducer.publishEvent(streamEvent);

                    // 9. Tích lũy dồn tiến độ cho các Chiến dịch Cột mốc (Milestone Tracking
                    // Engine)
                    if (milestoneService != null) {
                        milestoneService.recordProgress(tenantId, finalUserId, request.getRedeemerPartnerId(),
                                CampaignMetric.BILL_AMOUNT, billAmount);
                        milestoneService.recordProgress(tenantId, finalUserId, request.getRedeemerPartnerId(),
                                CampaignMetric.TRANSACTION_COUNT, BigDecimal.ONE);
                    }

                    log.info(
                            "[REDEEM-SUCCESS] tenantId={}, user={}, txCode={}, bill={}, pointDiscount={}, voucherDiscount={}, toPay={}",
                            tenantId, finalUserId, txCode, billAmount, pointDiscount, voucherDiscount,
                            finalAmountToPay);

                    return RewardWalletRedeemResponse.builder()
                            .transactionCode(txCode)
                            .totalBillAmount(billAmount)
                            .pointDiscountAmount(pointDiscount)
                            .voucherDiscountAmount(voucherDiscount)
                            .finalAmountToPay(finalAmountToPay)
                            .pointsBurned(effectivePointsToBurn)
                            .remainingPoints(remainingPoints)
                            .appliedVoucherCode(appliedVoucherCode)
                            .status(PaymentTxStatus.SUCCESS.name())
                            .redeemedAt(Instant.now())
                            .build();
                });
    }

    private Long resolveIssuerPartnerId(String tenantId) {
        List<LoyaltyPartnerEntity> partners = partnerRepository.findByTenantId(tenantId);
        if (partners != null && !partners.isEmpty()) {
            return partners.stream()
                    .filter(p -> p != null && p.getPartnerCode() != null
                            && p.getPartnerCode().toUpperCase().contains("WALLET"))
                    .map(p -> p != null ? p.getId() : null)
                    .filter(id -> id != null)
                    .findFirst()
                    .orElse(partners.get(0).getId());
        }
        return null;
    }

    @Transactional
    public RewardWalletRefundResponse refund(String tenantId, RewardWalletRefundRequest request) {
        String originalTx = request.getOriginalTransactionCode();
        String refundTx = request.getRefundTransactionCode();

        ClearingTransactionEntity clearing = clearingRepository
                .findByTenantIdAndTransactionCode(tenantId, originalTx)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND, MessageUtils.getMessage("wallet.error.original_tx_not_found")));

        if (clearing.getStatus() == ClearingStatus.CANCELLED) {
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE, MessageUtils.getMessage("wallet.error.tx_already_refunded"));
        }

        String userId = clearing.getExternalUserId();
        LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, userId);

        BigDecimal pointsRefunded = clearing.getPointsRedeemed();
        BigDecimal newBalance = account.getCurrentPoints().add(pointsRefunded);
        account.setCurrentPoints(newBalance);
        accountRepository.save(account);

        // Ghi sổ cái điểm hoàn trả
        LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                .tenantId(tenantId)
                .account(account)
                .pointChange(pointsRefunded)
                .balanceAfter(newBalance)
                .changeType(PointActionType.REFUND)
                .referenceCode(refundTx)
                .partnerId(clearing.getRedeemerPartnerId())
                .description(MessageUtils.getMessage("wallet.pos.refund_description", originalTx))
                .createdAt(Instant.now())
                .build();
        ledgerRepository.save(ledger);

        clearing.setStatus(ClearingStatus.CANCELLED);
        clearingRepository.save(clearing);

        log.info("[REFUND-SUCCESS] tenantId={}, user={}, origTx={}, refundTx={}, pointsRefunded={}",
                tenantId, userId, originalTx, refundTx, pointsRefunded);

        return RewardWalletRefundResponse.builder()
                .refundTransactionCode(refundTx)
                .originalTransactionCode(originalTx)
                .pointsRefunded(pointsRefunded)
                .newBalance(newBalance)
                .status(PaymentTxStatus.REFUNDED.name())
                .refundedAt(Instant.now())
                .build();
    }
}
