package com.natcash.loyalty.auth;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.auth.dto.AuthDto.LoginRequest;
import com.natcash.loyalty.auth.dto.AuthDto.LoginResponse;
import com.natcash.loyalty.auth.dto.AuthDto.UserProfileResponse;
import com.natcash.loyalty.auth.dto.AuthDto.VerifyOtpRequest;
import com.natcash.loyalty.auth.entity.SystemPermissionEntity;
import com.natcash.loyalty.auth.entity.SystemRoleEntity;
import com.natcash.loyalty.auth.entity.SystemUserEntity;
import com.natcash.loyalty.auth.repository.SystemUserRepository;
import com.natcash.loyalty.auth.service.AuthService;
import com.natcash.loyalty.common.util.PasswordHashUtils;
import com.natcash.loyalty.constant.SecurityConstants;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.PartnerStaffRole;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.partner.entity.PartnerStaffAccountEntity;
import com.natcash.loyalty.partner.repository.PartnerStaffAccountRepository;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private SystemUserRepository systemUserRepository;

    @Mock
    private PartnerStaffAccountRepository partnerStaffAccountRepository;

    @Mock
    private LoyaltyPartnerRepository loyaltyPartnerRepository;

    private AuthService authService;

    private SystemUserEntity adminUser;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        authService = new AuthService(
                systemUserRepository,
                partnerStaffAccountRepository,
                loyaltyPartnerRepository,
                "unit-test-master-secret-key-2026"
        );

        SystemPermissionEntity permAll = SystemPermissionEntity.builder()
                .id(1L)
                .code(SecurityConstants.PERM_ALL)
                .name("Full Control")
                .module("SYSTEM")
                .action("ALL")
                .isActive(Boolean.TRUE)
                .build();

        SystemRoleEntity superAdminRole = SystemRoleEntity.builder()
                .id(1L)
                .tenantId("TENANT_NATCASH")
                .code(SecurityConstants.ROLE_SUPER_ADMIN)
                .name("Super Administrator")
                .status(CommonStatus.ACTIVE)
                .permissions(Set.of(permAll))
                .build();

        adminUser = SystemUserEntity.builder()
                .id(1L)
                .tenantId("TENANT_NATCASH")
                .username("admin")
                .passwordHash(PasswordHashUtils.hashPassword("SecretPass@2026"))
                .fullName("Platform Administrator")
                .email("admin@example.com")
                .status(CommonStatus.ACTIVE)
                .roles(Set.of(superAdminRole))
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("AUTH-UT-01: Đăng nhập System User thành công từ CSDL và phát hành JWT")
    void testSystemUserLoginSuccess() {
        when(systemUserRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(adminUser));
        when(systemUserRepository.save(any(SystemUserEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        LoginResponse response = authService.login(LoginRequest.builder()
                .username("admin")
                .password("SecretPass@2026")
                .build());

        assertNotNull(response);
        assertTrue(response.getSucceeded());
        assertEquals("admin", response.getUsername());
        assertNotNull(response.getAccessToken());
        assertTrue(response.getRoles().contains(SecurityConstants.ROLE_SUPER_ADMIN));
    }

    @Test
    @DisplayName("AUTH-UT-02: Đăng nhập nhân viên đối tác từ bảng partner_staff_accounts và ánh xạ thông tin đối tác")
    void testPartnerStaffLoginSuccess() {
        PartnerStaffAccountEntity staff = PartnerStaffAccountEntity.builder()
                .id(15L)
                .tenantId("TENANT_DELIMART")
                .partnerId(69L)
                .branchId(3L)
                .username("owner_delimart")
                .fullName("Delimart Owner")
                .email("owner@delimart.ht")
                .roleCode(PartnerStaffRole.PARTNER_OWNER)
                .passwordHash(PasswordHashUtils.hashPassword("PartnerPass@2026"))
                .status(CommonStatus.ACTIVE)
                .build();

        LoyaltyPartnerEntity partner = LoyaltyPartnerEntity.builder()
                .id(69L)
                .tenantId("TENANT_DELIMART")
                .partnerCode("DELIMART")
                .partnerName("Delimart Supermarket")
                .build();

        when(systemUserRepository.findByUsernameIgnoreCase("owner_delimart")).thenReturn(Optional.empty());
        when(partnerStaffAccountRepository.findByUsernameIgnoreCaseOrderByIdDesc("owner_delimart")).thenReturn(List.of(staff));
        when(partnerStaffAccountRepository.save(any(PartnerStaffAccountEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        when(loyaltyPartnerRepository.findByIdAndTenantId(69L, "TENANT_DELIMART")).thenReturn(Optional.of(partner));

        LoginResponse response = authService.login(LoginRequest.builder()
                .username("owner_delimart")
                .password("PartnerPass@2026")
                .build());

        assertNotNull(response);
        assertTrue(response.getSucceeded());
        assertEquals(69L, response.getPartnerId());
        assertEquals("DELIMART", response.getPartnerCode());
        assertEquals("TENANT_DELIMART", response.getTenantId());
        assertTrue(response.getRoles().contains(PartnerStaffRole.PARTNER_OWNER.name()));
    }

    @Test
    @DisplayName("AUTH-UT-03: Đăng nhập thất bại khi sai mật khẩu")
    void testLoginFailedWrongPassword() {
        when(systemUserRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(adminUser));

        assertThrows(LoyaltyException.class, () -> authService.login(LoginRequest.builder()
                .username("admin")
                .password("WrongPassword999")
                .build()));
    }

    @Test
    @DisplayName("AUTH-UT-04: Xác thực OTP và lấy hồ sơ tài khoản thực tế từ CSDL")
    void testVerifyOtpAndGetProfile() {
        when(systemUserRepository.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(systemUserRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(adminUser));

        LoginResponse otpResponse = authService.verifyOtp(VerifyOtpRequest.builder()
                .email("admin@example.com")
                .otp(123456)
                .build());
        assertNotNull(otpResponse);
        assertTrue(otpResponse.getSucceeded());
        assertEquals("admin", otpResponse.getUsername());

        UserProfileResponse profileResponse = authService.getProfile("1", "admin");
        assertNotNull(profileResponse);
        assertEquals("admin", profileResponse.getUsername());
        assertEquals("admin@example.com", profileResponse.getEmail());
    }

    @Test
    @DisplayName("AUTH-UT-05: Từ chối trả về hồ sơ giả lập khi không có phiên xác thực hoặc tài khoản không tồn tại")
    void testGetProfileUnauthenticatedThrows() {
        when(systemUserRepository.findByUsernameIgnoreCase("ghost_user")).thenReturn(Optional.empty());
        when(partnerStaffAccountRepository.findByUsernameIgnoreCaseOrderByIdDesc("ghost_user")).thenReturn(List.of());

        assertThrows(LoyaltyException.class, () -> authService.getProfile(null, "ghost_user"));
    }
}
