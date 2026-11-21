package com.natcash.loyalty.wallet.service;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.config.LoyaltyProperties;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.constant.SecurityConstants;
import com.natcash.loyalty.domain.enums.CurrencyCode;
import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.util.MessageUtils;
import com.natcash.loyalty.wallet.dto.VoucherDto.CheckVoucherRequest;
import com.natcash.loyalty.wallet.dto.VoucherDto.CheckVoucherResponse;
import com.natcash.loyalty.wallet.dto.VoucherDto.RedeemDynamicVoucherRequest;
import com.natcash.loyalty.wallet.dto.VoucherDto.RedeemDynamicVoucherResponse;
import com.natcash.loyalty.wallet.dto.VoucherDto.VoucherUseCodeResponse;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherRedemptionEntity;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRedemptionRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Dịch vụ sinh và xác thực mã sử dụng voucher động (6-8 ký tự Crockford Base32)
 * được nén từ chuỗi cấu trúc ký bằng cặp khóa bất đối xứng Ed25519 và mã hóa AES-256-GCM.
 */
@Service
public class VoucherDynamicCodeService {

    private static final Logger log = LoggerFactory.getLogger(VoucherDynamicCodeService.class);

    private static final String KEY_PAIR_ALGORITHM = "Ed25519";
    private static final String AES_ALGORITHM = "AES";
    private static final String AES_GCM_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final String ENVELOPE_ALGORITHM_LABEL = "Ed25519+AES-256-GCM+CrockfordBase32";
    private static final String STRUCTURED_VERSION = "V1";
    private static final String CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    private static final int MIN_DYNAMIC_CODE_LENGTH = 6;
    private static final int MAX_DYNAMIC_CODE_LENGTH = 8;
    private static final int DEFAULT_DYNAMIC_CODE_LENGTH = 8;
    private static final int DEFAULT_TTL_SECONDS = 300;
    private static final int MIN_TTL_SECONDS = 30;
    private static final int GCM_IV_BYTES = 12;
    private static final int GCM_TAG_BITS = 128;
    private static final int NONCE_BYTES = 6;
    private static final int MAX_COLLISION_ATTEMPTS = 6;
    private static final String DEFAULT_KEY_WRAP_CONTEXT = "micro-loyalty-voucher-keypair-context";

    private final LoyaltyVoucherRedemptionRepository redemptionRepository;
    private final LoyaltyPartnerRepository partnerRepository;
    private final DistributedLockHelper lockHelper;
    private final RedissonClient redissonClient;
    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    private final ConcurrentHashMap<String, String> fallbackCodeStore = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Instant> fallbackCodeExpiry = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> fallbackActiveByRedemption = new ConcurrentHashMap<>();
    private volatile KeyPair cachedKeyPair;

    @Autowired
    public VoucherDynamicCodeService(
            LoyaltyVoucherRedemptionRepository redemptionRepository,
            LoyaltyPartnerRepository partnerRepository,
            DistributedLockHelper lockHelper,
            @Autowired(required = false) RedissonClient redissonClient,
            @Autowired(required = false) ObjectMapper objectMapper) {
        this.redemptionRepository = redemptionRepository;
        this.partnerRepository = partnerRepository;
        this.lockHelper = lockHelper;
        this.redissonClient = redissonClient;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    /**
     * Sinh mã sử dụng voucher động 6-8 ký tự (mặc định 8 ký tự, TTL 300s = 5 phút) khi người dùng bấm "Sử dụng".
     */
    @Transactional(readOnly = true)
    public VoucherUseCodeResponse generateUseCode(String tenantId, Long redemptionId, String externalUserId) {
        if (redemptionId == null) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, MessageUtils.getMessage("voucher.not_found"));
        }

