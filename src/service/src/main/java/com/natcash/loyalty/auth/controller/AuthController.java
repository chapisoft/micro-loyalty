package com.natcash.loyalty.auth.controller;

import com.natcash.loyalty.auth.dto.AuthDto.AuthSimpleResponse;
import com.natcash.loyalty.auth.dto.AuthDto.ForgotPasswordRequest;
import com.natcash.loyalty.auth.dto.AuthDto.LoginRequest;
import com.natcash.loyalty.auth.dto.AuthDto.LoginResponse;
import com.natcash.loyalty.auth.dto.AuthDto.ResetPasswordRequest;
import com.natcash.loyalty.auth.dto.AuthDto.UserProfileResponse;
import com.natcash.loyalty.auth.dto.AuthDto.VerifyOtpRequest;
import com.natcash.loyalty.auth.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping(value = {"/auth/login", "/loyalty/auth/login", "/api/auth/login", "/cms/auth/login"})
    public ResponseEntity<java.util.Map<String, String>> getLoginInfo() {
        return ResponseEntity.ok(java.util.Map.of(
            "status", "UP",
            "service", "Loyalty Authentication Service",
            "message", "Please send POST request with credentials to authenticate."
        ));
    }

    @PostMapping(value = {"/auth/login", "/loyalty/auth/login", "/api/auth/login", "/v1/auth/login", "/cms/auth/login", "/cms/api/auth/login"})
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = {"/auth/verify-otp", "/loyalty/auth/verify-otp", "/api/auth/verify-otp", "/cms/auth/verify-otp"})
    public ResponseEntity<LoginResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        LoginResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = {"/auth/forgot-password", "/loyalty/auth/forgot-password", "/api/auth/forgot-password", "/cms/auth/forgot-password"})
    public ResponseEntity<AuthSimpleResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        AuthSimpleResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = {"/auth/reset-password", "/loyalty/auth/reset-password", "/api/auth/reset-password", "/cms/auth/reset-password"})
    public ResponseEntity<AuthSimpleResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        AuthSimpleResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = {"/auth/resend-otp", "/loyalty/auth/resend-otp", "/api/auth/resend-otp", "/cms/auth/resend-otp"})
    public ResponseEntity<AuthSimpleResponse> resendOtp(@RequestParam(value = "email", required = false) String email) {
        AuthSimpleResponse response = authService.resendOtp(email != null ? email : "admin@mid.io.vn");
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = {"/auth/me", "/loyalty/auth/me", "/api/auth/me", "/cms/auth/me", "/users/me", "/loyalty/users/me", "/cms/users/me"})
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            @RequestParam(value = "userId", required = false) String userId,
            @RequestParam(value = "username", required = false) String username) {
        UserProfileResponse response = authService.getProfile(userId, username);
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = {"/users/{id}", "/loyalty/users/{id}", "/api/v1/users/{id}"})
    public ResponseEntity<UserProfileResponse> getUserById(@PathVariable("id") String id) {
        UserProfileResponse response = authService.getProfile(id, "admin");
        return ResponseEntity.ok(response);
    }
}
