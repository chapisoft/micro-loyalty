package com.natcash.loyalty.wallet.service;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.codegeneration.domain.CodeType;
import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.CurrencyCode;
import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.util.MessageUtils;
import com.natcash.loyalty.wallet.dto.VoucherDto.CreateVoucherRequest;
import com.natcash.loyalty.wallet.dto.VoucherDto.RedeemVoucherRequest;
import com.natcash.loyalty.wallet.dto.VoucherDto.UserVoucherResponse;
import com.natcash.loyalty.wallet.dto.VoucherDto.VoucherResponse;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherRedemptionEntity;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRedemptionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.Arrays;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class VoucherService {

    private static final Logger log = LoggerFactory.getLogger(VoucherService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy")
            .withZone(ZoneId.of("UTC"));

    private final LoyaltyVoucherRepository voucherRepository;
    private final LoyaltyVoucherRedemptionRepository redemptionRepository;
    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyPartnerRepository partnerRepository;
    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final DistributedLockHelper lockHelper;

    public VoucherService(LoyaltyVoucherRepository voucherRepository,
            LoyaltyVoucherRedemptionRepository redemptionRepository,
            LoyaltyAccountRepository accountRepository,
            LoyaltyPartnerRepository partnerRepository,
            LoyaltyPointLedgerRepository ledgerRepository,
            DistributedLockHelper lockHelper) {
        this.voucherRepository = voucherRepository;
        this.redemptionRepository = redemptionRepository;
        this.accountRepository = accountRepository;
        this.partnerRepository = partnerRepository;
        this.ledgerRepository = ledgerRepository;
        this.lockHelper = lockHelper;
    }

    @Transactional(readOnly = true)
    public List<VoucherResponse> getAllVouchers(String tenantId) {
        return getAllVouchers(tenantId, null);
    }

    /** `audience` = CUSTOMER / AGENT / SUPER_AGENT for the webview; null = every voucher (CMS, Partner portal). */
    @Transactional(readOnly = true)
    public List<VoucherResponse> getAllVouchers(String tenantId, String audience) {
        List<LoyaltyVoucherEntity> vouchers = voucherRepository.findByTenantId(tenantId);
        return vouchers.stream()
                .filter(v -> audience == null || audience.isBlank() || audience.equalsIgnoreCase(v.getAudienceRole()))
                .map(this::mapToVoucherResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserVoucherResponse> getUserVouchers(String tenantId, String externalUserId, String status) {
        LoyaltyAccountEntity account = accountRepository.findByTenantIdAndExternalUserId(tenantId, externalUserId)
                .orElse(null);

        if (account == null) {
            return new ArrayList<>();
        }

        List<LoyaltyVoucherRedemptionEntity> redemptions = redemptionRepository.findByTenantIdAndAccount_Id(tenantId,
                account.getId());

        return redemptions.stream()
                .filter(r -> status == null || status.equalsIgnoreCase(LoyaltyConstants.FILTER_ALL)
                        || r.getStatus().name().equalsIgnoreCase(status))
                .map(r -> {
                    LoyaltyVoucherEntity v = r.getVoucher();
                    String title = v != null ? v.getTitle() : MessageUtils.getMessage("voucher.default_title");
                    String discountText = v != null
                            ? (v.getDiscountType() == DiscountType.PERCENTAGE ? v.getDiscountValue() + "%"
                                    : v.getDiscountValue() + " " + CurrencyCode.HTG.getCode())
                            : MessageUtils.getMessage("voucher.default_badge");
                    String minOrder = v != null ? MessageUtils.getMessage("voucher.min_order", v.getMinBillAmount())
                            : MessageUtils.getMessage("voucher.no_limit");

                    String partnerName = MessageUtils.getMessage("voucher.partner.ecosystem");
                    String category = "ALLIANCE";
                    if (v != null && v.getPartnerId() != null) {
                        Optional<LoyaltyPartnerEntity> partnerOpt = partnerRepository.findById(v.getPartnerId());
                        if (partnerOpt.isPresent()) {
                            partnerName = partnerOpt.get().getPartnerName();
                            category = partnerOpt.get().getPartnerCode();
                        }
                    }

                    return UserVoucherResponse.builder()
                            .id(r.getId())
                            .code(r.getRedemptionCode())
                            .title(title)
                            .partnerName(partnerName)
                            .category(category)
                            .discountText(discountText)
                            .minOrder(minOrder)
                            .validUntil(DATE_FORMATTER.format(r.getExpiresAt()))
                            .expiresAt(r.getExpiresAt())
                            .status(r.getStatus().name())
                            .terms(v != null ? v.getDescription() : MessageUtils.getMessage("voucher.default_terms"))
                            .voucherId(v != null ? v.getId() : null)
                            .voucherCode(v != null ? v.getVoucherCode() : null)
                            .acquireType(v != null ? v.getAcquireType() : null)
                            .usageType(v != null ? v.getUsageType() : null)
                            .serviceLink(v != null ? v.getServiceLink() : null)
                            .imageUrl(v != null ? v.getImageUrl() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public VoucherResponse createVoucher(String tenantId, CreateVoucherRequest request) {
        String code = request.getVoucherCode() != null && !request.getVoucherCode().isBlank()
                ? request.getVoucherCode().toUpperCase().trim()
                : CentralizedCodeGeneratorService.get().generateCode(CodeType.VOUCHER_CODE);

        Optional<LoyaltyVoucherEntity> existingOpt = voucherRepository.findByTenantIdAndVoucherCode(tenantId, code);
        LoyaltyVoucherEntity entity;
        if (existingOpt.isPresent()) {
            entity = existingOpt.get();
        } else {
            Instant start = request.getStartDate() != null ? request.getStartDate() : Instant.now();
            Instant end = request.getEndDate() != null ? request.getEndDate() : Instant.now().plusSeconds(90L * 86400L);
            entity = LoyaltyVoucherEntity.builder()
                    .tenantId(tenantId)
                    .voucherCode(code)
                    .startDate(start)
                    .endDate(end)
                    .status(request.getStatus() != null ? request.getStatus() : VoucherStatus.ACTIVE)
                    .build();
        }

        // Xử lý an toàn partnerId: Không gán cứng, kiểm tra tính hợp lệ
        Long partnerId = resolvePartnerId(tenantId, request.getPartnerId(), request.getPartnerCode());
        entity.setPartnerId(partnerId);

        entity.setTitle(request.getTitle() != null ? request.getTitle() : code);
        entity.setDescription(request.getDescription());
        entity.setDiscountType(
                request.getDiscountType() != null ? request.getDiscountType() : DiscountType.FIXED_AMOUNT);
        entity.setDiscountValue(request.getDiscountValue() != null ? request.getDiscountValue() : BigDecimal.ZERO);
        entity.setMinBillAmount(request.getMinBillAmount() != null ? request.getMinBillAmount() : BigDecimal.ZERO);
        entity.setMaxDiscountAmount(request.getMaxDiscountAmount());

        int totalQty = request.getTotalQuantity() != null ? request.getTotalQuantity() : 1000;
        entity.setTotalQuantity(totalQty);
        if (existingOpt.isEmpty() || entity.getAvailableQuantity() == null || entity.getAvailableQuantity() == 0) {
            entity.setAvailableQuantity(totalQty);
        }

        entity.setPointCost(request.getPointCost() != null ? request.getPointCost() : BigDecimal.ZERO);
        if (request.getStartDate() != null)
            entity.setStartDate(request.getStartDate());
        if (request.getEndDate() != null)
            entity.setEndDate(request.getEndDate());
        if (request.getStatus() != null)
            entity.setStatus(request.getStatus());
        applyGetAndUse(entity, request);

        LoyaltyVoucherEntity saved = voucherRepository.save(entity);
        return mapToVoucherResponse(saved);
    }

    @Transactional
    public UserVoucherResponse redeemVoucher(String tenantId, RedeemVoucherRequest request) {
        String lockKey = RedisKeys.getVoucherRedeemLockKey(tenantId, request.getExternalUserId());
        SystemParameterService paramService = SystemParameterService.get();
        long waitTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_BURN_TIMEOUT_MS);
        long shortLeaseMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_SHORT_LEASE_MS);
        int validityDays = paramService.getInt(tenantId, SystemParamSpec.VOUCHER_DEFAULT_VALIDITY_DAYS);
        return lockHelper.executeWithLock(lockKey, waitTimeMs, shortLeaseMs, () -> {
            LoyaltyAccountEntity account = accountRepository.findByTenantIdAndExternalUserId(tenantId, request.getExternalUserId())
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND, MessageUtils.getMessage("voucher.account_not_found")));

            LoyaltyVoucherEntity voucher = voucherRepository.findByTenantIdAndVoucherCode(tenantId, request.getVoucherCode())
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND, MessageUtils.getMessage("voucher.not_found")));

            if (voucher.getAcquireType() != null && !ACQUIRE_COINS.equals(voucher.getAcquireType())) {
                // free vouchers use POST /{code}/collect; "given" vouchers come only from missions, games or campaigns
                throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Voucher " + voucher.getVoucherCode() + " is not sold for coins");
            }
            if (voucher.getAvailableQuantity() <= 0) {
                throw new LoyaltyException(ErrorCode.VOUCHER_OUT_OF_STOCK, MessageUtils.getMessage("voucher.out_of_stock"));
            }

            if (account.getCurrentPoints().compareTo(voucher.getPointCost()) < 0) {
                throw new LoyaltyException(ErrorCode.INSUFFICIENT_POINTS, MessageUtils.getMessage("voucher.insufficient_points"));
            }

            // Deduct points
            account.setCurrentPoints(account.getCurrentPoints().subtract(voucher.getPointCost()));
            accountRepository.save(account);

            Long partnerId = voucher.getPartnerId();

            // Record point ledger
            LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                    .tenantId(tenantId)
                    .account(account)
                    .pointChange(voucher.getPointCost().negate())
                    .balanceAfter(account.getCurrentPoints())
                    .changeType(PointActionType.BURN)
                    .referenceCode(CentralizedCodeGeneratorService.get().generateCode(CodeType.VOUCHER_REDEEM))
                    .partnerId(partnerId)
                    .description(MessageUtils.getMessage("voucher.redeem.ledger_desc", voucher.getTitle()))
                    .build();
            ledgerRepository.save(ledger);

            // Deduct voucher quantity
            voucher.setAvailableQuantity(voucher.getAvailableQuantity() - 1);
            voucherRepository.save(voucher);

            // Create redemption
            String redemptionCode = CentralizedCodeGeneratorService.get().generateCode(
                    CodeType.VOUCHER_REDEMPTION_CODE,
                    Map.of("scope", voucher.getVoucherCode()));
            LoyaltyVoucherRedemptionEntity redemption = LoyaltyVoucherRedemptionEntity.builder()
                    .tenantId(tenantId)
                    .account(account)
                    .voucher(voucher)
                    .redemptionCode(redemptionCode)
                    .pointsUsed(voucher.getPointCost())
                    .status(VoucherStatus.ACTIVE)
                    .expiresAt(Instant.now().plusSeconds((long) validityDays * 86400L))
                    .build();
            LoyaltyVoucherRedemptionEntity savedRedemption = redemptionRepository.save(redemption);
            log.info("[VOUCHER-REDEEM-SUCCESS] tenantId={}, user={}, voucher={}", tenantId, request.getExternalUserId(), voucher.getVoucherCode());

            return UserVoucherResponse.builder()
                    .id(savedRedemption.getId())
                    .code(savedRedemption.getRedemptionCode())
                    .title(voucher.getTitle())
                    .discountText(voucher.getDiscountValue() + " " + CurrencyCode.HTG.getCode())
                    .minOrder(MessageUtils.getMessage("voucher.min_order", voucher.getMinBillAmount()))
                    .validUntil(DATE_FORMATTER.format(savedRedemption.getExpiresAt()))
                    .expiresAt(savedRedemption.getExpiresAt())
                    .status("AVAILABLE")
                    .terms(voucher.getDescription())
                    .voucherId(voucher.getId())
                    .voucherCode(voucher.getVoucherCode())
                    .acquireType(voucher.getAcquireType())
                    .usageType(voucher.getUsageType())
                    .serviceLink(voucher.getServiceLink())
                    .imageUrl(voucher.getImageUrl())
                    .build();
        });
    }

    /**
     * Collect a free voucher (Figma 18/11 "Free – collect"): no coins, reserved on collect so it is never sold out at the counter,
     * `perCustomerLimit` per batch, tier-restricted when `eligibleTiers` is set, valid `validDaysAfterCollect` days.
     */
    @Transactional
    public UserVoucherResponse collectVoucher(String tenantId, String externalUserId, String voucherCode) {
        String lockKey = RedisKeys.getVoucherRedeemLockKey(tenantId, externalUserId);
        SystemParameterService paramService = SystemParameterService.get();
        long waitTimeMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_BURN_TIMEOUT_MS);
        long shortLeaseMs = paramService.getLong(tenantId, SystemParamSpec.REDISSON_LOCK_SHORT_LEASE_MS);
        int defaultDays = paramService.getInt(tenantId, SystemParamSpec.VOUCHER_DEFAULT_VALIDITY_DAYS);
        return lockHelper.executeWithLock(lockKey, waitTimeMs, shortLeaseMs, () -> {
            LoyaltyAccountEntity account = accountRepository.findByTenantIdAndExternalUserId(tenantId, externalUserId)
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND, MessageUtils.getMessage("voucher.account_not_found")));
            LoyaltyVoucherEntity voucher = voucherRepository.findByTenantIdAndVoucherCode(tenantId, voucherCode)
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND, MessageUtils.getMessage("voucher.not_found")));
            Instant now = Instant.now();

            if (!ACQUIRE_FREE.equals(voucher.getAcquireType())) {
                throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Voucher " + voucherCode + " is not free to collect");
            }
            if (voucher.getStatus() != VoucherStatus.ACTIVE || now.isBefore(voucher.getStartDate()) || now.isAfter(voucher.getEndDate())) {
                throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Voucher " + voucherCode + " is not open now");
            }
            List<String> tiers = splitCsv(voucher.getEligibleTiers());
            String tier = account.getTier() != null && account.getTier().getCode() != null ? account.getTier().getCode().name() : "";
            if (!tiers.isEmpty() && !tiers.contains(tier)) {
                throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Voucher " + voucherCode + " is for " + String.join(", ", tiers) + " members");
            }
            // shortcut: eKYC status is not stored in loyalty-service (it lives in the Natcash wallet / WSO2); enforce
            // require_ekyc + FREE_VOUCHER_REQUIRE_EKYC once the account carries the eKYC flag (plan GĐ1, integration tier).

            refreshBatch(voucher, now);
            Instant since = batchStart(voucher.getBatchPeriod(), now);
            long already = redemptionRepository.countByAccount_IdAndVoucher_IdAndCreatedAtAfter(account.getId(), voucher.getId(),
                    since != null ? since : Instant.EPOCH);
            int limit = voucher.getPerCustomerLimit() != null && voucher.getPerCustomerLimit() > 0 ? voucher.getPerCustomerLimit() : 1;
            if (already >= limit) {
                throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE, "LIMIT: voucher " + voucherCode + " already collected");
            }
            if (voucher.getAvailableQuantity() <= 0) {
                throw new LoyaltyException(ErrorCode.VOUCHER_OUT_OF_STOCK, MessageUtils.getMessage("voucher.out_of_stock"));
            }

            voucher.setAvailableQuantity(voucher.getAvailableQuantity() - 1); // reserved on collect
            voucherRepository.save(voucher);

            int days = voucher.getValidDaysAfterCollect() != null && voucher.getValidDaysAfterCollect() > 0 ? voucher.getValidDaysAfterCollect() : defaultDays;
            Instant expires = now.plus(days, ChronoUnit.DAYS);
            LoyaltyVoucherRedemptionEntity saved = redemptionRepository.save(LoyaltyVoucherRedemptionEntity.builder()
                    .tenantId(tenantId)
                    .account(account)
                    .voucher(voucher)
                    .redemptionCode(CentralizedCodeGeneratorService.get().generateCode(CodeType.VOUCHER_REDEMPTION_CODE, Map.of("scope", voucher.getVoucherCode())))
                    .pointsUsed(BigDecimal.ZERO)
                    .status(VoucherStatus.ACTIVE)
                    .expiresAt(expires)
                    .build());
            log.info("[VOUCHER-COLLECT-SUCCESS] tenantId={}, user={}, voucher={}", tenantId, externalUserId, voucherCode);

            return UserVoucherResponse.builder()
                    .id(saved.getId())
                    .code(saved.getRedemptionCode())
                    .title(voucher.getTitle())
                    .discountText(voucher.getDiscountType() == DiscountType.PERCENTAGE ? voucher.getDiscountValue() + "%"
                            : voucher.getDiscountValue() + " " + CurrencyCode.HTG.getCode())
                    .minOrder(MessageUtils.getMessage("voucher.min_order", voucher.getMinBillAmount()))
                    .validUntil(DATE_FORMATTER.format(expires))
                    .expiresAt(expires)
                    .status(VoucherStatus.ACTIVE.name())
                    .terms(voucher.getDescription())
                    .voucherId(voucher.getId())
                    .voucherCode(voucher.getVoucherCode())
                    .acquireType(voucher.getAcquireType())
                    .usageType(voucher.getUsageType())
                    .serviceLink(voucher.getServiceLink())
                    .imageUrl(voucher.getImageUrl())
                    .build();
        });
    }

    static final String ACQUIRE_COINS = "COINS";
    static final String ACQUIRE_FREE = "FREE_COLLECT";
    private static final List<String> ACQUIRE_TYPES = List.of(ACQUIRE_COINS, ACQUIRE_FREE, "GIVEN");
    private static final List<String> USAGE_TYPES = List.of("NATCASH_STORE", "PARTNER_CODE", "ONLINE");
    private static final List<String> AUDIENCES = List.of("CUSTOMER", "AGENT", "SUPER_AGENT");
    private static final List<String> BATCH_PERIODS = List.of("NONE", "DAILY", "WEEKLY");

    /** Start of the current free-voucher batch (UTC): today 00:00 for DAILY, Monday 00:00 for WEEKLY, null for NONE. */
    static Instant batchStart(String period, Instant now) {
        if ("DAILY".equals(period)) {
            return now.truncatedTo(ChronoUnit.DAYS);
        }
        if ("WEEKLY".equals(period)) {
            return now.atZone(ZoneOffset.UTC).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).truncatedTo(ChronoUnit.DAYS).toInstant();
        }
        return null;
    }

    /** Opens a new batch lazily on the first collect after the period rolls over (no scheduler needed). */
    static boolean refreshBatch(LoyaltyVoucherEntity v, Instant now) {
        Instant start = batchStart(v.getBatchPeriod(), now);
        if (start == null || v.getBatchQuantity() == null) {
            return false;
        }
        if (v.getBatchStartedAt() == null || v.getBatchStartedAt().isBefore(start)) {
            v.setBatchStartedAt(start);
            v.setAvailableQuantity(v.getBatchQuantity());
            return true;
        }
        return false;
    }

    private static List<String> splitCsv(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        return Arrays.stream(csv.split(",")).map(String::trim).filter(x -> !x.isEmpty()).map(String::toUpperCase).collect(Collectors.toList());
    }

    private static String pick(String value, List<String> allowed, String field) {
        String v = value.trim().toUpperCase();
        if (!allowed.contains(v)) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, field + " must be one of " + allowed);
        }
        return v;
    }

    /** Fields of the CMS VQ-04 "How to get" / "How to use" sections; null = keep the current value. */
    private void applyGetAndUse(LoyaltyVoucherEntity e, CreateVoucherRequest r) {
        if (r.getAcquireType() != null) e.setAcquireType(pick(r.getAcquireType(), ACQUIRE_TYPES, "acquireType"));
        if (r.getUsageType() != null) e.setUsageType(pick(r.getUsageType(), USAGE_TYPES, "usageType"));
        if (r.getAudienceRole() != null) e.setAudienceRole(pick(r.getAudienceRole(), AUDIENCES, "audienceRole"));
        if (r.getBatchPeriod() != null) e.setBatchPeriod(pick(r.getBatchPeriod(), BATCH_PERIODS, "batchPeriod"));
        if (r.getCategoryCode() != null) e.setCategoryCode(r.getCategoryCode().isBlank() ? null : r.getCategoryCode().trim().toUpperCase());
        if (r.getEligibleTiers() != null) e.setEligibleTiers(r.getEligibleTiers().isEmpty() ? null : String.join(",", r.getEligibleTiers()).toUpperCase());
        if (r.getPerCustomerLimit() != null) e.setPerCustomerLimit(Math.max(1, r.getPerCustomerLimit()));
        if (r.getBatchQuantity() != null) e.setBatchQuantity(r.getBatchQuantity() > 0 ? r.getBatchQuantity() : null);
        if (r.getValidDaysAfterCollect() != null) e.setValidDaysAfterCollect(r.getValidDaysAfterCollect() > 0 ? r.getValidDaysAfterCollect() : null);
        if (r.getRequireEkyc() != null) e.setRequireEkyc(r.getRequireEkyc());
        if (r.getShowInFreeStrip() != null) e.setShowInFreeStrip(r.getShowInFreeStrip());
        if (r.getStripOrder() != null) e.setStripOrder(r.getStripOrder());
        if (r.getServiceLink() != null) e.setServiceLink(r.getServiceLink().isBlank() ? null : r.getServiceLink().trim());
        if (r.getBranchScope() != null) e.setBranchScope(r.getBranchScope().isBlank() ? null : r.getBranchScope().trim());
        if (r.getImageUrl() != null) e.setImageUrl(r.getImageUrl().isBlank() ? null : r.getImageUrl().trim());
        if (r.getI18nJson() != null) e.setI18nJson(r.getI18nJson().isBlank() ? null : r.getI18nJson());
        if (ACQUIRE_FREE.equals(e.getAcquireType())) {
            e.setPointCost(BigDecimal.ZERO);
        }
        if ("ONLINE".equals(e.getUsageType()) && (e.getServiceLink() == null || e.getServiceLink().isBlank())) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, "serviceLink is required for online vouchers");
        }
    }

    @Transactional
    public VoucherResponse updateVoucher(String tenantId, Long id, CreateVoucherRequest request) {
        LoyaltyVoucherEntity entity = voucherRepository.findById(id)
                .filter(v -> v.getTenantId().equals(tenantId))
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND,
                        MessageUtils.getMessage("voucher.not_found_id", id)));

        // Cập nhật partnerId nếu được cung cấp
        if (request.getPartnerId() != null || request.getPartnerCode() != null) {
            Long partnerId = resolvePartnerId(tenantId, request.getPartnerId(), request.getPartnerCode());
            entity.setPartnerId(partnerId);
        }

        if (request.getTitle() != null)
            entity.setTitle(request.getTitle());
        if (request.getDescription() != null)
            entity.setDescription(request.getDescription());
        if (request.getDiscountType() != null)
            entity.setDiscountType(request.getDiscountType());
        if (request.getDiscountValue() != null)
            entity.setDiscountValue(request.getDiscountValue());
        if (request.getMinBillAmount() != null)
            entity.setMinBillAmount(request.getMinBillAmount());
        if (request.getMaxDiscountAmount() != null)
            entity.setMaxDiscountAmount(request.getMaxDiscountAmount());
        if (request.getPointCost() != null)
            entity.setPointCost(request.getPointCost());
        if (request.getStartDate() != null)
            entity.setStartDate(request.getStartDate());
        if (request.getEndDate() != null)
            entity.setEndDate(request.getEndDate());
        if (request.getStatus() != null)
            entity.setStatus(request.getStatus());

        if (request.getTotalQuantity() != null) {
            int diff = request.getTotalQuantity() - entity.getTotalQuantity();
            entity.setTotalQuantity(request.getTotalQuantity());
            entity.setAvailableQuantity(Math.max(0, entity.getAvailableQuantity() + diff));
        }
        applyGetAndUse(entity, request);

        LoyaltyVoucherEntity updated = voucherRepository.save(entity);
        return mapToVoucherResponse(updated);
    }

    @Transactional
    public void deleteVoucher(String tenantId, Long id) {
        voucherRepository.findById(id)
                .filter(v -> v.getTenantId().equals(tenantId))
                .ifPresent(voucherRepository::delete);
    }

    @Transactional
    public List<VoucherResponse> batchImportVouchers(String tenantId, List<CreateVoucherRequest> requests) {
        List<VoucherResponse> responses = new ArrayList<>();
        if (requests == null || requests.isEmpty()) {
            return responses;
        }
        for (CreateVoucherRequest req : requests) {
            responses.add(createVoucher(tenantId, req));
        }
        return responses;
    }

    private Long resolvePartnerId(String tenantId, Long partnerId, String partnerCode) {
        if (partnerId != null) {
            Optional<LoyaltyPartnerEntity> partnerOpt = partnerRepository.findById(partnerId);
            if (partnerOpt.isPresent()) {
                return partnerOpt.get().getId();
            }
            throw new LoyaltyException(ErrorCode.NOT_FOUND,
                    MessageUtils.getMessage("partner.not_found_alliance", partnerId));
        }

        if (partnerRepository != null && partnerCode != null && !partnerCode.isBlank()
                && !LoyaltyConstants.FILTER_ALL.equalsIgnoreCase(partnerCode.trim())) {
            Optional<LoyaltyPartnerEntity> partnerOpt = partnerRepository.findByTenantIdAndPartnerCode(tenantId,
                    partnerCode.trim().toUpperCase());
            if (partnerOpt.isPresent()) {
                return partnerOpt.get().getId();
            }
        }

        return null; // Voucher toàn hệ sinh thái (Áp dụng tất cả đối tác trong liên minh)
    }

    private VoucherResponse mapToVoucherResponse(LoyaltyVoucherEntity v) {
        String partnerName = MessageUtils.getMessage("voucher.partner.ecosystem_all");
        String partnerCode = "ALL";

        if (v.getPartnerId() != null) {
            Optional<LoyaltyPartnerEntity> partnerOpt = partnerRepository.findById(v.getPartnerId());
            if (partnerOpt.isPresent()) {
                partnerName = partnerOpt.get().getPartnerName();
                partnerCode = partnerOpt.get().getPartnerCode();
            } else {
                partnerName = MessageUtils.getMessage("clearing.partner.fallback_name", v.getPartnerId());
                partnerCode = "PARTNER_" + v.getPartnerId();
            }
        }

        // a free voucher whose period rolled over shows its new batch before the first collect opens it
        Integer available = v.getAvailableQuantity();
        Instant start = batchStart(v.getBatchPeriod(), Instant.now());
        if (start != null && v.getBatchQuantity() != null && (v.getBatchStartedAt() == null || v.getBatchStartedAt().isBefore(start))) {
            available = v.getBatchQuantity();
        }

        return VoucherResponse.builder()
                .id(v.getId())
                .voucherCode(v.getVoucherCode())
                .title(v.getTitle())
                .description(v.getDescription())
                .partnerId(v.getPartnerId())
                .partnerCode(partnerCode)
                .partnerName(partnerName)
                .discountType(v.getDiscountType())
                .discountValue(v.getDiscountValue())
                .minBillAmount(v.getMinBillAmount())
                .maxDiscountAmount(v.getMaxDiscountAmount())
                .totalQuantity(v.getTotalQuantity())
                .availableQuantity(available)
                .pointCost(v.getPointCost())
                .startDate(v.getStartDate())
                .endDate(v.getEndDate())
                .status(v.getStatus())
                .acquireType(v.getAcquireType())
                .usageType(v.getUsageType())
                .categoryCode(v.getCategoryCode())
                .audienceRole(v.getAudienceRole())
                .eligibleTiers(splitCsv(v.getEligibleTiers()))
                .perCustomerLimit(v.getPerCustomerLimit())
                .batchQuantity(v.getBatchQuantity())
                .batchPeriod(v.getBatchPeriod())
                .validDaysAfterCollect(v.getValidDaysAfterCollect())
                .requireEkyc(v.getRequireEkyc())
                .showInFreeStrip(v.getShowInFreeStrip())
                .stripOrder(v.getStripOrder())
                .serviceLink(v.getServiceLink())
                .branchScope(v.getBranchScope())
                .imageUrl(v.getImageUrl())
                .i18nJson(v.getI18nJson())
                .build();
    }
}
