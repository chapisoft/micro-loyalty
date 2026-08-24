package com.natcash.loyalty.wallet.service;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;
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
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VoucherService {

    private static final Logger log = LoggerFactory.getLogger(VoucherService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("UTC"));

    private final LoyaltyVoucherRepository voucherRepository;
    private final LoyaltyVoucherRedemptionRepository redemptionRepository;
    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final DistributedLockHelper lockHelper;

    public VoucherService(LoyaltyVoucherRepository voucherRepository,
                          LoyaltyVoucherRedemptionRepository redemptionRepository,
                          LoyaltyAccountRepository accountRepository,
                          LoyaltyPointLedgerRepository ledgerRepository,
                          DistributedLockHelper lockHelper) {
        this.voucherRepository = voucherRepository;
        this.redemptionRepository = redemptionRepository;
        this.accountRepository = accountRepository;
        this.ledgerRepository = ledgerRepository;
        this.lockHelper = lockHelper;
    }

    @Transactional(readOnly = true)
    public List<VoucherResponse> getAllVouchers(String tenantId) {
        List<LoyaltyVoucherEntity> vouchers = voucherRepository.findByTenantId(tenantId);
        return vouchers.stream().map(this::mapToVoucherResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserVoucherResponse> getUserVouchers(String tenantId, String externalUserId, String status) {
        LoyaltyAccountEntity account = accountRepository.findByTenantIdAndExternalUserId(tenantId, externalUserId)
                .orElse(null);

        if (account == null) {
            return new ArrayList<>();
        }

        List<LoyaltyVoucherRedemptionEntity> redemptions = redemptionRepository.findByTenantIdAndAccount_Id(tenantId, account.getId());

        return redemptions.stream()
                .filter(r -> status == null || status.equalsIgnoreCase("ALL") || r.getStatus().name().equalsIgnoreCase(status))
                .map(r -> {
                    LoyaltyVoucherEntity v = r.getVoucher();
                    String title = v != null ? v.getTitle() : "Phiếu Ưu Đãi";
                    String discountText = v != null
                            ? (v.getDiscountType() == DiscountType.PERCENTAGE ? v.getDiscountValue() + "%" : v.getDiscountValue() + " HTG")
                            : "Ưu đãi";
                    String minOrder = v != null ? "Áp dụng cho hóa đơn từ " + v.getMinBillAmount() + " HTG" : "Không giới hạn";
                    String partnerName = v != null && v.getVoucherCode().contains("DELIMART")
                            ? "Delimart Supermarket"
                            : (v != null && v.getVoucherCode().contains("NATCOM") ? "Natcom Telecom" : "Đối tác Liên Minh");
                    String category = v != null && v.getVoucherCode().contains("DELIMART")
                            ? "DELIMART"
                            : (v != null && v.getVoucherCode().contains("NATCOM") ? "NATCOM" : "ENTERTAINMENT");

                    return UserVoucherResponse.builder()
                            .id(r.getId())
                            .code(r.getRedemptionCode())
                            .title(title)
                            .partnerName(partnerName)
                            .category(category)
                            .discountText(discountText)
                            .minOrder(minOrder)
                            .validUntil(DATE_FORMATTER.format(r.getExpiresAt()))
                            .status(r.getStatus().name())
                            .terms(v != null ? v.getDescription() : "Áp dụng theo thể lệ chương trình.")
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public VoucherResponse createVoucher(String tenantId, CreateVoucherRequest request) {
        LoyaltyVoucherEntity entity = LoyaltyVoucherEntity.builder()
                .tenantId(tenantId)
                .partnerId(request.getPartnerId() != null ? request.getPartnerId() : 1L)
                .voucherCode(request.getVoucherCode() != null ? request.getVoucherCode() : "VCH_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .title(request.getTitle())
                .description(request.getDescription())
                .discountType(request.getDiscountType() != null ? request.getDiscountType() : DiscountType.FIXED_AMOUNT)
                .discountValue(request.getDiscountValue() != null ? request.getDiscountValue() : BigDecimal.ZERO)
                .minBillAmount(request.getMinBillAmount() != null ? request.getMinBillAmount() : BigDecimal.ZERO)
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .totalQuantity(request.getTotalQuantity() != null ? request.getTotalQuantity() : 1000)
                .availableQuantity(request.getTotalQuantity() != null ? request.getTotalQuantity() : 1000)
                .pointCost(request.getPointCost() != null ? request.getPointCost() : BigDecimal.ZERO)
                .startDate(Instant.now())
                .endDate(Instant.now().plusSeconds(90L * 86400L))
                .status(VoucherStatus.ACTIVE)
                .build();

        LoyaltyVoucherEntity saved = voucherRepository.save(entity);
        return mapToVoucherResponse(saved);
    }

    @Transactional
    public UserVoucherResponse redeemVoucher(String tenantId, RedeemVoucherRequest request) {
        String lockKey = "lock:voucher:redeem:" + tenantId + ":" + request.getExternalUserId();
        return lockHelper.executeWithLock(lockKey, 3000, 5000, () -> {
            LoyaltyAccountEntity account = accountRepository.findByTenantIdAndExternalUserId(tenantId, request.getExternalUserId())
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND, "Không tìm thấy tài khoản"));

            LoyaltyVoucherEntity voucher = voucherRepository.findByTenantIdAndVoucherCode(tenantId, request.getVoucherCode())
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND, "Không tìm thấy voucher"));

            if (voucher.getAvailableQuantity() <= 0) {
                throw new LoyaltyException(ErrorCode.VOUCHER_OUT_OF_STOCK, "Voucher đã hết số lượng");
            }

            if (account.getCurrentPoints().compareTo(voucher.getPointCost()) < 0) {
                throw new LoyaltyException(ErrorCode.INSUFFICIENT_POINTS, "Số dư điểm không đủ để đổi voucher");
            }

            // Deduct points
            account.setCurrentPoints(account.getCurrentPoints().subtract(voucher.getPointCost()));
            accountRepository.save(account);

            // Record point ledger
            LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                    .tenantId(tenantId)
                    .account(account)
                    .pointChange(voucher.getPointCost().negate())
                    .balanceAfter(account.getCurrentPoints())
                    .changeType(PointActionType.BURN)
                    .referenceCode("REDEEM_VCH_" + UUID.randomUUID().toString().substring(0, 8))
                    .description("Đổi điểm nhận voucher: " + voucher.getTitle())
                    .build();
            ledgerRepository.save(ledger);

            // Deduct voucher quantity
            voucher.setAvailableQuantity(voucher.getAvailableQuantity() - 1);
            voucherRepository.save(voucher);

            // Create redemption
            String redemptionCode = voucher.getVoucherCode() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            LoyaltyVoucherRedemptionEntity redemption = LoyaltyVoucherRedemptionEntity.builder()
                    .tenantId(tenantId)
                    .account(account)
                    .voucher(voucher)
                    .redemptionCode(redemptionCode)
                    .pointsUsed(voucher.getPointCost())
                    .status(VoucherStatus.ACTIVE)
                    .expiresAt(Instant.now().plusSeconds(30L * 86400L))
                    .build();
            LoyaltyVoucherRedemptionEntity savedRedemption = redemptionRepository.save(redemption);
            log.info("[VOUCHER-REDEEM-SUCCESS] tenantId={}, user={}, voucher={}", tenantId, request.getExternalUserId(), voucher.getVoucherCode());

            return UserVoucherResponse.builder()
                    .id(savedRedemption.getId())
                    .code(savedRedemption.getRedemptionCode())
                    .title(voucher.getTitle())
                    .discountText(voucher.getDiscountValue() + " HTG")
                    .minOrder("Hóa đơn từ " + voucher.getMinBillAmount() + " HTG")
                    .validUntil(DATE_FORMATTER.format(savedRedemption.getExpiresAt()))
                    .status("AVAILABLE")
                    .terms(voucher.getDescription())
                    .build();
        });
    }

    private VoucherResponse mapToVoucherResponse(LoyaltyVoucherEntity v) {
        return VoucherResponse.builder()
                .id(v.getId())
                .voucherCode(v.getVoucherCode())
                .title(v.getTitle())
                .description(v.getDescription())
                .partnerId(v.getPartnerId())
                .partnerName(v.getVoucherCode().contains("DELIMART") ? "Siêu Thị Delimart" : "Natcom Telecom")
                .discountType(v.getDiscountType())
                .discountValue(v.getDiscountValue())
                .minBillAmount(v.getMinBillAmount())
                .maxDiscountAmount(v.getMaxDiscountAmount())
                .totalQuantity(v.getTotalQuantity())
                .availableQuantity(v.getAvailableQuantity())
                .pointCost(v.getPointCost())
                .startDate(v.getStartDate())
                .endDate(v.getEndDate())
                .status(v.getStatus())
                .build();
    }
}
