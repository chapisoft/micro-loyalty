package com.natcash.loyalty.wallet.service;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.RedisKeys;
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
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VoucherService {

    private static final Logger log = LoggerFactory.getLogger(VoucherService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("UTC"));

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

    @Transactional
    public List<VoucherResponse> getAllVouchers(String tenantId) {
        List<LoyaltyVoucherEntity> vouchers = voucherRepository.findByTenantId(tenantId);
        if (vouchers.isEmpty()) {
            vouchers = seedDefaultVouchers(tenantId);
        }
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
                    
                    String partnerName = "Toàn Hệ Sinh Thái";
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
                            .status(r.getStatus().name())
                            .terms(v != null ? v.getDescription() : "Áp dụng theo thể lệ chương trình.")
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public VoucherResponse createVoucher(String tenantId, CreateVoucherRequest request) {
        String code = request.getVoucherCode() != null && !request.getVoucherCode().isBlank()
                ? request.getVoucherCode().toUpperCase().trim()
                : "VCH_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

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
        entity.setDiscountType(request.getDiscountType() != null ? request.getDiscountType() : DiscountType.FIXED_AMOUNT);
        entity.setDiscountValue(request.getDiscountValue() != null ? request.getDiscountValue() : BigDecimal.ZERO);
        entity.setMinBillAmount(request.getMinBillAmount() != null ? request.getMinBillAmount() : BigDecimal.ZERO);
        entity.setMaxDiscountAmount(request.getMaxDiscountAmount());
        
        int totalQty = request.getTotalQuantity() != null ? request.getTotalQuantity() : 1000;
        entity.setTotalQuantity(totalQty);
        if (existingOpt.isEmpty() || entity.getAvailableQuantity() == null || entity.getAvailableQuantity() == 0) {
            entity.setAvailableQuantity(totalQty);
        }
        
        entity.setPointCost(request.getPointCost() != null ? request.getPointCost() : BigDecimal.ZERO);
        if (request.getStartDate() != null) entity.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) entity.setEndDate(request.getEndDate());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());

        LoyaltyVoucherEntity saved = voucherRepository.save(entity);
        return mapToVoucherResponse(saved);
    }

    @Transactional
    public UserVoucherResponse redeemVoucher(String tenantId, RedeemVoucherRequest request) {
        String lockKey = RedisKeys.getVoucherRedeemLockKey(tenantId, request.getExternalUserId());
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

            Long partnerId = voucher.getPartnerId();
            if (partnerId == null) {
                String defaultCode = "TENANT_MICRO_CRM".equalsIgnoreCase(tenantId) ? "DELIMART_RETAIL" : "NATCASH_WALLET";
                partnerId = partnerRepository.findByTenantIdAndPartnerCode(tenantId, defaultCode)
                        .map(LoyaltyPartnerEntity::getId)
                        .orElse(null);
            }

            // Record point ledger
            LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                    .tenantId(tenantId)
                    .account(account)
                    .pointChange(voucher.getPointCost().negate())
                    .balanceAfter(account.getCurrentPoints())
                    .changeType(PointActionType.BURN)
                    .referenceCode("REDEEM_VCH_" + UUID.randomUUID().toString().substring(0, 8))
                    .partnerId(partnerId)
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

    @Transactional
    public VoucherResponse updateVoucher(String tenantId, Long id, CreateVoucherRequest request) {
        LoyaltyVoucherEntity entity = voucherRepository.findById(id)
                .filter(v -> v.getTenantId().equals(tenantId))
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, "Không tìm thấy voucher #" + id));

        // Cập nhật partnerId nếu được cung cấp
        if (request.getPartnerId() != null || request.getPartnerCode() != null) {
            Long partnerId = resolvePartnerId(tenantId, request.getPartnerId(), request.getPartnerCode());
            entity.setPartnerId(partnerId);
        }

        if (request.getTitle() != null) entity.setTitle(request.getTitle());
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getDiscountType() != null) entity.setDiscountType(request.getDiscountType());
        if (request.getDiscountValue() != null) entity.setDiscountValue(request.getDiscountValue());
        if (request.getMinBillAmount() != null) entity.setMinBillAmount(request.getMinBillAmount());
        if (request.getMaxDiscountAmount() != null) entity.setMaxDiscountAmount(request.getMaxDiscountAmount());
        if (request.getPointCost() != null) entity.setPointCost(request.getPointCost());
        if (request.getStartDate() != null) entity.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) entity.setEndDate(request.getEndDate());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());

        if (request.getTotalQuantity() != null) {
            int diff = request.getTotalQuantity() - entity.getTotalQuantity();
            entity.setTotalQuantity(request.getTotalQuantity());
            entity.setAvailableQuantity(Math.max(0, entity.getAvailableQuantity() + diff));
        }

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
            throw new LoyaltyException(ErrorCode.NOT_FOUND, "Đối tác liên minh #" + partnerId + " không tồn tại");
        }

        if (partnerCode != null && !partnerCode.isBlank() && !"ALL".equalsIgnoreCase(partnerCode.trim())) {
            Optional<LoyaltyPartnerEntity> partnerOpt = partnerRepository.findByTenantIdAndPartnerCode(tenantId, partnerCode.trim().toUpperCase());
            if (partnerOpt.isPresent()) {
                return partnerOpt.get().getId();
            }
        }

        return null; // Voucher toàn hệ sinh thái (Áp dụng tất cả đối tác trong liên minh)
    }

    private VoucherResponse mapToVoucherResponse(LoyaltyVoucherEntity v) {
        String partnerName = "Toàn Hệ Sinh Thái (Tất cả đối tác)";
        String partnerCode = "ALL";

        if (v.getPartnerId() != null) {
            Optional<LoyaltyPartnerEntity> partnerOpt = partnerRepository.findById(v.getPartnerId());
            if (partnerOpt.isPresent()) {
                partnerName = partnerOpt.get().getPartnerName();
                partnerCode = partnerOpt.get().getPartnerCode();
            } else {
                partnerName = "Đối tác #" + v.getPartnerId();
                partnerCode = "PARTNER_" + v.getPartnerId();
            }
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
                .availableQuantity(v.getAvailableQuantity())
                .pointCost(v.getPointCost())
                .startDate(v.getStartDate())
                .endDate(v.getEndDate())
                .status(v.getStatus())
                .build();
    }

    private List<LoyaltyVoucherEntity> seedDefaultVouchers(String tenantId) {
        List<LoyaltyPartnerEntity> partners = partnerRepository.findByTenantId(tenantId);
        Long delimartId = null;
        Long natcomId = null;
        Long natcashId = null;

        for (LoyaltyPartnerEntity p : partners) {
            if (p.getPartnerCode().contains("DELIMART")) delimartId = p.getId();
            else if (p.getPartnerCode().contains("NATCOM")) natcomId = p.getId();
            else if (p.getPartnerCode().contains("NATCASH")) natcashId = p.getId();
        }

        Instant now = Instant.now();
        Instant end90 = now.plusSeconds(90L * 86400L);

        List<LoyaltyVoucherEntity> list = new ArrayList<>();

        list.add(LoyaltyVoucherEntity.builder()
                .tenantId(tenantId)
                .partnerId(delimartId)
                .voucherCode("DELIMART_GIAM_50K")
                .title("Phiếu Mua Hàng 50 HTG Siêu Thị Delimart")
                .description("Áp dụng cho hóa đơn từ 200 HTG khi mua sắm tại Siêu thị Delimart.")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("50.00"))
                .minBillAmount(new BigDecimal("200.00"))
                .maxDiscountAmount(new BigDecimal("50.00"))
                .totalQuantity(500)
                .availableQuantity(480)
                .pointCost(new BigDecimal("50.00"))
                .startDate(now)
                .endDate(end90)
                .status(VoucherStatus.ACTIVE)
                .build());

        list.add(LoyaltyVoucherEntity.builder()
                .tenantId(tenantId)
                .partnerId(natcomId)
                .voucherCode("NATCOM_DATA_1GB")
                .title("Gói Cước Data 4G Natcom 1GB (24h)")
                .description("Đổi 30 điểm nhận ngay 1GB Data tốc độ cao lướt web trong 24 giờ.")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("30.00"))
                .minBillAmount(BigDecimal.ZERO)
                .maxDiscountAmount(new BigDecimal("30.00"))
                .totalQuantity(1000)
                .availableQuantity(950)
                .pointCost(new BigDecimal("30.00"))
                .startDate(now)
                .endDate(end90)
                .status(VoucherStatus.ACTIVE)
                .build());

        list.add(LoyaltyVoucherEntity.builder()
                .tenantId(tenantId)
                .partnerId(null) // Voucher toàn hệ sinh thái
                .voucherCode("ALLIANCE_CHAO_BAN_MOI")
                .title("Voucher Chào Mừng Hội Viên Mới Giảm 10%")
                .description("Áp dụng giảm 10% tối đa 100 HTG tại toàn bộ các điểm bán thuộc liên minh.")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("10.00"))
                .minBillAmount(new BigDecimal("100.00"))
                .maxDiscountAmount(new BigDecimal("100.00"))
                .totalQuantity(2000)
                .availableQuantity(1980)
                .pointCost(BigDecimal.ZERO)
                .startDate(now)
                .endDate(end90)
                .status(VoucherStatus.ACTIVE)
                .build());

        return voucherRepository.saveAll(list);
    }
}
