package com.natcash.loyalty.account;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileRequest;
import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyTierEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyTierRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.domain.enums.TierLevel;
import com.natcash.loyalty.stream.LoyaltyStreamEvent;
import com.natcash.loyalty.stream.LoyaltyStreamProducer;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private LoyaltyAccountRepository accountRepository;

    @Mock
    private LoyaltyTierRepository tierRepository;

    @Mock
    private LoyaltyStreamProducer streamProducer;

    @InjectMocks
    private AccountService accountService;

    @Test
    @DisplayName("BE-09.1: Tạo tài khoản mới với Hạng Bạc mặc định")
    void testCreateDefaultAccount() {
        LoyaltyTierEntity silverTier = LoyaltyTierEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .code(TierLevel.SILVER)
                .name("Hạng Bạc")
                .tierLevel(1)
                .minPoints(BigDecimal.ZERO)
                .pointMultiplier(BigDecimal.ONE)
                .freeDailyTurns(1)
                .build();

        when(accountRepository.findByTenantIdAndExternalUserId("TENANT_DELIMART", "USER_NEW_001"))
                .thenReturn(Optional.empty());
        when(tierRepository.findByTenantIdAndCode("TENANT_DELIMART", TierLevel.SILVER))
                .thenReturn(Optional.of(silverTier));
        when(accountRepository.save(any(LoyaltyAccountEntity.class))).thenAnswer(invocation -> {
            LoyaltyAccountEntity a = invocation.getArgument(0);
            a.setId(10L);
            return a;
        });

        ProfileRequest request = ProfileRequest.builder()
                .externalUserId("USER_NEW_001")
                .fullName("Trần Văn An")
                .phoneNumber("0987654321")
                .build();

        ProfileResponse response = accountService.getOrCreateProfile("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals("USER_NEW_001", response.getExternalUserId());
        assertEquals("TENANT_DELIMART", response.getTenantId());
        assertEquals(TierLevel.SILVER, response.getTier().getCode());
        assertEquals(BigDecimal.ZERO, response.getCurrentPoints());
    }

    @Test
    @DisplayName("BE-09.2: Tự động thăng hạng lên Vàng khi đạt đủ điểm xét hạng")
    void testAutoUpgradeTier() {
        LoyaltyTierEntity silverTier = LoyaltyTierEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .code(TierLevel.SILVER)
                .tierLevel(1)
                .minPoints(BigDecimal.ZERO)
                .build();

        LoyaltyTierEntity goldTier = LoyaltyTierEntity.builder()
                .id(2L)
                .tenantId("TENANT_DELIMART")
                .code(TierLevel.GOLD)
                .tierLevel(2)
                .minPoints(new BigDecimal("1000.00"))
                .build();

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("USER_VIP")
                .tier(silverTier)
                .tierPoints(new BigDecimal("1500.00"))
                .build();

        when(tierRepository.findByTenantIdOrderByTierLevelAsc("TENANT_DELIMART"))
                .thenReturn(List.of(silverTier, goldTier));

        boolean upgraded = accountService.checkAndUpgradeTier(account);

        assertTrue(upgraded, "Tài khoản phải được tự động thăng hạng");
        assertEquals(TierLevel.GOLD, account.getTier().getCode());
        verify(accountRepository, times(1)).save(account);
        verify(streamProducer, times(1)).publishEvent(any(LoyaltyStreamEvent.class));
    }
}
