package com.natcash.loyalty.wallet.service;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileRequest;
import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.account.service.AccountService;
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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartnerPaymentGatewayService {

    private static final Duration DEFAULT_HOLD_TTL = Duration.ofMinutes(10);
    private static final BigDecimal DEFAULT_EXCHANGE_RATE = BigDecimal.ONE;
    private static final BigDecimal DEFAULT_MAX_BURN_PERCENT = new BigDecimal("50.00");
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100.00");

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

        BigDecimal exchangeRate = policy != null ? policy.getPointExchangeRate() : DEFAULT_EXCHANGE_RATE;
        BigDecimal maxBurnPercentage = policy != null ? policy.getMaxBurnPercentage() : DEFAULT_MAX_BURN_PERCENT;

        BigDecimal currentPoints = profile.getCurrentPoints() != null ? profile.getCurrentPoints() : BigDecimal.ZERO;
        BigDecimal maxDeductiblePoints = currentPoints;
        BigDecimal maxDeductibleAmount = currentPoints.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);

        if (request.getBillAmount() != null && request.getBillAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal maxAllowedAmount = request.getBillAmount()
                    .multiply(maxBurnPercentage)
                    .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP);
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
                .tierName(profile.getTier() != null ? profile.getTier().getName() : "Hạng Bạc")
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
    public PartnerPaymentAuthorizeResponse authorize(String tenantId, String partnerCode, PartnerPaymentAuthorizeRequest request) {
        LoyaltyPartnerEntity partner = resolvePartner(tenantId, partnerCode);
        String customerId = resolveCustomerIdentifier(request.getCustomerIdentifier());
        BigDecimal billAmount = request.getBillAmount();

        LoyaltyAcceptancePolicyEntity policy = policyRepository
                .findByTenantIdAndPartnerId(tenantId, partner.getId())
                .orElse(null);

        BigDecimal exchangeRate = policy != null ? policy.getPointExchangeRate() : DEFAULT_EXCHANGE_RATE;
        BigDecimal maxBurnPercentage = policy != null ? policy.getMaxBurnPercentage() : DEFAULT_MAX_BURN_PERCENT;
        BigDecimal minBurnPoints = policy != null ? policy.getMinBurnPoints() : BigDecimal.ZERO;
        BigDecimal maxBurnPerTx = policy != null ? policy.getMaxBurnPointsPerTx() : new BigDecimal("5000.00");

        String lockKey = RedisKeys.getBurnLockKey(tenantId, customerId);
        return lockHelper.executeWithLock(lockKey, 3000, 10000, () -> {
            LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, customerId);

            BigDecimal voucherDiscount = BigDecimal.ZERO;
            String appliedVoucherCode = null;

            // Xử lý Voucher nếu có
            if (request.getVoucherRedemptionCode() != null && !request.getVoucherRedemptionCode().trim().isEmpty()) {
                String redemptionCode = request.getVoucherRedemptionCode().trim();
                LoyaltyVoucherRedemptionEntity redemption = redemptionRepository
                        .findByTenantIdAndRedemptionCode(tenantId, redemptionCode)
                        .orElseThrow(() -> new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND, "Không tìm thấy phiếu ưu đãi"));

                if (redemption.getStatus() != VoucherStatus.ACTIVE || redemption.getExpiresAt().isBefore(Instant.now())) {
                    throw new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND, "Phiếu ưu đãi đã hết hạn hoặc đã sử dụng");
                }

                LoyaltyVoucherEntity voucher = redemption.getVoucher();
                if (voucher != null) {
                    if (billAmount.compareTo(voucher.getMinBillAmount()) < 0) {
                        throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Hóa đơn chưa đạt giá trị tối thiểu để dùng voucher");
                    }
                    if (voucher.getDiscountType() == DiscountType.PERCENTAGE) {
                        voucherDiscount = billAmount.multiply(voucher.getDiscountValue())
                                .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP);
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
                }
            }

            BigDecimal remainingBillAfterVoucher = billAmount.subtract(voucherDiscount);
            BigDecimal maxAllowedPointDeduction = remainingBillAfterVoucher
                    .multiply(maxBurnPercentage)
                    .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP);

            BigDecimal requestedPoints = request.getPointsToBurn() != null ? request.getPointsToBurn() : BigDecimal.ZERO;
            BigDecimal effectivePointsToHold = requestedPoints;

            if (effectivePointsToHold.compareTo(maxBurnPerTx) > 0) {
                effectivePointsToHold = maxBurnPerTx;
            }

            BigDecimal calculatedPointDiscount = effectivePointsToHold.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);
            if (calculatedPointDiscount.compareTo(maxAllowedPointDeduction) > 0) {
                calculatedPointDiscount = maxAllowedPointDeduction;
                effectivePointsToHold = maxAllowedPointDeduction.divide(exchangeRate, 2, RoundingMode.HALF_UP);
            }

            if (effectivePointsToHold.compareTo(BigDecimal.ZERO) > 0 && effectivePointsToHold.compareTo(minBurnPoints) < 0) {
                throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Số điểm tiêu tối thiểu là " + minBurnPoints);
            }

            BigDecimal currentBalance = account.getCurrentPoints() != null ? account.getCurrentPoints() : BigDecimal.ZERO;
            if (effectivePointsToHold.compareTo(currentBalance) > 0) {
                throw new LoyaltyException(ErrorCode.INSUFFICIENT_POINTS, "Số dư điểm không đủ để thực hiện thanh toán");
            }

            BigDecimal finalAmountToPay = remainingBillAfterVoucher.subtract(calculatedPointDiscount);
            if (finalAmountToPay.compareTo(BigDecimal.ZERO) < 0) {
                finalAmountToPay = BigDecimal.ZERO;
            }

            String holdCode = "HOLD_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            Instant now = Instant.now();
            Instant expiresAt = now.plus(DEFAULT_HOLD_TTL);

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

            log.info("[HOLD-SUCCESS] tenantId={}, partner={}, user={}, holdCode={}, bill={}, pointsHeld={}, discount={}",
                    tenantId, partner.getPartnerCode(), customerId, holdCode, billAmount, effectivePointsToHold, calculatedPointDiscount);

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
    public PartnerPaymentConfirmResponse confirm(String tenantId, String partnerCode, PartnerPaymentConfirmRequest request) {
        String txCode = request.getTransactionCode();
        String holdCode = request.getHoldCode();

        if (clearingRepository.existsByTenantIdAndTransactionCode(tenantId, txCode)) {
            log.warn("[CONFIRM-DUPLICATE] tenantId={}, txCode={} - Giao dịch đã tồn tại", tenantId, txCode);
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE, "Mã giao dịch POS đã tồn tại");
        }

        LoyaltyPaymentHoldEntity hold = holdRepository.findByTenantIdAndHoldCode(tenantId, holdCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.HOLD_NOT_FOUND, "Không tìm thấy phiên tạm giữ điểm"));

        if (hold.getStatus() != HoldStatus.HELD) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Phiên tạm giữ điểm không ở trạng thái hợp lệ: " + hold.getStatus());
        }

        if (hold.getExpiresAt().isBefore(Instant.now())) {
            hold.setStatus(HoldStatus.EXPIRED);
            holdRepository.save(hold);
            throw new LoyaltyException(ErrorCode.HOLD_EXPIRED, "Phiên tạm giữ điểm đã hết hạn");
        }

        String customerId = hold.getExternalUserId();
        String lockKey = RedisKeys.getBurnLockKey(tenantId, customerId);

        return lockHelper.executeWithLock(lockKey, 3000, 10000, () -> {
            LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, customerId);

            BigDecimal pointsToBurn = hold.getPointsHeld();
            BigDecimal pointDiscount = hold.getPointDiscountAmount();
            BigDecimal voucherDiscount = hold.getVoucherDiscountAmount();
            BigDecimal billAmount = hold.getBillAmount();
            BigDecimal currentPoints = account.getCurrentPoints() != null ? account.getCurrentPoints() : BigDecimal.ZERO;

            if (pointsToBurn.compareTo(currentPoints) > 0) {
                throw new LoyaltyException(ErrorCode.INSUFFICIENT_POINTS, "Số dư điểm không đủ để xác nhận thanh toán");
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
                        .description("Thanh toán trừ điểm tại đối tác " + hold.getPartner().getPartnerName())
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

            BigDecimal commissionAmount = pointDiscount.multiply(commissionRate)
                    .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP)
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
                    .exchangeRate(policy != null ? policy.getPointExchangeRate() : DEFAULT_EXCHANGE_RATE)
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
    public PartnerPaymentCancelResponse cancel(String tenantId, String partnerCode, PartnerPaymentCancelRequest request) {
        String holdCode = request.getHoldCode();
        LoyaltyPaymentHoldEntity hold = holdRepository.findByTenantIdAndHoldCode(tenantId, holdCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.HOLD_NOT_FOUND, "Không tìm thấy phiên tạm giữ điểm"));

        if (hold.getStatus() != HoldStatus.HELD) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Phiên giữ điểm không ở trạng thái có thể hủy: " + hold.getStatus());
        }

        hold.setStatus(HoldStatus.CANCELLED);
        holdRepository.save(hold);

        log.info("[CANCEL-SUCCESS] tenantId={}, holdCode={}, pointsReleased={}", tenantId, holdCode, hold.getPointsHeld());

        return PartnerPaymentCancelResponse.builder()
                .holdCode(holdCode)
                .status(HoldStatus.CANCELLED)
                .pointsReleased(hold.getPointsHeld())
                .message("Đã hủy và giải phóng điểm tạm giữ thành công")
                .cancelledAt(Instant.now())
                .build();
    }

    // =========================================================================
    // 5. THANH TOÁN 1 CHẠM TỨC THÌ QUA DYNAMIC QR (DIRECT PAYMENT)
    // =========================================================================
    @Transactional
    public PartnerPaymentDirectResponse directPayment(String tenantId, String partnerCode, PartnerPaymentDirectRequest request) {
        String txCode = request.getTransactionCode();
        if (clearingRepository.existsByTenantIdAndTransactionCode(tenantId, txCode)) {
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE, "Mã giao dịch đã tồn tại");
        }

        LoyaltyPartnerEntity partner = resolvePartner(tenantId, partnerCode);
        String customerId = resolveCustomerIdentifier(request.getQrToken());
        BigDecimal billAmount = request.getBillAmount();

        LoyaltyAcceptancePolicyEntity policy = policyRepository
                .findByTenantIdAndPartnerId(tenantId, partner.getId())
                .orElse(null);

        BigDecimal exchangeRate = policy != null ? policy.getPointExchangeRate() : DEFAULT_EXCHANGE_RATE;
        BigDecimal maxBurnPercentage = policy != null ? policy.getMaxBurnPercentage() : DEFAULT_MAX_BURN_PERCENT;
        BigDecimal minBurnPoints = policy != null ? policy.getMinBurnPoints() : BigDecimal.ZERO;
        BigDecimal maxBurnPerTx = policy != null ? policy.getMaxBurnPointsPerTx() : new BigDecimal("5000.00");

        String lockKey = RedisKeys.getBurnLockKey(tenantId, customerId);
        return lockHelper.executeWithLock(lockKey, 3000, 10000, () -> {
            LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, customerId);

            BigDecimal voucherDiscount = BigDecimal.ZERO;
            String appliedVoucherCode = null;

            if (request.getVoucherRedemptionCode() != null && !request.getVoucherRedemptionCode().trim().isEmpty()) {
                String redemptionCode = request.getVoucherRedemptionCode().trim();
                LoyaltyVoucherRedemptionEntity redemption = redemptionRepository
                        .findByTenantIdAndRedemptionCode(tenantId, redemptionCode)
                        .orElseThrow(() -> new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND, "Không tìm thấy phiếu ưu đãi"));

                if (redemption.getStatus() == VoucherStatus.ACTIVE && redemption.getExpiresAt().isAfter(Instant.now())) {
                    LoyaltyVoucherEntity voucher = redemption.getVoucher();
                    if (voucher != null && billAmount.compareTo(voucher.getMinBillAmount()) >= 0) {
                        if (voucher.getDiscountType() == DiscountType.PERCENTAGE) {
                            voucherDiscount = billAmount.multiply(voucher.getDiscountValue()).divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP);
                            if (voucher.getMaxDiscountAmount() != null && voucherDiscount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                                voucherDiscount = voucher.getMaxDiscountAmount();
                            }
                        } else {
                            voucherDiscount = voucher.getDiscountValue();
                        }
                        if (voucherDiscount.compareTo(billAmount) > 0) voucherDiscount = billAmount;
                        appliedVoucherCode = redemptionCode;
                        redemption.setStatus(VoucherStatus.USED);
                        redemption.setUsedAt(Instant.now());
                        redemption.setUsedPartnerId(partner.getId());
                        redemptionRepository.save(redemption);
                    }
                }
            }

            BigDecimal remainingBillAfterVoucher = billAmount.subtract(voucherDiscount);
            BigDecimal maxAllowedPointDiscount = remainingBillAfterVoucher.multiply(maxBurnPercentage).divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP);

            BigDecimal requestedPoints = request.getPointsToBurn() != null ? request.getPointsToBurn() : BigDecimal.ZERO;
            BigDecimal effectivePointsToBurn = requestedPoints;

            if (effectivePointsToBurn.compareTo(maxBurnPerTx) > 0) {
                effectivePointsToBurn = maxBurnPerTx;
            }

            BigDecimal pointDiscount = effectivePointsToBurn.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);
            if (pointDiscount.compareTo(maxAllowedPointDiscount) > 0) {
                pointDiscount = maxAllowedPointDiscount;
                effectivePointsToBurn = maxAllowedPointDiscount.divide(exchangeRate, 2, RoundingMode.HALF_UP);
            }

            if (effectivePointsToBurn.compareTo(BigDecimal.ZERO) > 0 && effectivePointsToBurn.compareTo(minBurnPoints) < 0) {
                throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Số điểm tiêu tối thiểu là " + minBurnPoints);
            }

            BigDecimal currentPoints = account.getCurrentPoints() != null ? account.getCurrentPoints() : BigDecimal.ZERO;
            if (effectivePointsToBurn.compareTo(currentPoints) > 0) {
                throw new LoyaltyException(ErrorCode.INSUFFICIENT_POINTS, "Số dư điểm không đủ");
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
                        .description(request.getDescription() != null ? request.getDescription() : "Thanh toán 1 chạm trực tiếp")
                        .createdAt(Instant.now())
                        .build();
                ledgerRepository.save(ledger);
            }

            BigDecimal commissionRate = policy != null ? policy.getCommissionRatePercent() : BigDecimal.ZERO;
            BigDecimal fixedFee = policy != null ? policy.getFixedFeePerTx() : BigDecimal.ZERO;
            BigDecimal commissionAmount = pointDiscount.multiply(commissionRate).divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP).add(fixedFee);
            BigDecimal netPayoutAmount = pointDiscount.subtract(commissionAmount);
            if (netPayoutAmount.compareTo(BigDecimal.ZERO) < 0) netPayoutAmount = BigDecimal.ZERO;

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
            if (finalAmountToPay.compareTo(BigDecimal.ZERO) < 0) finalAmountToPay = BigDecimal.ZERO;

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
    public PartnerPaymentRefundResponse refund(String tenantId, String partnerCode, PartnerPaymentRefundRequest request) {
        String origTx = request.getOriginalTransactionCode();
        String refundTx = request.getRefundTransactionCode();

        if (clearingRepository.existsByTenantIdAndTransactionCode(tenantId, refundTx)) {
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE, "Mã giao dịch hoàn trả đã tồn tại");
        }

        ClearingTransactionEntity clearing = clearingRepository.findByTenantIdAndTransactionCode(tenantId, origTx)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND, "Không tìm thấy giao dịch gốc để hoàn"));

        if (clearing.getStatus() == ClearingStatus.CANCELLED || clearing.getStatus() == ClearingStatus.REFUNDED) {
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE, "Giao dịch đã được hoàn trả trước đó");
        }

        String customerId = clearing.getExternalUserId();
        String lockKey = RedisKeys.getBurnLockKey(tenantId, customerId);

        return lockHelper.executeWithLock(lockKey, 3000, 10000, () -> {
            LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, customerId);

            BigDecimal pointsToRefund = request.getPointsToRefund() != null ? request.getPointsToRefund() : clearing.getPointsRedeemed();
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
                    .description("Hoàn điểm hóa đơn hủy: " + origTx + " (" + (request.getReason() != null ? request.getReason() : "") + ")")
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
    public PartnerPaymentStatusResponse getStatus(String tenantId, String partnerCode, PartnerPaymentStatusRequest request) {
        ClearingTransactionEntity clearing = null;
        if (request.getTransactionCode() != null && !request.getTransactionCode().trim().isEmpty()) {
            clearing = clearingRepository.findByTenantIdAndTransactionCode(tenantId, request.getTransactionCode().trim()).orElse(null);
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
            LoyaltyPaymentHoldEntity hold = holdRepository.findByTenantIdAndHoldCode(tenantId, request.getHoldCode().trim())
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.HOLD_NOT_FOUND, "Không tìm thấy thông tin giao dịch hoặc mã hold"));
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

        throw new LoyaltyException(ErrorCode.NOT_FOUND, "Vui lòng cung cấp transactionCode hoặc holdCode để tra cứu");
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================
    private LoyaltyPartnerEntity resolvePartner(String tenantId, String partnerCode) {
        if (partnerCode != null && !partnerCode.trim().isEmpty()) {
            return partnerRepository.findByTenantIdAndPartnerCode(tenantId, partnerCode.trim())
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.PARTNER_UNAUTHORIZED, "Không tìm thấy thông tin đối tác"));
        }
        List<LoyaltyPartnerEntity> partners = partnerRepository.findByTenantId(tenantId);
        if (!partners.isEmpty()) {
            return partners.get(0);
        }
        throw new LoyaltyException(ErrorCode.PARTNER_UNAUTHORIZED, "Chưa cấu hình đối tác trong hệ thống");
    }

    private String resolveCustomerIdentifier(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND, "Mã khách hàng không được để trống");
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
