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
        @NotBlank(message = "{validation.username.not_blank}")
        private String username;

        @NotBlank(message = "{validation.password.not_blank}")
        private String password;

        private String refreshToken;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class LoginResponse {
        private Integer status;
        private Boolean succeeded;
        private Integer code;
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
        private Long partnerId;
        private String partnerCode;
        private String partnerName;
        private String tenantId;
        private Long branchId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyOtpRequest {
        @NotBlank(message = "{validation.email.not_blank}")
        private String email;
        private Integer otp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForgotPasswordRequest {
        @NotBlank(message = "{validation.email.not_blank}")
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
    public static class ChangePasswordRequest {
        private String oldPassword;
        private String newPassword;
        private String confirmPassword;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AuthSimpleResponse {
        private Integer status;
        private Boolean succeeded;
        private Integer code;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserProfileResponse {
        private Integer status;
        private Boolean succeeded;
        private Integer code;
        private String message;
        private String id;
        private String userId;
        @JsonProperty("userName")
        private String username;
        private String fullName;
        private String email;
        private String phoneNumber;
        private List<String> roles;
        private Long partnerId;
        private String partnerCode;
        private String partnerName;
        private String tenantId;
        private Long branchId;
    }
}
