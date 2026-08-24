package com.natcash.loyalty.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public final class AuthDto {

    private AuthDto() {
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "Tên đăng nhập không được để trống")
        private String username;

        @NotBlank(message = "Mật khẩu không được để trống")
        private String password;

        private String refreshToken;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class LoginResponse {
        @Builder.Default
        private Integer status = 200;

        @Builder.Default
        private Boolean succeeded = true;

        @Builder.Default
        private Integer code = 200;

        private String message;
        private String userId;
        private String username;
        private String fullName;
        private String email;
        private String avatarUrl;
        private List<String> roles;
        private List<String> permissions;
        private String accessToken;
        private String refreshToken;
        private Long expiresIn;
        private String otp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyOtpRequest {
        private String email;
        private Integer otp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForgotPasswordRequest {
        @NotBlank(message = "Email không được để trống")
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResetPasswordRequest {
        private String newPassword;
        private String confirmPassword;
        private String token;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AuthSimpleResponse {
        @Builder.Default
        private Integer status = 200;

        @Builder.Default
        private Boolean succeeded = true;

        @Builder.Default
        private Integer code = 200;

        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserProfileResponse {
        @Builder.Default
        private Integer status = 200;

        @Builder.Default
        private Boolean succeeded = true;

        @Builder.Default
        private Integer code = 200;

        private String message;
        private String id;
        private String userId;
        @JsonProperty("userName")
        private String username;
        private String fullName;
        private String email;
        private String phoneNumber;
        private List<String> roles;
    }
}
