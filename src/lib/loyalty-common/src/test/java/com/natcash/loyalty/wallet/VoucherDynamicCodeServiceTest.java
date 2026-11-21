package com.natcash.loyalty.wallet;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.wallet.dto.VoucherDto.CheckVoucherRequest;
import com.natcash.loyalty.wallet.dto.VoucherDto.CheckVoucherResponse;
import com.natcash.loyalty.wallet.dto.VoucherDto.UserVoucherResponse;
import com.natcash.loyalty.wallet.dto.VoucherDto.VoucherUseCodeResponse;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherRedemptionEntity;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRedemptionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRepository;
import com.natcash.loyalty.wallet.service.VoucherDynamicCodeService;
import com.natcash.loyalty.wallet.service.VoucherDynamicCodeService.ConsumedVoucherResult;
import com.natcash.loyalty.wallet.service.VoucherService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoucherDynamicCodeServiceTest {

    private static final String TENANT = "TENANT_NATCASH";
    private static final String USER_ID = "50937123456";

    @Mock
    private LoyaltyVoucherRedemptionRepository redemptionRepository;
    @Mock
    private LoyaltyVoucherRepository voucherRepository;
    @Mock
    private LoyaltyAccountRepository accountRepository;
    @Mock
    private LoyaltyPartnerRepository partnerRepository;
    @Mock
    private LoyaltyPointLedgerRepository ledgerRepository;
    @Mock
    private DistributedLockHelper lockHelper;

    private VoucherDynamicCodeService dynamicCodeService;
    private VoucherService voucherService;

    private LoyaltyAccountEntity account;
    private LoyaltyPartnerEntity partner;
    private LoyaltyVoucherEntity voucher;
    private LoyaltyVoucherRedemptionEntity redemption;

    @BeforeEach
    void setUp() {
        lenient().when(lockHelper.executeWithLock(anyString(), anyLong(), anyLong(), any()))
                .thenAnswer(inv -> {
                    Supplier<?> task = inv.getArgument(3);
                    return task.get();
                });

        dynamicCodeService = new VoucherDynamicCodeService(
                redemptionRepository,
                partnerRepository,
                lockHelper,
                null,
                null);

        voucherService = new VoucherService(
                voucherRepository,
                redemptionRepository,
                accountRepository,
                partnerRepository,
                ledgerRepository,
                lockHelper);

        account = LoyaltyAccountEntity.builder()
                .id(11L)
                .tenantId(TENANT)
                .externalUserId(USER_ID)
                .currentPoints(new BigDecimal("1000.00"))
                .build();

        partner = LoyaltyPartnerEntity.builder()
                .id(5L)
                .tenantId(TENANT)
                .partnerCode("DELIMART")
                .partnerName("Delimart")
                .build();

        voucher = LoyaltyVoucherEntity.builder()
                .id(22L)
                .tenantId(TENANT)
                .partnerId(5L)
                .voucherCode("VCH_STATIC_22")
                .title("Giảm 50 HTG")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("50.00"))
                .minBillAmount(new BigDecimal("200.00"))
                .branchScope("BR_01,BR_02")
                .startDate(Instant.now().minus(1, ChronoUnit.DAYS))
                .endDate(Instant.now().plus(30, ChronoUnit.DAYS))
                .status(VoucherStatus.ACTIVE)
                .build();

        redemption = LoyaltyVoucherRedemptionEntity.builder()
                .id(101L)
                .tenantId(TENANT)
                .account(account)
                .voucher(voucher)
                .redemptionCode("STATIC_RDM_SECRET_101")
                .status(VoucherStatus.ACTIVE)
                .expiresAt(Instant.now().plus(15, ChronoUnit.DAYS))
                .build();
    }

    @Test
    @DisplayName("Không hiển thị mã redemptionCode cố định trong danh sách voucher của người dùng")
    void getUserVouchersHidesStaticRedemptionCode() {
        when(accountRepository.findByTenantIdAndExternalUserId(TENANT, USER_ID))
                .thenReturn(Optional.of(account));
        when(redemptionRepository.findByTenantIdAndAccount_Id(TENANT, account.getId()))
                .thenReturn(List.of(redemption));
        when(partnerRepository.findById(5L)).thenReturn(Optional.of(partner));

        List<UserVoucherResponse> list = voucherService.getUserVouchers(TENANT, USER_ID, "ALL");

        assertEquals(1, list.size());
        assertNull(list.get(0).getCode());
        assertEquals(101L, list.get(0).getId());
    }

    @Test
    @DisplayName("Sinh mã động 8 ký tự Crockford Base32 có QR/Barcode đồng bộ và hiệu lực 5 phút, thu hồi mã cũ")
    void generateUseCodeCreates8CharCodeAndRevokesPrevious() {
        when(redemptionRepository.findById(101L)).thenReturn(Optional.of(redemption));
        when(partnerRepository.findById(5L)).thenReturn(Optional.of(partner));

        VoucherUseCodeResponse first = dynamicCodeService.generateUseCode(TENANT, 101L, USER_ID);
        assertNotNull(first.getDynamicCode());
        assertEquals(8, first.getDynamicCode().length());
        assertTrue(dynamicCodeService.isValidDynamicCodeFormat(first.getDynamicCode()));
        assertEquals(first.getDynamicCode(), first.getQrPayload());
        assertEquals(first.getDynamicCode(), first.getBarcodeValue());
        assertEquals(SystemParameterService.get().getInt(TENANT, SystemParamSpec.VOUCHER_DYNAMIC_CODE_TTL_SECONDS),
                first.getExpiresInSeconds());
        assertEquals(300, first.getExpiresInSeconds());

        VoucherUseCodeResponse second = dynamicCodeService.generateUseCode(TENANT, 101L, USER_ID);
        assertNotEquals(first.getDynamicCode(), second.getDynamicCode());

        // Mã cũ bị thu hồi ngay khi người dùng bấm sinh mã mới
        CheckVoucherResponse oldCheck = dynamicCodeService.checkVoucher(
                TENANT, CheckVoucherRequest.builder().code(first.getDynamicCode()).build());
        assertFalse(oldCheck.isValid());

        CheckVoucherResponse newCheck = dynamicCodeService.checkVoucher(
                TENANT, CheckVoucherRequest.builder().code(second.getDynamicCode()).build());
        assertTrue(newCheck.isValid());
        assertEquals(101L, newCheck.getRedemptionId());
        assertTrue(newCheck.getRemainingSeconds() > 0 && newCheck.getRemainingSeconds() <= 300);
    }

    @Test
    @DisplayName("checkVoucher chuẩn hóa định dạng, kiểm tra đối tác/chi nhánh/hóa đơn và tiêu thụ một lần")
    void checkVoucherAndConsumeSingleUse() {
        when(redemptionRepository.findById(101L)).thenReturn(Optional.of(redemption));
        when(redemptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(partnerRepository.findById(5L)).thenReturn(Optional.of(partner));
        when(partnerRepository.findByTenantIdAndPartnerCode(TENANT, "DELIMART")).thenReturn(Optional.of(partner));

        VoucherUseCodeResponse generated = dynamicCodeService.generateUseCode(TENANT, 101L, USER_ID);
        String formatted = generated.getDynamicCode().substring(0, 4)
                + "-"
                + generated.getDynamicCode().substring(4).toLowerCase();

        // Sai chi nhánh -> từ chối
        CheckVoucherResponse wrongBranch = dynamicCodeService.checkVoucher(TENANT, CheckVoucherRequest.builder()
                .code(formatted)
                .partnerCode("DELIMART")
                .branchCode("BR_99")
                .billAmount(new BigDecimal("300.00"))
                .build());
        assertFalse(wrongBranch.isValid());
        assertEquals(ErrorCode.POLICY_VIOLATION.getCode(), wrongBranch.getErrorCode());

        // Hóa đơn dưới mức tối thiểu -> từ chối
        CheckVoucherResponse belowMin = dynamicCodeService.checkVoucher(TENANT, CheckVoucherRequest.builder()
                .code(formatted)
                .partnerCode("DELIMART")
                .branchCode("BR_01")
                .billAmount(new BigDecimal("100.00"))
                .build());
        assertFalse(belowMin.isValid());

        // Hợp lệ -> trả về thông tin giảm giá
        CheckVoucherResponse validCheck = dynamicCodeService.checkVoucher(TENANT, CheckVoucherRequest.builder()
                .code(formatted)
                .partnerCode("DELIMART")
                .branchCode("BR_01")
                .billAmount(new BigDecimal("300.00"))
                .build());
        assertTrue(validCheck.isValid());
        assertEquals(new BigDecimal("50.00"), validCheck.getEstimatedDiscount());

        // Tiêu thụ mã động thành công
        ConsumedVoucherResult consumed = dynamicCodeService.consumeDynamicCode(
                TENANT, formatted, 5L, "DELIMART", "BR_01", new BigDecimal("300.00"), USER_ID);
        assertEquals(VoucherStatus.USED, consumed.getRedemption().getStatus());
        assertEquals(new BigDecimal("50.00"), consumed.getDiscountAmount());
        assertEquals(new BigDecimal("250.00"), consumed.getFinalAmount());

        // Chống dùng lại lần 2 (Single-use)
        assertThrows(LoyaltyException.class, () -> dynamicCodeService.consumeDynamicCode(
                TENANT, formatted, 5L, "DELIMART", "BR_01", new BigDecimal("300.00"), USER_ID));
    }

    @Test
    @DisplayName("Từ chối sử dụng mã cố định trực tiếp tại checkVoucher")
    void checkVoucherRejectsStaticRedemptionCode() {
        CheckVoucherResponse check = dynamicCodeService.checkVoucher(TENANT, CheckVoucherRequest.builder()
                .code("STATIC_RDM_SECRET_101")
                .build());
        assertFalse(check.isValid());
    }
}
