package com.natcash.loyalty.wallet.service;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileRequest;
import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.codegeneration.domain.CodeType;
import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.HoldStatus;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.TierLevel;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.outbox.service.OutboxService;
import com.natcash.loyalty.stream.LoyaltyStreamEvent;
import com.natcash.loyalty.stream.LoyaltyStreamProducer;
import com.natcash.loyalty.util.MessageUtils;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerInquiryRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerInquiryResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentAuthorizeRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentAuthorizeResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentCancelRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentCancelResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentConfirmRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentConfirmResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentDirectRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentDirectResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentRefundRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentRefundResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentStatusRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentStatusResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerVoucherItemDto;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyAcceptancePolicyEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyPaymentHoldEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherRedemptionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyAcceptancePolicyRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyPaymentHoldRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRedemptionRepository;
import com.natcash.loyalty.wallet.service.VoucherDynamicCodeService.ConsumedVoucherResult;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartnerPaymentGatewayService {

    private final AccountService accountService;
    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyPartnerRepository partnerRepository;
    private final LoyaltyAcceptancePolicyRepository policyRepository;
    private final LoyaltyPaymentHoldRepository holdRepository;
    private final ClearingTransactionRepository clearingRepository;
    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final LoyaltyVoucherRedemptionRepository redemptionRepository;
    private final DistributedLockHelper lockHelper;
    private final LoyaltyStreamProducer streamProducer;
    private final OutboxService outboxService;

    @Autowired(required = false)
    private VoucherDynamicCodeService voucherDynamicCodeService;

    // =========================================================================
    // 1. TRA CỨU SỐ DƯ & CHÍNH SÁCH ĐỐI TÁC (INQUIRY)
    // =========================================================================
    @Transactional(readOnly = true)
    public PartnerInquiryResponse inquiry(String tenantId, String partnerCode, PartnerInquiryRequest request) {
        LoyaltyPartnerEntity partner = resolvePartner(tenantId, partnerCode);
        String customerId = resolveCustomerIdentifier(request.getCustomerIdentifier());

        ProfileResponse profile = accountService.getOrCreateProfile(tenantId,
                ProfileRequest.builder().externalUserId(customerId).build());

        LoyaltyAcceptancePolicyEntity policy = policyRepository
                .findByTenantIdAndPartnerId(tenantId, partner.getId())
                .orElse(null);

        BigDecimal exchangeRate = policy != null
                ? policy.getPointExchangeRate()
                : SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.LOYALTY_POINT_EXCHANGE_RATE_HTG);
        BigDecimal maxBurnPercentage = policy != null
                ? policy.getMaxBurnPercentage()
                : SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.MAX_DAILY_BURN_PERCENTAGE);

        BigDecimal currentPoints = profile.getCurrentPoints() != null ? profile.getCurrentPoints() : BigDecimal.ZERO;
        BigDecimal maxDeductiblePoints = currentPoints;
        BigDecimal maxDeductibleAmount = currentPoints.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);

        if (request.getBillAmount() != null && request.getBillAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal percentDivisor = SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.PERCENT_DIVISOR);
            BigDecimal maxAllowedAmount = request.getBillAmount()
                    .multiply(maxBurnPercentage)
                    .divide(percentDivisor, 2, RoundingMode.HALF_UP);
            BigDecimal maxAllowedPoints = maxAllowedAmount.divide(exchangeRate, 2, RoundingMode.HALF_UP);
            if (maxDeductiblePoints.compareTo(maxAllowedPoints) > 0) {
                maxDeductiblePoints = maxAllowedPoints;
                maxDeductibleAmount = maxAllowedAmount;
            }
        }

        Instant now = Instant.now();
        List<LoyaltyVoucherRedemptionEntity> redemptions = redemptionRepository
                .findByTenantIdAndAccount_ExternalUserIdAndStatusAndExpiresAtAfter(
                        tenantId, customerId, VoucherStatus.ACTIVE, now);

        List<PartnerVoucherItemDto> voucherDtos = redemptions.stream()
                .map(r -> {
                    LoyaltyVoucherEntity v = r.getVoucher();
                    return PartnerVoucherItemDto.builder()
                            .redemptionId(r.getId())
                            .redemptionCode(r.getRedemptionCode())
                            .voucherCode(v != null ? v.getVoucherCode() : "")
                            .title(v != null ? v.getTitle() : "")
                            .discountType(v != null ? v.getDiscountType() : DiscountType.FIXED_AMOUNT)
                            .discountValue(v != null ? v.getDiscountValue() : BigDecimal.ZERO)
                            .minBillAmount(v != null ? v.getMinBillAmount() : BigDecimal.ZERO)
                            .maxDiscountAmount(v != null ? v.getMaxDiscountAmount() : null)
                            .expiresAt(r.getExpiresAt())
                            .build();
                })
                .collect(Collectors.toList());

        return PartnerInquiryResponse.builder()
                .externalUserId(customerId)
                .customerName(profile.getFullName() != null ? profile.getFullName() : customerId)
                .tier(profile.getTier() != null ? profile.getTier().getCode() : TierLevel.SILVER)
                .tierName(profile.getTier() != null ? profile.getTier().getName()
                        : MessageUtils.getMessage("account.tier.default_silver_name"))
                .currentPoints(currentPoints)
                .pointExchangeRate(exchangeRate)
                .maxBurnPercentage(maxBurnPercentage)
                .maxDeductiblePoints(maxDeductiblePoints)
                .maxDeductibleAmount(maxDeductibleAmount)
                .availableVouchers(voucherDtos)
                .totalVouchers(voucherDtos.size())
                .build();
    }

    // =========================================================================
    // 2. TẠM GIỮ ĐIỂM (AUTHORIZE - LUỒNG 2 BƯỚC)
    // =========================================================================
    @Transactional
    public PartnerPaymentAuthorizeResponse authorize(String tenantId, String partnerCode,
            PartnerPaymentAuthorizeRequest request) {
        LoyaltyPartnerEntity partner = resolvePartner(tenantId, partnerCode);
        String customerId = resolveCustomerIdentifier(request.getCustomerIdentifier());
        BigDecimal billAmount = request.getBillAmount();

        LoyaltyAcceptancePolicyEntity policy = policyRepository
                .findByTenantIdAndPartnerId(tenantId, partner.getId())
                .orElse(null);

        SystemParameterService paramService = SystemParameterService.get();
        BigDecimal exchangeRate = policy != null
                ? policy.getPointExchangeRate()
                : paramService.getDecimal(tenantId, SystemParamSpec.LOYALTY_POINT_EXCHANGE_RATE_HTG);
        BigDecimal maxBurnPercentage = policy != null
                ? policy.getMaxBurnPercentage()
                : paramService.getDecimal(tenantId, SystemParamSpec.MAX_DAILY_BURN_PERCENTAGE);
        BigDecimal minBurnPoints = policy != null ? policy.getMinBurnPoints() : BigDecimal.ZERO;
        BigDecimal maxBurnPerTx = policy != null
                ? policy.getMaxBurnPointsPerTx()
                : paramService.getDecimal(tenantId, SystemParamSpec.MAX_BURN_POINTS_PER_TX);

        String lockKey = RedisKeys.getBurnLockKey(tenantId, customerId);
        long waitTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_BURN_TIMEOUT_MS);
        long leaseTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_LEASE_TIME_MS);

        return lockHelper.executeWithLock(lockKey, waitTimeMs, leaseTimeMs, () -> {
            LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, customerId);

            BigDecimal voucherDiscount = BigDecimal.ZERO;
            String appliedVoucherCode = null;

            // Xử lý Voucher nếu có (bắt buộc qua mã động khi không dùng mã định danh QR Ví)
            if (request.getVoucherRedemptionCode() != null && !request.getVoucherRedemptionCode().trim().isEmpty()) {
                String rawVoucherCode = request.getVoucherRedemptionCode().trim();
                if (voucherDynamicCodeService != null) {
                    ConsumedVoucherResult heldVoucher = voucherDynamicCodeService.verifyAndConsumeCodeForHold(
                            tenantId, rawVoucherCode, partner.getId(), partner.getPartnerCode(), null, billAmount, customerId);
                    voucherDiscount = heldVoucher.getDiscountAmount();
                    appliedVoucherCode = heldVoucher.getRedemption().getRedemptionCode();
                } else {
                    LoyaltyVoucherRedemptionEntity redemption = redemptionRepository
                            .findByTenantIdAndRedemptionCode(tenantId, rawVoucherCode)
                            .orElseThrow(() -> new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND,
                                    MessageUtils.getMessage("wallet.voucher.not_found")));

                    if (redemption.getStatus() != VoucherStatus.ACTIVE
                            || redemption.getExpiresAt().isBefore(Instant.now())) {
                        throw new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND,
                                MessageUtils.getMessage("wallet.voucher.expired_or_used"));
                    }

                    LoyaltyVoucherEntity voucher = redemption.getVoucher();
                    if (voucher != null) {
                        if (billAmount.compareTo(voucher.getMinBillAmount()) < 0) {
                            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION,
                                    MessageUtils.getMessage("wallet.voucher.min_bill_not_met"));
                        }
                        BigDecimal percentDivisor = paramService.getDecimal(tenantId, SystemParamSpec.PERCENT_DIVISOR);
                        if (voucher.getDiscountType() == DiscountType.PERCENTAGE) {
                            voucherDiscount = billAmount.multiply(voucher.getDiscountValue())
                                    .divide(percentDivisor, 2, RoundingMode.HALF_UP);
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
                        appliedVoucherCode = rawVoucherCode;
                    }
                }
            }

            BigDecimal percentDivisor = paramService.getDecimal(tenantId, SystemParamSpec.PERCENT_DIVISOR);
            BigDecimal remainingBillAfterVoucher = billAmount.subtract(voucherDiscount);
            BigDecimal maxAllowedPointDeduction = remainingBillAfterVoucher
                    .multiply(maxBurnPercentage)
                    .divide(percentDivisor, 2, RoundingMode.HALF_UP);

            BigDecimal requestedPoints = request.getPointsToBurn() != null ? request.getPointsToBurn()
                    : BigDecimal.ZERO;
            BigDecimal effectivePointsToHold = requestedPoints;

            if (effectivePointsToHold.compareTo(maxBurnPerTx) > 0) {
                effectivePointsToHold = maxBurnPerTx;
            }

            BigDecimal calculatedPointDiscount = effectivePointsToHold.multiply(exchangeRate).setScale(2,
                    RoundingMode.HALF_UP);
            if (calculatedPointDiscount.compareTo(maxAllowedPointDeduction) > 0) {
                calculatedPointDiscount = maxAllowedPointDeduction;
                effectivePointsToHold = maxAllowedPointDeduction.divide(exchangeRate, 2, RoundingMode.HALF_UP);
            }

            if (effectivePointsToHold.compareTo(BigDecimal.ZERO) > 0
                    && effectivePointsToHold.compareTo(minBurnPoints) < 0) {
                throw new LoyaltyException(ErrorCode.POLICY_VIOLATION,
                        MessageUtils.getMessage("wallet.burn.min_points", minBurnPoints));
            }

            BigDecimal currentBalance = account.getCurrentPoints() != null ? account.getCurrentPoints()
                    : BigDecimal.ZERO;
            if (effectivePointsToHold.compareTo(currentBalance) > 0) {
                throw new LoyaltyException(ErrorCode.INSUFFICIENT_POINTS,
                        MessageUtils.getMessage("wallet.burn.insufficient_points_pay"));
            }

            BigDecimal finalAmountToPay = remainingBillAfterVoucher.subtract(calculatedPointDiscount);
            if (finalAmountToPay.compareTo(BigDecimal.ZERO) < 0) {
                finalAmountToPay = BigDecimal.ZERO;
            }

            String holdCode = CentralizedCodeGeneratorService.get().generateCode(CodeType.PAYMENT_HOLD);
            long holdTtlMinutes = paramService.getLong(tenantId, SystemParamSpec.PAYMENT_HOLD_DEFAULT_TTL_MINUTES);
            Instant now = Instant.now();
            Instant expiresAt = now.plus(Duration.ofMinutes(holdTtlMinutes));

            LoyaltyPaymentHoldEntity holdEntity = LoyaltyPaymentHoldEntity.builder()
                    .tenantId(tenantId)
                    .holdCode(holdCode)
                    .partner(partner)
                    .externalUserId(customerId)
                    .partnerOrderId(request.getPartnerOrderId())
                    .billAmount(billAmount)
                    .pointsHeld(effectivePointsToHold)
                    .pointDiscountAmount(calculatedPointDiscount)
                    .voucherCode(appliedVoucherCode)
                    .voucherDiscountAmount(voucherDiscount)
                    .status(HoldStatus.HELD)
                    .expiresAt(expiresAt)
                    .createdAt(now)
                    .build();

            holdRepository.save(holdEntity);

            log.info(
                    "[HOLD-SUCCESS] tenantId={}, partner={}, user={}, holdCode={}, bill={}, pointsHeld={}, discount={}",
                    tenantId, partner.getPartnerCode(), customerId, holdCode, billAmount, effectivePointsToHold,
                    calculatedPointDiscount);

            return PartnerPaymentAuthorizeResponse.builder()
                    .holdCode(holdCode)
                    .partnerOrderId(request.getPartnerOrderId())
                    .externalUserId(customerId)
                    .billAmount(billAmount)
                    .pointsHeld(effectivePointsToHold)
                    .pointDiscountAmount(calculatedPointDiscount)
                    .voucherDiscountAmount(voucherDiscount)
                    .finalAmountToPay(finalAmountToPay)
                    .status(HoldStatus.HELD)
                    .expiresAt(expiresAt)
                    .createdAt(now)
                    .build();
        });
    }

    // =========================================================================
    // 3. XÁC NHẬN TRỪ ĐIỂM (CAPTURE / CONFIRM)
    // =========================================================================
    @Transactional
    public PartnerPaymentConfirmResponse confirm(String tenantId, String partnerCode,
            PartnerPaymentConfirmRequest request) {
        String txCode = request.getTransactionCode();
        String holdCode = request.getHoldCode();

        if (clearingRepository.existsByTenantIdAndTransactionCode(tenantId, txCode)) {
            log.warn("[CONFIRM-DUPLICATE] tenantId={}, txCode={} - Giao dịch đã tồn tại", tenantId, txCode);
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE,
                    MessageUtils.getMessage("wallet.tx.pos_duplicate"));
        }

        LoyaltyPaymentHoldEntity hold = holdRepository.findByTenantIdAndHoldCode(tenantId, holdCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.HOLD_NOT_FOUND,
                        MessageUtils.getMessage("wallet.hold.not_found")));

        if (hold.getStatus() != HoldStatus.HELD) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION,
                    MessageUtils.getMessage("wallet.hold.invalid_status", hold.getStatus()));
        }

        if (hold.getExpiresAt().isBefore(Instant.now())) {
            hold.setStatus(HoldStatus.EXPIRED);
            holdRepository.save(hold);
            throw new LoyaltyException(ErrorCode.HOLD_EXPIRED, MessageUtils.getMessage("wallet.hold.expired"));
        }

        String customerId = hold.getExternalUserId();
        String lockKey = RedisKeys.getBurnLockKey(tenantId, customerId);
        SystemParameterService paramService = SystemParameterService.get();
        long waitTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_BURN_TIMEOUT_MS);
        long leaseTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_LEASE_TIME_MS);

        return lockHelper.executeWithLock(lockKey, waitTimeMs, leaseTimeMs, () -> {
            LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, customerId);

            BigDecimal pointsToBurn = hold.getPointsHeld();
            BigDecimal pointDiscount = hold.getPointDiscountAmount();
            BigDecimal voucherDiscount = hold.getVoucherDiscountAmount();
            BigDecimal billAmount = hold.getBillAmount();
            BigDecimal currentPoints = account.getCurrentPoints() != null ? account.getCurrentPoints()
                    : BigDecimal.ZERO;

            if (pointsToBurn.compareTo(currentPoints) > 0) {
                throw new LoyaltyException(ErrorCode.INSUFFICIENT_POINTS,
                        MessageUtils.getMessage("wallet.burn.insufficient_points_confirm"));
            }

            // 1. Cập nhật số dư tài khoản
            BigDecimal remainingPoints = currentPoints.subtract(pointsToBurn);
            account.setCurrentPoints(remainingPoints);
            accountRepository.save(account);

            // 2. Ghi sổ cái điểm bất biến
            if (pointsToBurn.compareTo(BigDecimal.ZERO) > 0) {
                LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                        .tenantId(tenantId)
                        .account(account)
                        .pointChange(pointsToBurn.negate())
                        .balanceAfter(remainingPoints)
                        .changeType(PointActionType.BURN)
                        .referenceCode(txCode)
                        .partnerId(hold.getPartner().getId())
                        .description(MessageUtils.getMessage("wallet.pay.hold_ledger_desc",
                                hold.getPartner().getPartnerName()))
                        .createdAt(Instant.now())
                        .build();
                ledgerRepository.save(ledger);
            }

            // 3. Khóa sử dụng Voucher nếu có
            if (hold.getVoucherCode() != null && !hold.getVoucherCode().trim().isEmpty()) {
                redemptionRepository.findByTenantIdAndRedemptionCode(tenantId, hold.getVoucherCode())
                        .ifPresent(r -> {
                            r.setStatus(VoucherStatus.USED);
                            r.setUsedAt(Instant.now());
                            r.setUsedPartnerId(hold.getPartner().getId());
                            redemptionRepository.save(r);
                        });
            }

            // 4. Tính toán phí hoa hồng MDR & số tiền quyết toán ròng
            LoyaltyAcceptancePolicyEntity policy = policyRepository
                    .findByTenantIdAndPartnerId(tenantId, hold.getPartner().getId())
                    .orElse(null);

            BigDecimal commissionRate = policy != null ? policy.getCommissionRatePercent() : BigDecimal.ZERO;
            BigDecimal fixedFee = policy != null ? policy.getFixedFeePerTx() : BigDecimal.ZERO;
            BigDecimal percentDivisor = paramService.getDecimal(tenantId, SystemParamSpec.PERCENT_DIVISOR);

            BigDecimal commissionAmount = pointDiscount.multiply(commissionRate)
                    .divide(percentDivisor, 2, RoundingMode.HALF_UP)
                    .add(fixedFee);

            BigDecimal netPayoutAmount = pointDiscount.subtract(commissionAmount);
            if (netPayoutAmount.compareTo(BigDecimal.ZERO) < 0) {
                netPayoutAmount = BigDecimal.ZERO;
            }

            // 5. Ghi nhận giao dịch bù trừ tài chính (Clearing Transaction)
            ClearingTransactionEntity clearing = ClearingTransactionEntity.builder()
                    .tenantId(tenantId)
                    .transactionCode(txCode)
                    .partnerOrderId(hold.getPartnerOrderId())
                    .holdCode(holdCode)
                    .issuerPartnerId(1L)
                    .redeemerPartnerId(hold.getPartner().getId())
                    .externalUserId(customerId)
                    .pointsRedeemed(pointsToBurn)
                    .fiatAmount(pointDiscount)
                    .commissionAmount(commissionAmount)
                    .netPayoutAmount(netPayoutAmount)
                    .exchangeRate(policy != null
                            ? policy.getPointExchangeRate()
                            : paramService.getDecimal(tenantId, SystemParamSpec.LOYALTY_POINT_EXCHANGE_RATE_HTG))
                    .status(ClearingStatus.PENDING)
                    .createdAt(Instant.now())
                    .build();
            clearingRepository.save(clearing);

            // 6. Cập nhật trạng thái Hold
            hold.setStatus(HoldStatus.CAPTURED);
            hold.setCapturedAt(Instant.now());
            holdRepository.save(hold);

            // 7. Bắn sự kiện Redis Streams & Outbox Webhook
            LoyaltyStreamEvent streamEvent = LoyaltyStreamEvent.builder()
                    .tenantId(tenantId)
                    .eventType("POINTS_REDEEMED")
                    .externalUserId(customerId)
                    .amount(pointDiscount.longValue())
                    .transactionCode(txCode)
                    .timestamp(Instant.now())
                    .build();
            streamProducer.publishEvent(streamEvent);

            if (hold.getPartner().getWebhookUrl() != null && !hold.getPartner().getWebhookUrl().trim().isEmpty()) {
                outboxService.recordEvent(tenantId, "PAYMENT_COMPLETED", clearing, hold.getPartner().getWebhookUrl());
            }

            BigDecimal remainingBill = billAmount.subtract(voucherDiscount).subtract(pointDiscount);
            if (remainingBill.compareTo(BigDecimal.ZERO) < 0) {
                remainingBill = BigDecimal.ZERO;
            }

            log.info("[CONFIRM-SUCCESS] tenantId={}, partner={}, user={}, txCode={}, pointsBurned={}, netPayout={}",
                    tenantId, hold.getPartner().getPartnerCode(), customerId, txCode, pointsToBurn, netPayoutAmount);

            return PartnerPaymentConfirmResponse.builder()
                    .transactionCode(txCode)
                    .holdCode(holdCode)
                    .partnerOrderId(hold.getPartnerOrderId())
                    .externalUserId(customerId)
                    .billAmount(billAmount)
                    .pointsBurned(pointsToBurn)
                    .pointDiscountAmount(pointDiscount)
                    .voucherDiscountAmount(voucherDiscount)
                    .finalAmountToPay(remainingBill)
                    .remainingPoints(remainingPoints)
                    .appliedVoucherCode(hold.getVoucherCode())
                    .status(ClearingStatus.PENDING)
                    .capturedAt(Instant.now())
                    .build();
        });
    }

    // =========================================================================
    // 4. HỦY PHIÊN TẠM GIỮ (CANCEL / VOID)
    // =========================================================================
    @Transactional
    public PartnerPaymentCancelResponse cancel(String tenantId, String partnerCode,
            PartnerPaymentCancelRequest request) {
        String holdCode = request.getHoldCode();
        LoyaltyPaymentHoldEntity hold = holdRepository.findByTenantIdAndHoldCode(tenantId, holdCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.HOLD_NOT_FOUND,
                        MessageUtils.getMessage("wallet.hold.not_found")));

        if (hold.getStatus() != HoldStatus.HELD) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION,
                    MessageUtils.getMessage("wallet.hold.cancel_invalid_status", hold.getStatus()));
        }

        hold.setStatus(HoldStatus.CANCELLED);
        holdRepository.save(hold);

        log.info("[CANCEL-SUCCESS] tenantId={}, holdCode={}, pointsReleased={}", tenantId, holdCode,
                hold.getPointsHeld());

        return PartnerPaymentCancelResponse.builder()
                .holdCode(holdCode)
                .status(HoldStatus.CANCELLED)
                .pointsReleased(hold.getPointsHeld())
                .message(MessageUtils.getMessage("wallet.hold.cancel_success"))
                .cancelledAt(Instant.now())
                .build();
    }

    // =========================================================================
    // 5. THANH TOÁN 1 CHẠM TỨC THÌ QUA DYNAMIC QR (DIRECT PAYMENT)
    // =========================================================================
    @Transactional
    public PartnerPaymentDirectResponse directPayment(String tenantId, String partnerCode,
            PartnerPaymentDirectRequest request) {
        String txCode = request.getTransactionCode();
        if (clearingRepository.existsByTenantIdAndTransactionCode(tenantId, txCode)) {
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE, MessageUtils.getMessage("wallet.tx.duplicate"));
        }

        LoyaltyPartnerEntity partner = resolvePartner(tenantId, partnerCode);
        String customerId = resolveCustomerIdentifier(request.getQrToken());
        BigDecimal billAmount = request.getBillAmount();

        LoyaltyAcceptancePolicyEntity policy = policyRepository
                .findByTenantIdAndPartnerId(tenantId, partner.getId())
                .orElse(null);

        SystemParameterService paramService = SystemParameterService.get();
        BigDecimal exchangeRate = policy != null
                ? policy.getPointExchangeRate()
                : paramService.getDecimal(tenantId, SystemParamSpec.LOYALTY_POINT_EXCHANGE_RATE_HTG);
        BigDecimal maxBurnPercentage = policy != null
                ? policy.getMaxBurnPercentage()
                : paramService.getDecimal(tenantId, SystemParamSpec.MAX_DAILY_BURN_PERCENTAGE);
        BigDecimal minBurnPoints = policy != null ? policy.getMinBurnPoints() : BigDecimal.ZERO;
        BigDecimal maxBurnPerTx = policy != null
                ? policy.getMaxBurnPointsPerTx()
                : paramService.getDecimal(tenantId, SystemParamSpec.MAX_BURN_POINTS_PER_TX);

        String lockKey = RedisKeys.getBurnLockKey(tenantId, customerId);
        long waitTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_BURN_TIMEOUT_MS);
        long leaseTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_LEASE_TIME_MS);

        return lockHelper.executeWithLock(lockKey, waitTimeMs, leaseTimeMs, () -> {
            LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, customerId);
            BigDecimal percentDivisor = paramService.getDecimal(tenantId, SystemParamSpec.PERCENT_DIVISOR);

            BigDecimal voucherDiscount = BigDecimal.ZERO;
            String appliedVoucherCode = null;

            if (request.getVoucherRedemptionCode() != null && !request.getVoucherRedemptionCode().trim().isEmpty()) {
                String rawVoucherCode = request.getVoucherRedemptionCode().trim();
                if (voucherDynamicCodeService != null) {
                    ConsumedVoucherResult consumedVoucher = voucherDynamicCodeService.consumeDynamicCode(
                            tenantId, rawVoucherCode, partner.getId(), partner.getPartnerCode(), null, billAmount, customerId);
                    voucherDiscount = consumedVoucher.getDiscountAmount();
                    appliedVoucherCode = consumedVoucher.getDynamicCode();
                } else {
                    LoyaltyVoucherRedemptionEntity redemption = redemptionRepository
                            .findByTenantIdAndRedemptionCode(tenantId, rawVoucherCode)
                            .orElseThrow(() -> new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND,
                                    MessageUtils.getMessage("wallet.voucher.not_found")));

                    if (redemption.getStatus() == VoucherStatus.ACTIVE
                            && redemption.getExpiresAt().isAfter(Instant.now())) {
                        LoyaltyVoucherEntity voucher = redemption.getVoucher();
                        if (voucher != null && billAmount.compareTo(voucher.getMinBillAmount()) >= 0) {
                            if (voucher.getDiscountType() == DiscountType.PERCENTAGE) {
                                voucherDiscount = billAmount.multiply(voucher.getDiscountValue()).divide(percentDivisor, 2,
                                        RoundingMode.HALF_UP);
                                if (voucher.getMaxDiscountAmount() != null
                                        && voucherDiscount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                                    voucherDiscount = voucher.getMaxDiscountAmount();
                                }
                            } else {
                                voucherDiscount = voucher.getDiscountValue();
                            }
                            if (voucherDiscount.compareTo(billAmount) > 0)
                                voucherDiscount = billAmount;
                            appliedVoucherCode = rawVoucherCode;
                            redemption.setStatus(VoucherStatus.USED);
                            redemption.setUsedAt(Instant.now());
                            redemption.setUsedPartnerId(partner.getId());
                            redemptionRepository.save(redemption);
                        }
                    }
                }
            }

            BigDecimal remainingBillAfterVoucher = billAmount.subtract(voucherDiscount);
            BigDecimal maxAllowedPointDiscount = remainingBillAfterVoucher.multiply(maxBurnPercentage)
                    .divide(percentDivisor, 2, RoundingMode.HALF_UP);

            BigDecimal requestedPoints = request.getPointsToBurn() != null ? request.getPointsToBurn()
                    : BigDecimal.ZERO;
            BigDecimal effectivePointsToBurn = requestedPoints;

            if (effectivePointsToBurn.compareTo(maxBurnPerTx) > 0) {
                effectivePointsToBurn = maxBurnPerTx;
            }

            BigDecimal pointDiscount = effectivePointsToBurn.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);
            if (pointDiscount.compareTo(maxAllowedPointDiscount) > 0) {
                pointDiscount = maxAllowedPointDiscount;
                effectivePointsToBurn = maxAllowedPointDiscount.divide(exchangeRate, 2, RoundingMode.HALF_UP);
            }

            if (effectivePointsToBurn.compareTo(BigDecimal.ZERO) > 0
                    && effectivePointsToBurn.compareTo(minBurnPoints) < 0) {
                throw new LoyaltyException(ErrorCode.POLICY_VIOLATION,
                        MessageUtils.getMessage("wallet.burn.min_points", minBurnPoints));
            }

            BigDecimal currentPoints = account.getCurrentPoints() != null ? account.getCurrentPoints()
                    : BigDecimal.ZERO;
            if (effectivePointsToBurn.compareTo(currentPoints) > 0) {
                throw new LoyaltyException(ErrorCode.INSUFFICIENT_POINTS,
                        MessageUtils.getMessage("wallet.burn.insufficient_points"));
            }

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
                        .partnerId(partner.getId())
                        .description(request.getDescription() != null ? request.getDescription()
                                : MessageUtils.getMessage("wallet.pay.direct_default_desc"))
                        .createdAt(Instant.now())
                        .build();
                ledgerRepository.save(ledger);
            }

            BigDecimal commissionRate = policy != null ? policy.getCommissionRatePercent() : BigDecimal.ZERO;
            BigDecimal fixedFee = policy != null ? policy.getFixedFeePerTx() : BigDecimal.ZERO;
            BigDecimal commissionAmount = pointDiscount.multiply(commissionRate)
                    .divide(percentDivisor, 2, RoundingMode.HALF_UP).add(fixedFee);
            BigDecimal netPayoutAmount = pointDiscount.subtract(commissionAmount);
            if (netPayoutAmount.compareTo(BigDecimal.ZERO) < 0)
                netPayoutAmount = BigDecimal.ZERO;

            ClearingTransactionEntity clearing = ClearingTransactionEntity.builder()
                    .tenantId(tenantId)
                    .transactionCode(txCode)
                    .partnerOrderId(request.getPartnerOrderId())
                    .issuerPartnerId(1L)
                    .redeemerPartnerId(partner.getId())
                    .externalUserId(customerId)
                    .pointsRedeemed(effectivePointsToBurn)
                    .fiatAmount(pointDiscount)
                    .commissionAmount(commissionAmount)
                    .netPayoutAmount(netPayoutAmount)
                    .exchangeRate(exchangeRate)
                    .status(ClearingStatus.PENDING)
                    .createdAt(Instant.now())
                    .build();
            clearingRepository.save(clearing);

            LoyaltyStreamEvent streamEvent = LoyaltyStreamEvent.builder()
                    .tenantId(tenantId)
                    .eventType("POINTS_REDEEMED")
                    .externalUserId(customerId)
                    .amount(pointDiscount.longValue())
                    .transactionCode(txCode)
                    .timestamp(Instant.now())
                    .build();
            streamProducer.publishEvent(streamEvent);

            if (partner.getWebhookUrl() != null && !partner.getWebhookUrl().trim().isEmpty()) {
                outboxService.recordEvent(tenantId, "PAYMENT_COMPLETED", clearing, partner.getWebhookUrl());
            }

            BigDecimal finalAmountToPay = remainingBillAfterVoucher.subtract(pointDiscount);
            if (finalAmountToPay.compareTo(BigDecimal.ZERO) < 0)
                finalAmountToPay = BigDecimal.ZERO;

            log.info("[DIRECT-PAYMENT-SUCCESS] tenantId={}, partner={}, user={}, txCode={}, burned={}, finalPay={}",
                    tenantId, partner.getPartnerCode(), customerId, txCode, effectivePointsToBurn, finalAmountToPay);

            return PartnerPaymentDirectResponse.builder()
                    .transactionCode(txCode)
                    .partnerOrderId(request.getPartnerOrderId())
                    .externalUserId(customerId)
                    .billAmount(billAmount)
                    .pointsBurned(effectivePointsToBurn)
                    .pointDiscountAmount(pointDiscount)
                    .voucherDiscountAmount(voucherDiscount)
                    .finalAmountToPay(finalAmountToPay)
                    .remainingPoints(remainingPoints)
                    .appliedVoucherCode(appliedVoucherCode)
                    .status(ClearingStatus.PENDING)
                    .redeemedAt(Instant.now())
                    .build();
        });
    }

    // =========================================================================
    // 6. HOÀN ĐIỂM (REFUND)
    // =========================================================================
    @Transactional
    public PartnerPaymentRefundResponse refund(String tenantId, String partnerCode,
            PartnerPaymentRefundRequest request) {
        String origTx = request.getOriginalTransactionCode();
        String refundTx = request.getRefundTransactionCode();

        if (clearingRepository.existsByTenantIdAndTransactionCode(tenantId, refundTx)) {
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE,
                    MessageUtils.getMessage("wallet.refund.duplicate"));
        }

        ClearingTransactionEntity clearing = clearingRepository.findByTenantIdAndTransactionCode(tenantId, origTx)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND,
                        MessageUtils.getMessage("wallet.refund.original_not_found")));

        if (clearing.getStatus() == ClearingStatus.CANCELLED || clearing.getStatus() == ClearingStatus.REFUNDED) {
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE,
                    MessageUtils.getMessage("wallet.refund.already_refunded"));
        }

        String customerId = clearing.getExternalUserId();
        String lockKey = RedisKeys.getBurnLockKey(tenantId, customerId);
        SystemParameterService paramService = SystemParameterService.get();
        long waitTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_BURN_TIMEOUT_MS);
        long leaseTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_LEASE_TIME_MS);

        return lockHelper.executeWithLock(lockKey, waitTimeMs, leaseTimeMs, () -> {
            LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, customerId);

            BigDecimal pointsToRefund = request.getPointsToRefund() != null ? request.getPointsToRefund()
                    : clearing.getPointsRedeemed();
            BigDecimal newBalance = account.getCurrentPoints().add(pointsToRefund);
            account.setCurrentPoints(newBalance);
            accountRepository.save(account);

            LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                    .tenantId(tenantId)
                    .account(account)
                    .pointChange(pointsToRefund)
                    .balanceAfter(newBalance)
                    .changeType(PointActionType.REFUND)
                    .referenceCode(refundTx)
                    .description(MessageUtils.getMessage("wallet.refund.ledger_desc", origTx,
                            request.getReason() != null ? request.getReason() : ""))
                    .createdAt(Instant.now())
                    .build();
            ledgerRepository.save(ledger);

            clearing.setStatus(ClearingStatus.REFUNDED);
            clearingRepository.save(clearing);

            LoyaltyPartnerEntity partner = resolvePartner(tenantId, partnerCode);
            if (partner.getWebhookUrl() != null && !partner.getWebhookUrl().trim().isEmpty()) {
                outboxService.recordEvent(tenantId, "PAYMENT_REFUNDED", clearing, partner.getWebhookUrl());
            }

            log.info("[REFUND-SUCCESS] tenantId={}, partner={}, origTx={}, refundTx={}, pointsRefunded={}",
                    tenantId, partnerCode, origTx, refundTx, pointsToRefund);

            return PartnerPaymentRefundResponse.builder()
                    .refundTransactionCode(refundTx)
                    .originalTransactionCode(origTx)
                    .pointsRefunded(pointsToRefund)
                    .newBalance(newBalance)
                    .status(ClearingStatus.REFUNDED)
                    .refundedAt(Instant.now())
                    .build();
        });
    }

    // =========================================================================
    // 7. TRUY VẤN TRẠNG THÁI GIAO DỊCH (STATUS)
    // =========================================================================
    @Transactional(readOnly = true)
    public PartnerPaymentStatusResponse getStatus(String tenantId, String partnerCode,
            PartnerPaymentStatusRequest request) {
        ClearingTransactionEntity clearing = null;
        if (request.getTransactionCode() != null && !request.getTransactionCode().trim().isEmpty()) {
            clearing = clearingRepository
                    .findByTenantIdAndTransactionCode(tenantId, request.getTransactionCode().trim()).orElse(null);
        }

        if (clearing != null) {
            return PartnerPaymentStatusResponse.builder()
                    .transactionCode(clearing.getTransactionCode())
                    .holdCode(clearing.getHoldCode())
                    .partnerOrderId(clearing.getPartnerOrderId())
                    .externalUserId(clearing.getExternalUserId())
                    .billAmount(clearing.getFiatAmount())
                    .pointsBurned(clearing.getPointsRedeemed())
                    .pointDiscountAmount(clearing.getFiatAmount())
                    .commissionAmount(clearing.getCommissionAmount())
                    .netPayoutAmount(clearing.getNetPayoutAmount())
                    .status(clearing.getStatus().name())
                    .createdAt(clearing.getCreatedAt())
                    .settledAt(clearing.getSettledAt())
                    .build();
        }

        if (request.getHoldCode() != null && !request.getHoldCode().trim().isEmpty()) {
            LoyaltyPaymentHoldEntity hold = holdRepository
                    .findByTenantIdAndHoldCode(tenantId, request.getHoldCode().trim())
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.HOLD_NOT_FOUND,
                            MessageUtils.getMessage("wallet.status.not_found")));
            return PartnerPaymentStatusResponse.builder()
                    .holdCode(hold.getHoldCode())
                    .partnerOrderId(hold.getPartnerOrderId())
                    .externalUserId(hold.getExternalUserId())
                    .billAmount(hold.getBillAmount())
                    .pointsBurned(hold.getPointsHeld())
                    .pointDiscountAmount(hold.getPointDiscountAmount())
                    .commissionAmount(BigDecimal.ZERO)
                    .netPayoutAmount(hold.getPointDiscountAmount())
                    .status(hold.getStatus().name())
                    .createdAt(hold.getCreatedAt())
                    .build();
        }

        throw new LoyaltyException(ErrorCode.NOT_FOUND, MessageUtils.getMessage("wallet.status.missing_query"));
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================
    private LoyaltyPartnerEntity resolvePartner(String tenantId, String partnerCode) {
        if (partnerCode != null && !partnerCode.trim().isEmpty()) {
            return partnerRepository.findByTenantIdAndPartnerCode(tenantId, partnerCode.trim())
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.PARTNER_UNAUTHORIZED,
                            MessageUtils.getMessage("wallet.partner.not_found")));
        }
        List<LoyaltyPartnerEntity> partners = partnerRepository.findByTenantId(tenantId);
        if (!partners.isEmpty()) {
            return partners.get(0);
        }
        throw new LoyaltyException(ErrorCode.PARTNER_UNAUTHORIZED,
                MessageUtils.getMessage("wallet.partner.not_configured"));
    }

    private String resolveCustomerIdentifier(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND,
                    MessageUtils.getMessage("wallet.customer.id_blank"));
        }
        String clean = identifier.trim();
        if (clean.startsWith("QR_") || clean.startsWith("TOKEN_")) {
            String[] parts = clean.split("_");
            if (parts.length >= 2) {
                return parts[1];
            }
        }
        return clean;
    }
}
