package com.natcash.loyalty.auth;

import com.natcash.loyalty.auth.dto.AuthDto.LoginRequest;
import com.natcash.loyalty.auth.dto.AuthDto.LoginResponse;
import com.natcash.loyalty.auth.dto.AuthDto.UserProfileResponse;
import com.natcash.loyalty.auth.dto.AuthDto.VerifyOtpRequest;
import com.natcash.loyalty.auth.service.AuthService;
import com.natcash.loyalty.exception.LoyaltyException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthServiceTest {

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService();
    }

    @Test
    @DisplayName("AUTH-UT-01: Đăng nhập Super Admin thành công với admin/Admin@123456")
    void testSuperAdminLoginSuccess() {
        LoginRequest request = LoginRequest.builder()
                .username("admin")
                .password("Admin@123456")
                .build();

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertTrue(response.getSucceeded());
        assertEquals("admin", response.getUsername());
        assertNotNull(response.getAccessToken());
        assertTrue(response.getRoles().contains("SUPER_ADMIN"));
    }

    @Test
    @DisplayName("AUTH-UT-02: Đăng nhập Loyalty Admin thành công")
    void testOperatorLoginSuccess() {
        LoginRequest request = LoginRequest.builder()
                .username("loyalty_admin")
                .password("Admin@123456")
                .build();

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertTrue(response.getSucceeded());
        assertEquals("loyalty_admin", response.getUsername());
        assertTrue(response.getRoles().contains("ADMIN"));
    }

    @Test
    @DisplayName("AUTH-UT-03: Đăng nhập thất bại khi sai mật khẩu")
    void testLoginFailedWrongPassword() {
        LoginRequest request = LoginRequest.builder()
                .username("admin")
                .password("WrongPassword999")
                .build();

        assertThrows(LoyaltyException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("AUTH-UT-04: Xác thực OTP và lấy hồ sơ tài khoản thành công")
    void testVerifyOtpAndGetProfile() {
        VerifyOtpRequest otpRequest = VerifyOtpRequest.builder()
                .email("admin@mid.io.vn")
                .otp(123456)
                .build();

        LoginResponse otpResponse = authService.verifyOtp(otpRequest);
        assertNotNull(otpResponse);
        assertTrue(otpResponse.getSucceeded());

        UserProfileResponse profileResponse = authService.getProfile("1", "admin");
        assertNotNull(profileResponse);
        assertEquals("admin", profileResponse.getUsername());
    }
}
