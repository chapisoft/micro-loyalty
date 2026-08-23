package com.natcash.loyalty.wheel;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.PrizeType;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.SpinWheelRequest;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.SpinWheelResponse;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.WheelConfigRequest;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.WheelConfigResponse;
import com.natcash.loyalty.wheel.entity.LuckyWheelEntity;
import com.natcash.loyalty.wheel.entity.LuckyWheelPrizeEntity;
import com.natcash.loyalty.wheel.repository.LuckyWheelPrizeRepository;
import com.natcash.loyalty.wheel.repository.LuckyWheelRepository;
import com.natcash.loyalty.wheel.service.LuckyWheelService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RAtomicLong;
import org.redisson.api.RedissonClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LuckyWheelServiceTest {

    @Mock
    private LuckyWheelRepository wheelRepository;

    @Mock
    private LuckyWheelPrizeRepository prizeRepository;

    @Mock
    private AccountService accountService;

    @Mock
    private LoyaltyAccountRepository accountRepository;

    @Mock
    private LoyaltyPointLedgerRepository ledgerRepository;

    @Mock
    private DistributedLockHelper lockHelper;

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private RAtomicLong atomicLong;

    @InjectMocks
    private LuckyWheelService luckyWheelService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        lenient().when(lockHelper.executeWithLock(anyString(), (Supplier<Object>) any(Supplier.class)))
                .thenAnswer(invocation -> ((Supplier<?>) invocation.getArgument(1)).get());
    }

    @Test
    @DisplayName("BE-15.1: Lấy cấu hình đĩa quay và danh sách nan quạt thành công")
    void testGetWheelConfigSuccess() {
        LuckyWheelEntity wheel = LuckyWheelEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .wheelCode("WHEEL_2026")
                .wheelName("Vòng Quay Siêu Thị Delimart")
                .pricePerSpin(BigDecimal.ZERO)
                .freeSpinsDaily(1)
                .status(CommonStatus.ACTIVE)
                .build();

        LuckyWheelPrizeEntity prize1 = LuckyWheelPrizeEntity.builder()
                .id(10L)
                .wheel(wheel)
                .prizeName("100 Điểm")
                .prizeType(PrizeType.POINTS)
                .prizeValue(new BigDecimal("100.00"))
                .displayOrder(1)
                .colorCode("#FFD700")
                .build();

        when(wheelRepository.findByTenantIdAndWheelCodeAndStatus("TENANT_DELIMART", "WHEEL_2026", CommonStatus.ACTIVE))
                .thenReturn(Optional.of(wheel));
        when(prizeRepository.findByWheel_IdAndStatusOrderByDisplayOrderAsc(1L, CommonStatus.ACTIVE))
                .thenReturn(List.of(prize1));

        WheelConfigResponse response = luckyWheelService.getWheelConfig("TENANT_DELIMART", new WheelConfigRequest("WHEEL_2026", "USER_01"));

        assertNotNull(response);
        assertEquals("WHEEL_2026", response.getWheelCode());
        assertEquals(1, response.getPrizes().size());
        assertEquals("100 Điểm", response.getPrizes().get(0).getPrizeName());
    }

    @Test
    @DisplayName("BE-15.2: Quay thưởng trúng điểm thành công và cộng vào số dư hội viên")
    void testExecuteSpinPointsSuccess() {
        LuckyWheelEntity wheel = LuckyWheelEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .wheelCode("WHEEL_2026")
                .wheelName("Vòng Quay May Mắn")
                .pricePerSpin(BigDecimal.ZERO)
                .build();

        LuckyWheelPrizeEntity prize1 = LuckyWheelPrizeEntity.builder()
                .id(10L)
                .wheel(wheel)
                .prizeName("50 Điểm Thưởng")
                .prizeType(PrizeType.POINTS)
                .prizeValue(new BigDecimal("50.00"))
                .probabilityWeight(100)
                .displayOrder(1)
                .build();

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .id(5L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("USER_01")
                .currentPoints(new BigDecimal("200.00"))
                .build();

        when(wheelRepository.findByTenantIdAndWheelCodeAndStatus("TENANT_DELIMART", "WHEEL_2026", CommonStatus.ACTIVE))
                .thenReturn(Optional.of(wheel));
        when(prizeRepository.findByWheel_IdAndStatusOrderByDisplayOrderAsc(1L, CommonStatus.ACTIVE))
                .thenReturn(List.of(prize1));
        when(accountService.getAccountForUpdate("TENANT_DELIMART", "USER_01"))
                .thenReturn(account);

        SpinWheelRequest request = SpinWheelRequest.builder()
                .externalUserId("USER_01")
                .wheelCode("WHEEL_2026")
                .build();

        SpinWheelResponse response = luckyWheelService.executeSpin("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals("50 Điểm Thưởng", response.getPrizeName());
        assertEquals(PrizeType.POINTS, response.getPrizeType());
        assertEquals(new BigDecimal("250.00"), response.getNewPointBalance());
        assertEquals(0, response.getWinningIndex());

        verify(accountRepository, times(1)).save(account);
        verify(ledgerRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("BE-15.3: Từ chối quay thưởng nếu phí điểm lớn hơn số dư hiện có")
    void testExecuteSpinInsufficientPoints() {
        LuckyWheelEntity wheel = LuckyWheelEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .wheelCode("WHEEL_VIP")
                .wheelName("Vòng Quay VIP")
                .pricePerSpin(new BigDecimal("100.00"))
                .build();

        LuckyWheelPrizeEntity prize1 = LuckyWheelPrizeEntity.builder()
                .id(10L)
                .wheel(wheel)
                .prizeName("1000 Điểm")
                .prizeType(PrizeType.POINTS)
                .prizeValue(new BigDecimal("1000.00"))
                .probabilityWeight(100)
                .build();

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .tenantId("TENANT_DELIMART")
                .externalUserId("USER_01")
                .currentPoints(new BigDecimal("30.00"))
                .build();

        when(wheelRepository.findByTenantIdAndWheelCodeAndStatus("TENANT_DELIMART", "WHEEL_VIP", CommonStatus.ACTIVE))
                .thenReturn(Optional.of(wheel));
        when(prizeRepository.findByWheel_IdAndStatusOrderByDisplayOrderAsc(1L, CommonStatus.ACTIVE))
                .thenReturn(List.of(prize1));
        when(accountService.getAccountForUpdate("TENANT_DELIMART", "USER_01"))
                .thenReturn(account);

        SpinWheelRequest request = SpinWheelRequest.builder()
                .externalUserId("USER_01")
                .wheelCode("WHEEL_VIP")
                .build();

        assertThrows(LoyaltyException.class, () ->
                luckyWheelService.executeSpin("TENANT_DELIMART", request));

        verify(accountRepository, never()).save(account);
    }
}
