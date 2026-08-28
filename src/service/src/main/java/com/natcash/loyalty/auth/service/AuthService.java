package com.natcash.loyalty.auth.service;

import com.natcash.loyalty.auth.dto.AuthDto.AuthSimpleResponse;
import com.natcash.loyalty.auth.dto.AuthDto.ChangePasswordRequest;
import com.natcash.loyalty.auth.dto.AuthDto.ForgotPasswordRequest;
import com.natcash.loyalty.auth.dto.AuthDto.LoginRequest;
import com.natcash.loyalty.auth.dto.AuthDto.LoginResponse;
import com.natcash.loyalty.auth.dto.AuthDto.ResetPasswordRequest;
import com.natcash.loyalty.auth.dto.AuthDto.UserProfileResponse;
import com.natcash.loyalty.auth.dto.AuthDto.VerifyOtpRequest;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.exception.LoyaltyException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String DEFAULT_TEST_PASSWORD = "Admin@123456";
    private static final long DEFAULT_TOKEN_EXPIRATION_SECONDS = 86400L;

    public LoginResponse login(LoginRequest request) {
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        String password = request.getPassword() != null ? request.getPassword().trim() : "";

        log.info("[AUTH-LOGIN] Yêu cầu đăng nhập từ tài khoản: {}", username);

        if ("admin".equalsIgnoreCase(username) && DEFAULT_TEST_PASSWORD.equals(password)) {
            return buildLoginResponse("1", "admin", "Quản Trị Viên Hệ Thống", "admin@mid.io.vn",
                    Arrays.asList("SUPER_ADMIN", "ADMIN"),
                    Arrays.asList("ALL", "READ", "WRITE", "DELETE", "APPROVE"));
        }

        if ("loyalty_admin".equalsIgnoreCase(username) && DEFAULT_TEST_PASSWORD.equals(password)) {
            return buildLoginResponse("2", "loyalty_admin", "Quản Trị Viên Vận Hành", "operator@mid.io.vn",
                    Arrays.asList("ADMIN", "OPERATOR"),
                    Arrays.asList("READ", "WRITE", "OPERATE"));
        }

        if ("support_user".equalsIgnoreCase(username) && DEFAULT_TEST_PASSWORD.equals(password)) {
            return buildLoginResponse("3", "support_user", "Chuyên Viên Chăm Sóc Khách Hàng", "support@mid.io.vn",
                    Collections.singletonList("SUPPORT"),
                    Arrays.asList("READ", "SUPPORT"));
        }

        log.warn("[AUTH-LOGIN-FAILED] Đăng nhập thất bại cho tài khoản: {}", username);
        throw new LoyaltyException(ErrorCode.UNAUTHORIZED, "Tên đăng nhập hoặc mật khẩu không chính xác");
    }

    public LoginResponse verifyOtp(VerifyOtpRequest request) {
        log.info("[AUTH-VERIFY-OTP] Xác thực mã OTP cho email: {}", request.getEmail());
        return buildLoginResponse("1", "admin", "Quản Trị Viên Hệ Thống",
                request.getEmail() != null ? request.getEmail() : "admin@mid.io.vn",
                Arrays.asList("SUPER_ADMIN", "ADMIN"),
                Arrays.asList("ALL", "READ", "WRITE"));
    }

    public AuthSimpleResponse forgotPassword(ForgotPasswordRequest request) {
        log.info("[AUTH-FORGOT-PASSWORD] Yêu cầu đặt lại mật khẩu cho email: {}", request.getEmail());
        return AuthSimpleResponse.builder()
                .status(200)
                .succeeded(true)
                .code(200)
                .message("Đã gửi mã xác nhận đặt lại mật khẩu đến email của bạn")
                .build();
    }

    public AuthSimpleResponse resetPassword(ResetPasswordRequest request) {
        log.info("[AUTH-RESET-PASSWORD] Đặt lại mật khẩu thành công");
        return AuthSimpleResponse.builder()
                .status(200)
                .succeeded(true)
                .code(200)
                .message("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.")
                .build();
    }

    public AuthSimpleResponse resendOtp(String email) {
        log.info("[AUTH-RESEND-OTP] Gửi lại mã OTP cho email: {}", email);
        return AuthSimpleResponse.builder()
                .status(200)
                .succeeded(true)
                .code(200)
                .message("Đã gửi lại mã OTP thành công")
                .build();
    }

    public UserProfileResponse getProfile(String userId, String username) {
        String effectiveUsername = username != null && !username.isEmpty() ? username : "admin";
        String effectiveId = userId != null && !userId.isEmpty() ? userId : "1";

        return UserProfileResponse.builder()
                .status(200)
                .succeeded(true)
                .code(200)
                .message("Lấy thông tin tài khoản thành công")
                .id(effectiveId)
                .userId(effectiveId)
                .username(effectiveUsername)
                .fullName("Quản Trị Viên Hệ Thống")
                .email(effectiveUsername + "@mid.io.vn")
                .phoneNumber("+84988888888")
                .roles(Arrays.asList("SUPER_ADMIN", "ADMIN"))
                .build();
    }

    public AuthSimpleResponse changePassword(ChangePasswordRequest request) {
        log.info("[AUTH-CHANGE-PASSWORD] Đổi mật khẩu tài khoản");
        return AuthSimpleResponse.builder()
                .status(200)
                .succeeded(true)
                .code(200)
                .message("Đổi mật khẩu thành công")
                .build();
    }

    private LoginResponse buildLoginResponse(String userId, String username, String fullName, String email,
                                             List<String> roles, List<String> permissions) {
        String accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
                UUID.randomUUID().toString().replace("-", "") + "." +
                UUID.randomUUID().toString().replace("-", "");
        String refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
                UUID.randomUUID().toString().replace("-", "") + "." +
                UUID.randomUUID().toString().replace("-", "");

        return LoginResponse.builder()
                .status(200)
                .succeeded(true)
                .code(200)
                .message("Đăng nhập thành công")
                .userId(userId)
                .username(username)
                .fullName(fullName)
                .email(email)
                .roles(roles)
                .permissions(permissions)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(DEFAULT_TOKEN_EXPIRATION_SECONDS)
                .otp("123456")
                .build();
    }
}