        LoyaltyVoucherRedemptionEntity redemption = redemptionRepository.findById(redemptionId)
                .filter(r -> tenantId.equals(r.getTenantId()))
                .orElseThrow(() -> new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND,
                        MessageUtils.getMessage("voucher.not_found")));

        if (externalUserId != null && !externalUserId.isBlank()
                && (redemption.getAccount() == null
                        || !externalUserId.trim().equals(redemption.getAccount().getExternalUserId()))) {
            throw new LoyaltyException(ErrorCode.IDOR_FORBIDDEN,
                    MessageUtils.getMessage("voucher.dynamic.not_owned"));
        }

        Instant now = Instant.now();
        validateRedemptionAndVoucherUsable(redemption, now);

        LoyaltyVoucherEntity voucher = redemption.getVoucher();
        String ownerUserId = redemption.getAccount() != null ? redemption.getAccount().getExternalUserId() : "";
        int ttlSeconds = resolveTtlSeconds(tenantId);
        int codeLength = resolveCodeLength(tenantId);

        Instant issuedAt = now;
        Instant expiresAt = issuedAt.plusSeconds(ttlSeconds);
        // Giới hạn thời gian mã động không vượt quá hạn gốc của voucher
        if (redemption.getExpiresAt() != null && expiresAt.isAfter(redemption.getExpiresAt())) {
            expiresAt = redemption.getExpiresAt();
            ttlSeconds = Math.max(1, (int) Duration.between(issuedAt, expiresAt).getSeconds());
        }

        KeyPair keyPair = getOrInitializeKeyPair();
        String nonce = generateHexNonce();
        String structuredPayload = buildStructuredPayload(
                tenantId,
                redemption.getId(),
                voucher != null ? voucher.getId() : null,
                voucher != null ? voucher.getVoucherCode() : "",
                ownerUserId,
                issuedAt.getEpochSecond(),
                expiresAt.getEpochSecond(),
                nonce);

        String signatureB64 = signWithPrivateKey(structuredPayload, keyPair.getPrivate());
        String encryptedEnvelopeB64 = encryptPayload(structuredPayload, keyPair.getPublic(), nonce);
        String keyId = resolveKeyId(keyPair.getPublic());

        DynamicVoucherEnvelope envelope = DynamicVoucherEnvelope.builder()
                .version(STRUCTURED_VERSION)
                .tenantId(tenantId)
                .redemptionId(redemption.getId())
                .voucherId(voucher != null ? voucher.getId() : null)
                .voucherCode(voucher != null ? voucher.getVoucherCode() : "")
                .externalUserId(ownerUserId)
                .issuedAtEpochSec(issuedAt.getEpochSecond())
                .expiresAtEpochSec(expiresAt.getEpochSecond())
                .nonce(nonce)
                .keyId(keyId)
                .algorithm(ENVELOPE_ALGORITHM_LABEL)
                .encryptedPayload(encryptedEnvelopeB64)
                .signature(signatureB64)
                .build();

        String envelopeJson = serializeEnvelope(envelope);
        String shortCode = allocateUniqueShortCode(
                tenantId,
                redemption.getId(),
                encryptedEnvelopeB64,
                signatureB64,
                keyPair.getPublic().getEncoded(),
                codeLength,
                envelopeJson,
                ttlSeconds,
                expiresAt);

        String partnerName = resolvePartnerName(voucher != null ? voucher.getPartnerId() : null);
        String discountText = formatDiscountText(voucher);

        log.info("[VOUCHER-DYNAMIC-CODE-ISSUED] tenantId={}, redemptionId={}, user={}, codeLength={}, ttl={}s",
                tenantId, redemption.getId(), ownerUserId, shortCode.length(), ttlSeconds);

        return VoucherUseCodeResponse.builder()
                .redemptionId(redemption.getId())
                .voucherId(voucher != null ? voucher.getId() : null)
                .voucherCode(voucher != null ? voucher.getVoucherCode() : null)
                .voucherTitle(voucher != null ? voucher.getTitle() : MessageUtils.getMessage("voucher.default_title"))
                .partnerId(voucher != null ? voucher.getPartnerId() : null)
                .partnerName(partnerName)
                .discountText(discountText)
                .usageType(voucher != null ? voucher.getUsageType() : null)
                .serviceLink(voucher != null ? voucher.getServiceLink() : null)
                .dynamicCode(shortCode)
                .qrPayload(shortCode)
                .barcodeValue(shortCode)
                .keyId(keyId)
                .algorithm(ENVELOPE_ALGORITHM_LABEL)
                .expiresInSeconds(ttlSeconds)
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .build();
    }

    /**
     * API checkVoucher: kiểm tra tính hợp lệ của chuỗi mã động, chữ ký cặp khóa, cấu trúc giải mã và thời gian hiệu lực.
     */
    @Transactional(readOnly = true)
    public CheckVoucherResponse checkVoucher(String tenantId, CheckVoucherRequest request) {
        if (request == null || request.getCode() == null || request.getCode().isBlank()) {
            return invalidCheckResponse(null, ErrorCode.VALIDATION_ERROR,
                    MessageUtils.getMessage("voucher.dynamic.invalid_or_expired"));
        }

        String normalizedCode = normalizeShortCode(request.getCode());
        if (!isValidDynamicCodeFormat(normalizedCode)) {
            return invalidCheckResponse(normalizedCode, ErrorCode.VOUCHER_NOT_FOUND,
                    MessageUtils.getMessage("voucher.dynamic.invalid_or_expired"));
        }

        String envelopeJson = loadCodeEnvelope(tenantId, normalizedCode);
        if (envelopeJson == null || envelopeJson.isBlank()) {
            return invalidCheckResponse(normalizedCode, ErrorCode.VOUCHER_NOT_FOUND,
                    MessageUtils.getMessage("voucher.dynamic.invalid_or_expired"));
        }

        DynamicVoucherEnvelope envelope;
        try {
            envelope = objectMapper.readValue(envelopeJson, DynamicVoucherEnvelope.class);
        } catch (Exception ex) {
            log.warn("[CHECK-VOUCHER] Corrupt envelope for code={}: {}", normalizedCode, ex.getMessage());
            return invalidCheckResponse(normalizedCode, ErrorCode.VOUCHER_NOT_FOUND,
                    MessageUtils.getMessage("voucher.dynamic.invalid_or_expired"));
        }

        KeyPair keyPair = getOrInitializeKeyPair();
        String decryptedPayload;
        try {
            decryptedPayload = decryptPayload(envelope.getEncryptedPayload(), keyPair.getPublic(), envelope.getNonce());
        } catch (Exception ex) {
            log.warn("[CHECK-VOUCHER] Decrypt failed for code={}: {}", normalizedCode, ex.getMessage());
            return invalidCheckResponse(normalizedCode, ErrorCode.SIGNATURE_INVALID,
                    MessageUtils.getMessage("voucher.dynamic.signature_invalid"));
        }

        if (!verifyWithPublicKey(decryptedPayload, envelope.getSignature(), keyPair.getPublic())) {
            log.warn("[CHECK-VOUCHER] Ed25519 signature invalid for code={}", normalizedCode);
            return invalidCheckResponse(normalizedCode, ErrorCode.SIGNATURE_INVALID,
                    MessageUtils.getMessage("voucher.dynamic.signature_invalid"));
        }

        String expectedPayload = buildStructuredPayload(
                envelope.getTenantId(),
                envelope.getRedemptionId(),
                envelope.getVoucherId(),
                envelope.getVoucherCode(),
                envelope.getExternalUserId(),
                envelope.getIssuedAtEpochSec(),
                envelope.getExpiresAtEpochSec(),
                envelope.getNonce());

        if (!MessageDigest.isEqual(
                expectedPayload.getBytes(StandardCharsets.UTF_8),
                decryptedPayload.getBytes(StandardCharsets.UTF_8))
                || !tenantId.equals(envelope.getTenantId())) {
            return invalidCheckResponse(normalizedCode, ErrorCode.SIGNATURE_INVALID,
                    MessageUtils.getMessage("voucher.dynamic.signature_invalid"));
        }

        Instant now = Instant.now();
        Instant issuedAt = Instant.ofEpochSecond(envelope.getIssuedAtEpochSec());
        Instant expiresAt = Instant.ofEpochSecond(envelope.getExpiresAtEpochSec());
        if (now.isAfter(expiresAt)) {
            deleteCodeEnvelope(tenantId, normalizedCode);
            return invalidCheckResponse(normalizedCode, ErrorCode.VOUCHER_NOT_FOUND,
                    MessageUtils.getMessage("voucher.dynamic.invalid_or_expired"));
        }

        Optional<LoyaltyVoucherRedemptionEntity> redemptionOpt = redemptionRepository.findById(envelope.getRedemptionId());
        if (redemptionOpt.isEmpty() || !tenantId.equals(redemptionOpt.get().getTenantId())) {
            return invalidCheckResponse(normalizedCode, ErrorCode.VOUCHER_NOT_FOUND,
                    MessageUtils.getMessage("voucher.dynamic.invalid_or_expired"));
        }

        LoyaltyVoucherRedemptionEntity redemption = redemptionOpt.get();
        if (redemption.getStatus() == VoucherStatus.USED) {
            return invalidCheckResponse(normalizedCode, ErrorCode.VOUCHER_NOT_FOUND,
                    MessageUtils.getMessage("voucher.dynamic.already_used"));
        }
        if (redemption.getStatus() != VoucherStatus.ACTIVE
                || (redemption.getExpiresAt() != null && redemption.getExpiresAt().isBefore(now))) {
            return invalidCheckResponse(normalizedCode, ErrorCode.VOUCHER_NOT_FOUND,
                    MessageUtils.getMessage("voucher.dynamic.invalid_or_expired"));
        }

        LoyaltyVoucherEntity voucher = redemption.getVoucher();
        if (voucher == null || voucher.getStatus() != VoucherStatus.ACTIVE
                || (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate()))
                || (voucher.getEndDate() != null && now.isAfter(voucher.getEndDate()))) {
            return invalidCheckResponse(normalizedCode, ErrorCode.VOUCHER_NOT_FOUND,
                    MessageUtils.getMessage("voucher.dynamic.invalid_or_expired"));
        }

        if (request.getExternalUserId() != null && !request.getExternalUserId().isBlank()
                && !request.getExternalUserId().trim().equals(envelope.getExternalUserId())) {
            return invalidCheckResponse(normalizedCode, ErrorCode.IDOR_FORBIDDEN,
                    MessageUtils.getMessage("voucher.dynamic.not_owned"));
        }

        Long requestedPartnerId = resolveRequestedPartnerId(tenantId, request.getPartnerId(), request.getPartnerCode());
        if (requestedPartnerId != null && voucher.getPartnerId() != null
                && !requestedPartnerId.equals(voucher.getPartnerId())) {
            return invalidCheckResponse(normalizedCode, ErrorCode.PARTNER_UNAUTHORIZED,
                    MessageUtils.getMessage("voucher.dynamic.partner_mismatch"));
        }

        if (!matchesBranchScope(voucher.getBranchScope(), request.getBranchCode())) {
            return invalidCheckResponse(normalizedCode, ErrorCode.POLICY_VIOLATION,
                    MessageUtils.getMessage("voucher.dynamic.branch_mismatch"));
        }

        BigDecimal minBill = voucher.getMinBillAmount() != null ? voucher.getMinBillAmount() : BigDecimal.ZERO;
        if (request.getBillAmount() != null && request.getBillAmount().compareTo(minBill) < 0) {
            return invalidCheckResponse(normalizedCode, ErrorCode.POLICY_VIOLATION,
                    MessageUtils.getMessage("voucher.dynamic.min_bill_not_met"));
        }

        BigDecimal estimatedDiscount = calculateDiscount(tenantId, voucher, request.getBillAmount());
        long remainingSeconds = Math.max(0L, Duration.between(now, expiresAt).getSeconds());

        return CheckVoucherResponse.builder()
                .valid(true)
                .dynamicCode(normalizedCode)
                .errorCode(ErrorCode.SUCCESS.getCode())
                .message(MessageUtils.getMessage("voucher.dynamic.valid"))
                .redemptionId(redemption.getId())
                .voucherId(voucher.getId())
                .voucherCode(voucher.getVoucherCode())
                .voucherTitle(voucher.getTitle())
                .partnerId(voucher.getPartnerId())
                .partnerName(resolvePartnerName(voucher.getPartnerId()))
                .externalUserId(envelope.getExternalUserId())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .estimatedDiscount(estimatedDiscount)
                .minBillAmount(minBill)
                .maxDiscountAmount(voucher.getMaxDiscountAmount())
                .usageType(voucher.getUsageType())
                .branchScope(voucher.getBranchScope())
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .remainingSeconds(remainingSeconds)
                .voucherExpiresAt(redemption.getExpiresAt())
                .build();
    }

    /**
     * Xác thực và tiêu thụ nguyên tử mã voucher động (Single-Use Atomicity) cho giao dịch thanh toán / gạch nợ.
     */
    @Transactional
    public ConsumedVoucherResult consumeDynamicCode(
            String tenantId,
            String rawCode,
            Long partnerId,
            String partnerCode,
            String branchCode,
            BigDecimal billAmount,
            String externalUserId) {
        return executeLockedDynamicCodeAction(
                tenantId, rawCode, partnerId, partnerCode, branchCode, billAmount, externalUserId, true);
    }

    /**
     * Xác thực và khóa dùng một lần mã động trong luồng Authorize (Pre-Auth Hold);
     * trạng thái USED của voucher sẽ được chốt khi Confirm/Capture.
     */
    @Transactional(readOnly = true)
    public ConsumedVoucherResult verifyAndConsumeCodeForHold(
            String tenantId,
            String rawCode,
            Long partnerId,
            String partnerCode,
            String branchCode,
            BigDecimal billAmount,
            String externalUserId) {
        return executeLockedDynamicCodeAction(
                tenantId, rawCode, partnerId, partnerCode, branchCode, billAmount, externalUserId, false);
    }

    private ConsumedVoucherResult executeLockedDynamicCodeAction(
            String tenantId,
            String rawCode,
            Long partnerId,
            String partnerCode,
            String branchCode,
            BigDecimal billAmount,
            String externalUserId,
            boolean markVoucherUsed) {
        CheckVoucherResponse check = validateDynamicCodeOrThrow(
                tenantId, rawCode, partnerId, partnerCode, branchCode, billAmount, externalUserId);

        String lockKey = RedisKeys.getVoucherUseLockKey(tenantId, check.getRedemptionId());
        SystemParameterService paramService = SystemParameterService.get();
        long waitTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_BURN_TIMEOUT_MS);
        long shortLeaseMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_SHORT_LEASE_MS);

        return lockHelper.executeWithLock(lockKey, waitTimeMs, shortLeaseMs, () -> {
            CheckVoucherResponse recheck = validateDynamicCodeOrThrow(
                    tenantId, rawCode, partnerId, partnerCode, branchCode, billAmount, externalUserId);

            String normalizedCode = recheck.getDynamicCode();
            boolean deleted = consumeCodeEnvelopeAtomically(tenantId, normalizedCode, recheck.getRedemptionId());
            if (!deleted) {
                throw new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND,
                        MessageUtils.getMessage("voucher.dynamic.already_used"));
            }

            LoyaltyVoucherRedemptionEntity redemption = redemptionRepository.findById(recheck.getRedemptionId())
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND,
                            MessageUtils.getMessage("voucher.dynamic.invalid_or_expired")));

            if (redemption.getStatus() != VoucherStatus.ACTIVE) {
                throw new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND,
                        MessageUtils.getMessage("voucher.dynamic.already_used"));
            }

            Long resolvedPartnerId = resolveRequestedPartnerId(tenantId, partnerId, partnerCode);
            Instant now = Instant.now();
            if (markVoucherUsed) {
                redemption.setStatus(VoucherStatus.USED);
                redemption.setUsedAt(now);
                if (resolvedPartnerId != null) {
                    redemption.setUsedPartnerId(resolvedPartnerId);
                }
                redemption = redemptionRepository.save(redemption);
                log.info("[VOUCHER-DYNAMIC-CONSUMED] tenantId={}, redemptionId={}, partnerId={}",
                        tenantId, redemption.getId(), resolvedPartnerId);
            }

            BigDecimal discountAmount = calculateDiscount(tenantId, redemption.getVoucher(), billAmount);
            BigDecimal finalAmount = billAmount != null
                    ? billAmount.subtract(discountAmount).max(BigDecimal.ZERO)
                    : BigDecimal.ZERO;

            return ConsumedVoucherResult.builder()
                    .redemption(redemption)
                    .voucher(redemption.getVoucher())
                    .dynamicCode(normalizedCode)
                    .externalUserId(recheck.getExternalUserId())
                    .discountAmount(discountAmount)
                    .finalAmount(finalAmount)
                    .usedAt(now)
                    .build();
        });
    }

    private CheckVoucherResponse validateDynamicCodeOrThrow(
            String tenantId,
            String rawCode,
            Long partnerId,
            String partnerCode,
            String branchCode,
            BigDecimal billAmount,
            String externalUserId) {
        CheckVoucherResponse check = checkVoucher(tenantId, CheckVoucherRequest.builder()
                .code(rawCode)
                .partnerId(partnerId)
                .partnerCode(partnerCode)
                .branchCode(branchCode)
                .billAmount(billAmount)
                .externalUserId(externalUserId)
                .build());

        if (!check.isValid() || check.getRedemptionId() == null) {
            ErrorCode errCode = ErrorCode.fromCode(check.getErrorCode());
            throw new LoyaltyException(
                    errCode != null ? errCode : ErrorCode.VOUCHER_NOT_FOUND,
                    check.getMessage() != null ? check.getMessage()
                            : MessageUtils.getMessage("voucher.dynamic.invalid_or_expired"));
        }
        return check;
    }

    /**
     * Xác nhận sử dụng mã voucher động cho hệ thống thanh toán/đối tác bên ngoài gọi trực tiếp.
     */
    @Transactional
    public RedeemDynamicVoucherResponse redeemDynamicVoucher(String tenantId, RedeemDynamicVoucherRequest request) {
        if (request == null || request.getCode() == null || request.getCode().isBlank()) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR,
                    MessageUtils.getMessage("voucher.dynamic.invalid_or_expired"));
        }

        ConsumedVoucherResult result = consumeDynamicCode(
                tenantId,
                request.getCode(),
                request.getPartnerId(),
                request.getPartnerCode(),
                request.getBranchCode(),
                request.getBillAmount(),
                request.getExternalUserId());

        LoyaltyVoucherEntity v = result.getVoucher();
        return RedeemDynamicVoucherResponse.builder()
                .success(true)
                .redemptionId(result.getRedemption().getId())
                .dynamicCode(result.getDynamicCode())
                .voucherTitle(v != null ? v.getTitle() : "")
                .partnerId(result.getRedemption().getUsedPartnerId() != null
                        ? result.getRedemption().getUsedPartnerId()
                        : (v != null ? v.getPartnerId() : null))
                .externalUserId(result.getExternalUserId())
                .discountAmount(result.getDiscountAmount())
                .finalAmount(result.getFinalAmount())
                .transactionCode(request.getTransactionCode())
                .usedAt(result.getUsedAt())
                .message(MessageUtils.getMessage("error.success"))
                .build();
    }

    public boolean isValidDynamicCodeFormat(String rawCode) {
        String normalized = normalizeShortCode(rawCode);
        if (normalized.length() < MIN_DYNAMIC_CODE_LENGTH || normalized.length() > MAX_DYNAMIC_CODE_LENGTH) {
            return false;
        }
        for (int i = 0; i < normalized.length(); i++) {
            if (CROCKFORD_ALPHABET.indexOf(normalized.charAt(i)) < 0) {
                return false;
            }
        }
        return true;
    }

    public String normalizeShortCode(String rawCode) {
        if (rawCode == null) {
            return "";
        }
        String cleaned = rawCode.trim().toUpperCase().replaceAll("[\\s-]+", "");
        StringBuilder sb = new StringBuilder(cleaned.length());
        for (int i = 0; i < cleaned.length(); i++) {
            char ch = cleaned.charAt(i);
            if (ch == 'O') {
                sb.append('0');
            } else if (ch == 'I' || ch == 'L') {
                sb.append('1');
            } else {
                sb.append(ch);
            }
        }
        return sb.toString();
    }

    // =========================================================================
    // MÃ HÓA CẶP KHÓA, NÉN CROCKFORD BASE32 & LƯU TRỮ REDIS TTL
    // =========================================================================

    private void validateRedemptionAndVoucherUsable(LoyaltyVoucherRedemptionEntity redemption, Instant now) {
        if (redemption.getStatus() != VoucherStatus.ACTIVE
                || (redemption.getExpiresAt() != null && redemption.getExpiresAt().isBefore(now))) {
            throw new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND,
                    MessageUtils.getMessage("wallet.voucher.expired_or_used"));
        }
        LoyaltyVoucherEntity voucher = redemption.getVoucher();
        if (voucher == null || voucher.getStatus() != VoucherStatus.ACTIVE
                || (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate()))
                || (voucher.getEndDate() != null && now.isAfter(voucher.getEndDate()))) {
            throw new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND,
                    MessageUtils.getMessage("wallet.voucher.expired_or_used"));
        }
    }

    private int resolveTtlSeconds(String tenantId) {
        int configured = SystemParameterService.get().getInt(tenantId, SystemParamSpec.VOUCHER_DYNAMIC_CODE_TTL_SECONDS);
        if (configured <= 0) {
            configured = LoyaltyProperties.get().getVoucher().getDynamicCodeTtlSeconds();
        }
        return configured >= MIN_TTL_SECONDS ? configured : DEFAULT_TTL_SECONDS;
    }

    private int resolveCodeLength(String tenantId) {
        int configured = SystemParameterService.get().getInt(tenantId, SystemParamSpec.VOUCHER_DYNAMIC_CODE_LENGTH);
        if (configured <= 0) {
            configured = LoyaltyProperties.get().getVoucher().getDynamicCodeLength();
        }
        if (configured < MIN_DYNAMIC_CODE_LENGTH || configured > MAX_DYNAMIC_CODE_LENGTH) {
            return DEFAULT_DYNAMIC_CODE_LENGTH;
        }
        return configured;
    }

    private KeyPair getOrInitializeKeyPair() {
        KeyPair existing = cachedKeyPair;
        if (existing != null) {
            return existing;
        }
        synchronized (this) {
            if (cachedKeyPair != null) {
                return cachedKeyPair;
            }
            KeyPair configured = loadConfiguredKeyPair();
            if (configured != null) {
                cachedKeyPair = configured;
                return configured;
            }
            if (redissonClient != null) {
                KeyPair shared = loadOrProvisionRedisKeyPair();
                cachedKeyPair = shared;
                return shared;
            }
            cachedKeyPair = generateEd25519KeyPair();
            return cachedKeyPair;
        }
    }

    private KeyPair loadConfiguredKeyPair() {
        LoyaltyProperties.Voucher cfg = LoyaltyProperties.get().getVoucher();
        if (cfg.getPublicKey() == null || cfg.getPublicKey().isBlank()
                || cfg.getPrivateKey() == null || cfg.getPrivateKey().isBlank()) {
            return null;
        }
        try {
            byte[] pubBytes = Base64.getDecoder().decode(stripPemHeaders(cfg.getPublicKey()));
            byte[] privBytes = Base64.getDecoder().decode(stripPemHeaders(cfg.getPrivateKey()));
            KeyFactory kf = KeyFactory.getInstance(KEY_PAIR_ALGORITHM);
            PublicKey pub = kf.generatePublic(new X509EncodedKeySpec(pubBytes));
            PrivateKey priv = kf.generatePrivate(new PKCS8EncodedKeySpec(privBytes));
            return new KeyPair(pub, priv);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to load configured Ed25519 voucher keypair", ex);
        }
    }

    private KeyPair loadOrProvisionRedisKeyPair() {
        try {
            RBucket<String> pubBucket = redissonClient.getBucket(RedisKeys.VOUCHER_KEYPAIR_PUBLIC);
            RBucket<String> privBucket = redissonClient.getBucket(RedisKeys.VOUCHER_KEYPAIR_PRIVATE);

            String existingPub = pubBucket.get();
            String existingPriv = privBucket.get();
            if (existingPub == null || existingPub.isBlank() || existingPriv == null || existingPriv.isBlank()) {
                KeyPair generated = generateEd25519KeyPair();
                String pubB64 = Base64.getEncoder().encodeToString(generated.getPublic().getEncoded());
                String wrappedPrivB64 = wrapKeyBytes(generated.getPrivate().getEncoded());
                pubBucket.setIfAbsent(pubB64);
                privBucket.setIfAbsent(wrappedPrivB64);
                existingPub = pubBucket.get();
                existingPriv = privBucket.get();
            }

            byte[] pubBytes = Base64.getDecoder().decode(existingPub);
            byte[] privBytes = unwrapKeyBytes(existingPriv);
            KeyFactory kf = KeyFactory.getInstance(KEY_PAIR_ALGORITHM);
            return new KeyPair(
                    kf.generatePublic(new X509EncodedKeySpec(pubBytes)),
                    kf.generatePrivate(new PKCS8EncodedKeySpec(privBytes)));
        } catch (Exception ex) {
            log.warn("[VOUCHER-KEYPAIR] Fallback to local Ed25519 keypair due to Redis error: {}", ex.getMessage());
            return generateEd25519KeyPair();
        }
    }

    private KeyPair generateEd25519KeyPair() {
        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance(KEY_PAIR_ALGORITHM);
            return kpg.generateKeyPair();
        } catch (Exception ex) {
            throw new IllegalStateException("Ed25519 KeyPairGenerator unavailable", ex);
        }
    }

    private String wrapKeyBytes(byte[] rawPrivateKey) throws Exception {
        byte[] wrapKey = deriveMasterWrapKey();
        byte[] iv = new byte[GCM_IV_BYTES];
        secureRandom.nextBytes(iv);
        Cipher cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(wrapKey, AES_ALGORITHM), new GCMParameterSpec(GCM_TAG_BITS, iv));
        byte[] ciphertext = cipher.doFinal(rawPrivateKey);
        byte[] combined = new byte[iv.length + ciphertext.length];
        System.arraycopy(iv, 0, combined, 0, iv.length);
        System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);
        return Base64.getEncoder().encodeToString(combined);
    }

    private byte[] unwrapKeyBytes(String wrappedB64) throws Exception {
        byte[] combined = Base64.getDecoder().decode(wrappedB64);
        byte[] iv = Arrays.copyOfRange(combined, 0, GCM_IV_BYTES);
        byte[] ciphertext = Arrays.copyOfRange(combined, GCM_IV_BYTES, combined.length);
        Cipher cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(deriveMasterWrapKey(), AES_ALGORITHM),
                new GCMParameterSpec(GCM_TAG_BITS, iv));
        return cipher.doFinal(ciphertext);
    }

    private byte[] deriveMasterWrapKey() throws Exception {
        String masterKey = LoyaltyProperties.get().getSecurity().getMasterKey();
        if (masterKey == null || masterKey.isBlank()) {
            String envKey = System.getenv("LOYALTY_MASTER_KEY");
            masterKey = (envKey != null && !envKey.isBlank()) ? envKey : DEFAULT_KEY_WRAP_CONTEXT;
        }
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return digest.digest((masterKey + ":" + DEFAULT_KEY_WRAP_CONTEXT).getBytes(StandardCharsets.UTF_8));
    }

    private String signWithPrivateKey(String payload, PrivateKey privateKey) {
        try {
            Signature signature = Signature.getInstance(KEY_PAIR_ALGORITHM);
            signature.initSign(privateKey);
            signature.update(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature.sign());
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to sign structured voucher payload", ex);
        }
    }

    private boolean verifyWithPublicKey(String payload, String signatureB64, PublicKey publicKey) {
        if (payload == null || signatureB64 == null || signatureB64.isBlank()) {
            return false;
        }
        try {
            Signature signature = Signature.getInstance(KEY_PAIR_ALGORITHM);
            signature.initVerify(publicKey);
            signature.update(payload.getBytes(StandardCharsets.UTF_8));
            return signature.verify(Base64.getUrlDecoder().decode(signatureB64));
        } catch (Exception ex) {
            return false;
        }
    }

    private String encryptPayload(String structuredPayload, PublicKey publicKey, String nonce) {
        try {
            byte[] aesKey = deriveEnvelopeAesKey(publicKey.getEncoded(), nonce);
            byte[] iv = new byte[GCM_IV_BYTES];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(aesKey, AES_ALGORITHM),
                    new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(structuredPayload.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(combined);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to encrypt structured voucher payload", ex);
        }
    }

    private String decryptPayload(String encryptedB64, PublicKey publicKey, String nonce) throws Exception {
        byte[] combined = Base64.getUrlDecoder().decode(encryptedB64);
        byte[] iv = Arrays.copyOfRange(combined, 0, GCM_IV_BYTES);
        byte[] ciphertext = Arrays.copyOfRange(combined, GCM_IV_BYTES, combined.length);
        byte[] aesKey = deriveEnvelopeAesKey(publicKey.getEncoded(), nonce);
        Cipher cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(aesKey, AES_ALGORITHM),
                new GCMParameterSpec(GCM_TAG_BITS, iv));
        byte[] plain = cipher.doFinal(ciphertext);
        return new String(plain, StandardCharsets.UTF_8);
    }

    private byte[] deriveEnvelopeAesKey(byte[] publicKeyBytes, String nonce) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        digest.update(publicKeyBytes);
        digest.update((byte) ':');
        digest.update(nonce.getBytes(StandardCharsets.UTF_8));
        return digest.digest();
    }

    private String allocateUniqueShortCode(
            String tenantId,
            Long redemptionId,
            String encryptedEnvelopeB64,
            String signatureB64,
            byte[] publicKeyBytes,
            int codeLength,
            String envelopeJson,
            int ttlSeconds,
            Instant expiresAt) {

        revokePreviousActiveCode(tenantId, redemptionId);

        for (int attempt = 0; attempt < MAX_COLLISION_ATTEMPTS; attempt++) {
            String candidate = compressToCrockfordBase32(
                    encryptedEnvelopeB64 + "|" + signatureB64 + "|" + attempt,
                    publicKeyBytes,
                    codeLength);
            if (trySaveCodeEnvelope(tenantId, redemptionId, candidate, envelopeJson, ttlSeconds, expiresAt)) {
                return candidate;
            }
        }
        throw new LoyaltyException(ErrorCode.SYSTEM_ERROR,
                MessageUtils.getMessage("error.system_error"));
    }

    private String compressToCrockfordBase32(String input, byte[] keyBytes, int length) {
        try {
            Mac mac = Mac.getInstance(SecurityConstants.HMAC_SHA256_ALGORITHM);
            mac.init(new SecretKeySpec(keyBytes, SecurityConstants.HMAC_SHA256_ALGORITHM));
            byte[] digest = mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
            return encodeBitsCrockfordBase32(digest, length);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to compress dynamic voucher code", ex);
        }
    }

    static String encodeBitsCrockfordBase32(byte[] digest, int length) {
        StringBuilder out = new StringBuilder(length);
        int bitBuffer = 0;
        int bitsInBuffer = 0;
        int byteIdx = 0;
        while (out.length() < length) {
            if (bitsInBuffer < 5) {
                int nextByte = byteIdx < digest.length ? (digest[byteIdx++] & 0xFF) : 0;
                bitBuffer = (bitBuffer << 8) | nextByte;
                bitsInBuffer += 8;
            }
            int shift = bitsInBuffer - 5;
            int index = (bitBuffer >> shift) & 0x1F;
            bitsInBuffer -= 5;
            out.append(CROCKFORD_ALPHABET.charAt(index));
        }
        return out.toString();
    }

    private void revokePreviousActiveCode(String tenantId, Long redemptionId) {
        if (redissonClient != null) {
            String activeKey = RedisKeys.getVoucherUseActiveKey(tenantId, redemptionId);
            RBucket<String> activeBucket = redissonClient.getBucket(activeKey);
            String previousCode = activeBucket.getAndDelete();
            if (previousCode != null && !previousCode.isBlank()) {
                redissonClient.getBucket(RedisKeys.getVoucherUseCodeKey(tenantId, previousCode)).delete();
            }
            return;
        }
        String activeKey = RedisKeys.getVoucherUseActiveKey(tenantId, redemptionId);
        String previousCode = fallbackActiveByRedemption.remove(activeKey);
        if (previousCode != null) {
            String codeKey = RedisKeys.getVoucherUseCodeKey(tenantId, previousCode);
            fallbackCodeStore.remove(codeKey);
            fallbackCodeExpiry.remove(codeKey);
        }
    }

    private boolean trySaveCodeEnvelope(
            String tenantId,
            Long redemptionId,
            String shortCode,
            String envelopeJson,
            int ttlSeconds,
            Instant expiresAt) {
        String codeKey = RedisKeys.getVoucherUseCodeKey(tenantId, shortCode);
        String activeKey = RedisKeys.getVoucherUseActiveKey(tenantId, redemptionId);
        if (redissonClient != null) {
            RBucket<String> codeBucket = redissonClient.getBucket(codeKey);
            boolean reserved = codeBucket.setIfAbsent(envelopeJson, Duration.ofSeconds(ttlSeconds));
            if (reserved) {
                redissonClient.getBucket(activeKey).set(shortCode, Duration.ofSeconds(ttlSeconds));
            }
            return reserved;
        }
        String existing = fallbackCodeStore.putIfAbsent(codeKey, envelopeJson);
        if (existing == null) {
            fallbackCodeExpiry.put(codeKey, expiresAt);
            fallbackActiveByRedemption.put(activeKey, shortCode);
            return true;
        }
        return false;
    }

    private String loadCodeEnvelope(String tenantId, String shortCode) {
        String codeKey = RedisKeys.getVoucherUseCodeKey(tenantId, shortCode);
        if (redissonClient != null) {
            RBucket<String> bucket = redissonClient.getBucket(codeKey);
            return bucket.get();
        }
        Instant exp = fallbackCodeExpiry.get(codeKey);
        if (exp != null && Instant.now().isAfter(exp)) {
            fallbackCodeStore.remove(codeKey);
            fallbackCodeExpiry.remove(codeKey);
            return null;
        }
        return fallbackCodeStore.get(codeKey);
    }

    private void deleteCodeEnvelope(String tenantId, String shortCode) {
        String codeKey = RedisKeys.getVoucherUseCodeKey(tenantId, shortCode);
        if (redissonClient != null) {
            redissonClient.getBucket(codeKey).delete();
        } else {
            fallbackCodeStore.remove(codeKey);
            fallbackCodeExpiry.remove(codeKey);
        }
    }

    private boolean consumeCodeEnvelopeAtomically(String tenantId, String shortCode, Long redemptionId) {
        String codeKey = RedisKeys.getVoucherUseCodeKey(tenantId, shortCode);
        String activeKey = RedisKeys.getVoucherUseActiveKey(tenantId, redemptionId);
        if (redissonClient != null) {
            String removed = redissonClient.<String>getBucket(codeKey).getAndDelete();
            redissonClient.getBucket(activeKey).delete();
            return removed != null && !removed.isBlank();
        }
        String removed = fallbackCodeStore.remove(codeKey);
        fallbackCodeExpiry.remove(codeKey);
        fallbackActiveByRedemption.remove(activeKey);
        return removed != null;
    }

    private String buildStructuredPayload(
            String tenantId,
            Long redemptionId,
            Long voucherId,
            String voucherCode,
            String externalUserId,
            long issuedAtEpochSec,
            long expiresAtEpochSec,
            String nonce) {
        return String.join("|",
                STRUCTURED_VERSION,
                safeSegment(tenantId),
                redemptionId != null ? String.valueOf(redemptionId) : "",
                voucherId != null ? String.valueOf(voucherId) : "",
                safeSegment(voucherCode),
                safeSegment(externalUserId),
                String.valueOf(issuedAtEpochSec),
                String.valueOf(expiresAtEpochSec),
                safeSegment(nonce));
    }

    private String safeSegment(String value) {
        return value == null ? "" : value.replace("|", "_").trim();
    }

    private String generateHexNonce() {
        byte[] bytes = new byte[NONCE_BYTES];
        secureRandom.nextBytes(bytes);
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }

    private String resolveKeyId(PublicKey publicKey) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(publicKey.getEncoded());
            StringBuilder sb = new StringBuilder(8);
            for (int i = 0; i < 4; i++) {
                sb.append(String.format("%02X", hash[i]));
            }
            return LoyaltyProperties.get().getVoucher().getKeyId() + "-" + sb;
        } catch (Exception ex) {
            return LoyaltyProperties.get().getVoucher().getKeyId();
        }
    }

    private String stripPemHeaders(String pem) {
        return pem.replaceAll("-----BEGIN [A-Z ]+-----", "")
                .replaceAll("-----END [A-Z ]+-----", "")
                .replaceAll("\\s+", "");
    }

    private String serializeEnvelope(DynamicVoucherEnvelope envelope) {
        try {
            return objectMapper.writeValueAsString(envelope);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialize voucher envelope", ex);
        }
    }

    private Long resolveRequestedPartnerId(String tenantId, Long partnerId, String partnerCode) {
        if (partnerId != null) {
            return partnerId;
        }
        if (partnerCode != null && !partnerCode.isBlank() && partnerRepository != null) {
            return partnerRepository.findByTenantIdAndPartnerCode(tenantId, partnerCode.trim())
                    .map(LoyaltyPartnerEntity::getId)
                    .orElse(null);
        }
        return null;
    }

    private String resolvePartnerName(Long partnerId) {
        if (partnerId == null || partnerRepository == null) {
            return MessageUtils.getMessage("voucher.partner.ecosystem");
        }
        return partnerRepository.findById(partnerId)
                .map(LoyaltyPartnerEntity::getPartnerName)
                .orElse(MessageUtils.getMessage("voucher.partner.ecosystem"));
    }

    private boolean matchesBranchScope(String branchScope, String requestedBranchCode) {
        if (branchScope == null || branchScope.isBlank()
                || requestedBranchCode == null || requestedBranchCode.isBlank()) {
            return true;
        }
        String target = requestedBranchCode.trim();
        for (String allowed : branchScope.split(",")) {
            if (target.equalsIgnoreCase(allowed.trim())) {
                return true;
            }
        }
        return false;
    }

    private BigDecimal calculateDiscount(String tenantId, LoyaltyVoucherEntity voucher, BigDecimal billAmount) {
        if (voucher == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal value = voucher.getDiscountValue() != null ? voucher.getDiscountValue() : BigDecimal.ZERO;
        if (billAmount == null || billAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return value;
        }
        BigDecimal discount;
        if (voucher.getDiscountType() == DiscountType.PERCENTAGE) {
            BigDecimal divisor = SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.PERCENT_DIVISOR);
            discount = billAmount.multiply(value).divide(divisor, 2, RoundingMode.HALF_UP);
            if (voucher.getMaxDiscountAmount() != null && discount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                discount = voucher.getMaxDiscountAmount();
            }
        } else {
            discount = value;
        }
        return discount.compareTo(billAmount) > 0 ? billAmount : discount;
    }

    private String formatDiscountText(LoyaltyVoucherEntity voucher) {
        if (voucher == null) {
            return MessageUtils.getMessage("voucher.default_badge");
        }
        return voucher.getDiscountType() == DiscountType.PERCENTAGE
                ? voucher.getDiscountValue() + "%"
                : voucher.getDiscountValue() + " " + CurrencyCode.HTG.getCode();
    }

    private CheckVoucherResponse invalidCheckResponse(String code, ErrorCode errorCode, String message) {
        return CheckVoucherResponse.builder()
                .valid(false)
                .dynamicCode(code)
                .errorCode(errorCode.getCode())
                .message(message)
                .remainingSeconds(0L)
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DynamicVoucherEnvelope {
        private String version;
        private String tenantId;
        private Long redemptionId;
        private Long voucherId;
        private String voucherCode;
        private String externalUserId;
        private long issuedAtEpochSec;
        private long expiresAtEpochSec;
        private String nonce;
        private String keyId;
        private String algorithm;
        private String encryptedPayload;
        private String signature;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConsumedVoucherResult {
        private LoyaltyVoucherRedemptionEntity redemption;
        private LoyaltyVoucherEntity voucher;
        private String dynamicCode;
        private String externalUserId;
        private BigDecimal discountAmount;
        private BigDecimal finalAmount;
        private Instant usedAt;
    }
}
