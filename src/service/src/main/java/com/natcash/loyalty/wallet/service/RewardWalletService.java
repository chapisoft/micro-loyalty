package com.natcash.loyalty.wallet.service;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileRequest;
import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.TierLevel;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.stream.LoyaltyStreamEvent;
import com.natcash.loyalty.stream.LoyaltyStreamProducer;
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

import com.natcash.loyalty.campaign.service.MilestoneService;
import com.natcash.loyalty.domain.enums.CampaignMetric;

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
        int ttlSeconds = 60;
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
            throw new LoyaltyException(ErrorCode.UNAUTHORIZED, "Mã QR thanh toán không hợp lệ hoặc đã hết hạn (60s)");
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
        BigDecimal maxDeductiblePct = new BigDecimal("50.00");
        if (request.getPartnerId() != null) {
            Optional<LoyaltyAcceptancePolicyEntity> policyOpt = policyRepository
                    .findByTenantIdAndPartnerId(tenantId, request.getPartnerId());
            if (policyOpt.isPresent() && policyOpt.get().getMaxBurnPercentage() != null) {
                maxDeductiblePct = policyOpt.get().getMaxBurnPercentage();
            }
        }

        String resolvedTierName = profile.getTier() != null
                ? (profile.getTier().getName() != null ? profile.getTier().getName() : profile.getTier().getCode().name())
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
                throw new LoyaltyException(ErrorCode.UNAUTHORIZED, "Mã QR thanh toán không hợp lệ, đã sử dụng hoặc hết hạn (60s)");
            }
            if (userId != null && !userId.trim().isEmpty() && !userId.equals(tokenUserId)) {
                throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, "Mã người dùng không khớp với mã QR thanh toán");
            }
            userId = tokenUserId;
        }

        if (userId == null || userId.trim().isEmpty()) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, "Mã người dùng hoặc mã QR không được để trống");
        }

        final String finalUserId = userId;

        // 1. Kiểm tra tính lũy kế (Idempotency)
        if (clearingRepository.existsByTenantIdAndTransactionCode(tenantId, txCode)) {
            log.warn("[REDEEM-DUPLICATE] tenantId={}, txCode={} - Giao dịch đã tồn tại", tenantId, txCode);
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE, "Mã giao dịch khấu trừ đã tồn tại");
        }

        // 2. Chiếm giữ Khóa phân tán Redisson RLock
        String lockKey = RedisKeys.getBurnLockKey(tenantId, finalUserId);
        return lockHelper.executeWithLock(lockKey, LoyaltyConstants.DEFAULT_LOCK_WAIT_TIME_MS, LoyaltyConstants.DEFAULT_LOCK_LEASE_TIME_MS, () -> {
            // 3. Khóa tài khoản với Pessimistic Write Lock
            LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, finalUserId);

            BigDecimal billAmount = request.getTotalBillAmount();
            BigDecimal pointsToBurn = request.getPointsToBurn() != null ? request.getPointsToBurn() : BigDecimal.ZERO;
            BigDecimal voucherDiscount = BigDecimal.ZERO;
            String appliedVoucherCode = null;

            // 4. Xử lý áp dụng Voucher nếu có
            if (request.getVoucherRedemptionCode() != null && !request.getVoucherRedemptionCode().trim().isEmpty()) {
                String redemptionCode = request.getVoucherRedemptionCode().trim();
                LoyaltyVoucherRedemptionEntity redemption = redemptionRepository
                        .findByTenantIdAndRedemptionCode(tenantId, redemptionCode)
                        .orElseThrow(() -> new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND, "Không tìm thấy phiếu ưu đãi"));

                if (redemption.getStatus() != VoucherStatus.ACTIVE || redemption.getExpiresAt().isBefore(Instant.now())) {
                    throw new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND, "Phiếu ưu đãi đã được sử dụng hoặc hết hạn");
                }

                LoyaltyVoucherEntity voucher = redemption.getVoucher();
                if (voucher != null) {
                    if (billAmount.compareTo(voucher.getMinBillAmount()) < 0) {
                        throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Hóa đơn chưa đạt giá trị tối thiểu để dùng voucher");
                    }

                    if (voucher.getDiscountType() == DiscountType.PERCENTAGE) {
                        voucherDiscount = billAmount.multiply(voucher.getDiscountValue())
                                .divide(new BigDecimal("100.00"), 2, RoundingMode.HALF_UP);
                        if (voucher.getMaxDiscountAmount() != null && voucherDiscount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
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
            BigDecimal maxBurnPercentage = new BigDecimal("50.00");
            BigDecimal exchangeRate = BigDecimal.ONE;
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

            // Xử lý khấu trừ điểm (Theo tỷ lệ cấu hình của đối tác trên hóa đơn sau khi trừ voucher)
            BigDecimal remainingBillAfterVoucher = billAmount.subtract(voucherDiscount);
            BigDecimal maxAllowedPointDeduction = remainingBillAfterVoucher
                    .multiply(maxBurnPercentage)
                    .divide(new BigDecimal("100.00"), 2, RoundingMode.HALF_UP);

            BigDecimal effectivePointsToBurn = pointsToBurn;
            if (effectivePointsToBurn.compareTo(maxAllowedPointDeduction) > 0) {
                effectivePointsToBurn = maxAllowedPointDeduction;
            }

            BigDecimal currentPoints = account.getCurrentPoints() != null ? account.getCurrentPoints() : BigDecimal.ZERO;
            if (effectivePointsToBurn.compareTo(currentPoints) > 0) {
                throw new LoyaltyException(ErrorCode.INSUFFICIENT_POINTS, "Số dư điểm không đủ để thực hiện khấu trừ");
            }

            // Quy đổi điểm ra tiền mặt theo tỷ giá chính sách (fiatDiscount = points * exchangeRate)
            BigDecimal pointDiscount = effectivePointsToBurn.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal finalAmountToPay = remainingBillAfterVoucher.subtract(pointDiscount);
            if (finalAmountToPay.compareTo(BigDecimal.ZERO) < 0) {
                finalAmountToPay = BigDecimal.ZERO;
            }

            // 6. Cập nhật số dư điểm và ghi sổ cái bất biến
            BigDecimal remainingPoints = currentPoints.subtract(effectivePointsToBurn);
            account.setCurrentPoints(remainingPoints);
            accountRepository.save(account);

            if (effectivePointsToBurn.compareTo(BigDecimal.ZERO) > 0) {
                LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                        .tenantId(tenantId)
                        .account(account)
                        .pointChange(effectivePointsToBurn.negate())
                        .balanceAfter(remainingPoints)
                        .changeType(PointActionType.BURN)
                        .referenceCode(txCode)
                        .partnerId(request.getRedeemerPartnerId())
                        .description(request.getDescription() != null ? request.getDescription() : "Khấu trừ điểm tại quầy thu ngân")
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

            // 9. Tích lũy dồn tiến độ cho các Chiến dịch Cột mốc (Milestone Tracking Engine)
            if (milestoneService != null) {
                milestoneService.recordProgress(tenantId, finalUserId, request.getRedeemerPartnerId(), CampaignMetric.BILL_AMOUNT, billAmount);
                milestoneService.recordProgress(tenantId, finalUserId, request.getRedeemerPartnerId(), CampaignMetric.TRANSACTION_COUNT, BigDecimal.ONE);
            }

            log.info("[REDEEM-SUCCESS] tenantId={}, user={}, txCode={}, bill={}, pointDiscount={}, voucherDiscount={}, toPay={}",
                    tenantId, finalUserId, txCode, billAmount, pointDiscount, voucherDiscount, finalAmountToPay);

            return RewardWalletRedeemResponse.builder()
                    .transactionCode(txCode)
                    .totalBillAmount(billAmount)
                    .pointDiscountAmount(pointDiscount)
                    .voucherDiscountAmount(voucherDiscount)
                    .finalAmountToPay(finalAmountToPay)
                    .pointsBurned(effectivePointsToBurn)
                    .remainingPoints(remainingPoints)
                    .appliedVoucherCode(appliedVoucherCode)
                    .status("SUCCESS")
                    .redeemedAt(Instant.now())
                    .build();
        });
    }

    private Long resolveIssuerPartnerId(String tenantId) {
        List<LoyaltyPartnerEntity> partners = partnerRepository.findByTenantId(tenantId);
        if (partners != null && !partners.isEmpty()) {
            return partners.stream()
                    .filter(p -> p.getPartnerCode() != null && p.getPartnerCode().toUpperCase().contains("WALLET"))
                    .map(LoyaltyPartnerEntity::getId)
                    .findFirst()
                    .orElse(partners.get(0).getId());
        }
        return 1L;
    }

    @Transactional
    public RewardWalletRefundResponse refund(String tenantId, RewardWalletRefundRequest request) {
        String originalTx = request.getOriginalTransactionCode();
        String refundTx = request.getRefundTransactionCode();

        ClearingTransactionEntity clearing = clearingRepository
                .findByTenantIdAndTransactionCode(tenantId, originalTx)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND, "Không tìm thấy giao dịch gốc để hoàn"));

        if (clearing.getStatus() == ClearingStatus.CANCELLED) {
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE, "Giao dịch đã được hoàn trả trước đó");
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
                .description("Hoàn điểm hủy hóa đơn giao dịch: " + originalTx)
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
                .status("REFUNDED")
                .refundedAt(Instant.now())
                .build();
    }
}
