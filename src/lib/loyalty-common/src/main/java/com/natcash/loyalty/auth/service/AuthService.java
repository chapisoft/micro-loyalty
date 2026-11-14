package com.natcash.loyalty.auth.service;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.auth.dto.AuthDto.AuthSimpleResponse;
import com.natcash.loyalty.auth.dto.AuthDto.ChangePasswordRequest;
import com.natcash.loyalty.auth.dto.AuthDto.ForgotPasswordRequest;
import com.natcash.loyalty.auth.dto.AuthDto.LoginRequest;
import com.natcash.loyalty.auth.dto.AuthDto.LoginResponse;
import com.natcash.loyalty.auth.dto.AuthDto.ResetPasswordRequest;
import com.natcash.loyalty.auth.dto.AuthDto.UserProfileResponse;
import com.natcash.loyalty.auth.dto.AuthDto.VerifyOtpRequest;
import com.natcash.loyalty.auth.entity.SystemPermissionEntity;
import com.natcash.loyalty.auth.entity.SystemRoleEntity;
import com.natcash.loyalty.auth.entity.SystemUserEntity;
import com.natcash.loyalty.auth.repository.SystemUserRepository;
import com.natcash.loyalty.common.util.PasswordHashUtils;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.SecurityConstants;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.PartnerStaffRole;
import com.natcash.loyalty.domain.enums.SystemPermissionCode;
import com.natcash.loyalty.domain.enums.SystemRoleCode;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.partner.entity.PartnerStaffAccountEntity;
import com.natcash.loyalty.partner.repository.PartnerStaffAccountRepository;
import com.natcash.loyalty.security.JwtTokenUtils;
import com.natcash.loyalty.util.MessageUtils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
public class AuthService {

    private final SystemUserRepository systemUserRepository;
    private final PartnerStaffAccountRepository partnerStaffAccountRepository;
    private final LoyaltyPartnerRepository loyaltyPartnerRepository;
    private final String jwtMasterKey;

    @Autowired
    public AuthService(
            SystemUserRepository systemUserRepository,
            PartnerStaffAccountRepository partnerStaffAccountRepository,
            @Autowired(required = false) LoyaltyPartnerRepository loyaltyPartnerRepository,
            @Value("${loyalty.security.master-key:}") String jwtMasterKey) {
        this.systemUserRepository = systemUserRepository;
        this.partnerStaffAccountRepository = partnerStaffAccountRepository;
        this.loyaltyPartnerRepository = loyaltyPartnerRepository;
        this.jwtMasterKey = jwtMasterKey;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String username = request != null && request.getUsername() != null ? request.getUsername().trim() : "";
        String password = request != null && request.getPassword() != null ? request.getPassword() : "";

        if (username.isEmpty() || password.isEmpty()) {
            throw new LoyaltyException(ErrorCode.UNAUTHORIZED,
                    MessageUtils.getMessage("auth.login.invalid_credentials"));
        }

        Optional<SystemUserEntity> systemUserOpt = systemUserRepository != null
                ? systemUserRepository.findByUsernameIgnoreCase(username)
                : Optional.empty();
        if (systemUserOpt.isPresent()) {
            SystemUserEntity user = systemUserOpt.get();
            if (user.getStatus() != CommonStatus.ACTIVE) {
                log.warn("[AUTH-LOGIN-LOCKED] username={}, status={}", username, user.getStatus());
                throw new LoyaltyException(ErrorCode.UNAUTHORIZED,
                        MessageUtils.getMessage("auth.error.account_inactive"));
            }
            if (!PasswordHashUtils.matches(password, user.getPasswordHash())) {
                log.warn("[AUTH-LOGIN-FAILED] username={}", username);
                throw new LoyaltyException(ErrorCode.UNAUTHORIZED,
                        MessageUtils.getMessage("auth.login.invalid_credentials"));
            }
            user.setLastLoginAt(Instant.now());
            user.setFailedLoginAttempts(0);
            systemUserRepository.save(user);
            return buildLoginResponseFromSystemUser(user);
        }

        Optional<PartnerStaffAccountEntity> staffOpt = resolveActiveStaffByUsername(username);
        if (staffOpt.isPresent()) {
            PartnerStaffAccountEntity staff = staffOpt.get();
            if (!PasswordHashUtils.matches(password, staff.getPasswordHash())) {
                log.warn("[AUTH-LOGIN-FAILED] staffUsername={}", username);
                throw new LoyaltyException(ErrorCode.UNAUTHORIZED,
                        MessageUtils.getMessage("auth.login.invalid_credentials"));
            }
            staff.setLastLoginAt(Instant.now());
            partnerStaffAccountRepository.save(staff);
            return buildLoginResponseFromStaff(staff);
        }

        log.warn("[AUTH-LOGIN-FAILED] username={}", username);
        throw new LoyaltyException(ErrorCode.UNAUTHORIZED, MessageUtils.getMessage("auth.login.invalid_credentials"));
    }

    @Transactional(readOnly = true)
    public LoginResponse verifyOtp(VerifyOtpRequest request) {
        String email = request != null && request.getEmail() != null ? request.getEmail().trim() : "";
        Integer otp = request != null ? request.getOtp() : null;
        int otpLength = SystemParameterService.get().getInt(null, SystemParamSpec.AUTH_OTP_LENGTH);
        if (email.isEmpty() || otp == null || String.valueOf(otp).length() != otpLength) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, MessageUtils.getMessage("auth.error.invalid_otp"));
        }

        Optional<SystemUserEntity> userOpt = systemUserRepository != null
                ? systemUserRepository.findByEmailIgnoreCase(email)
                : Optional.empty();
        if (userOpt.isPresent()) {
            SystemUserEntity user = userOpt.get();
            if (user.getStatus() != CommonStatus.ACTIVE) {
                throw new LoyaltyException(ErrorCode.UNAUTHORIZED,
                        MessageUtils.getMessage("auth.error.account_inactive"));
            }
            return buildLoginResponseFromSystemUser(user);
        }

        Optional<PartnerStaffAccountEntity> staffOpt = partnerStaffAccountRepository != null
                ? partnerStaffAccountRepository.findByEmailIgnoreCase(email)
                        .filter(staff -> staff.getStatus() == CommonStatus.ACTIVE)
                : Optional.empty();
        if (staffOpt.isPresent()) {
            return buildLoginResponseFromStaff(staffOpt.get());
        }

        throw new LoyaltyException(ErrorCode.NOT_FOUND, MessageUtils.getMessage("auth.error.user_not_found"));
    }

    public AuthSimpleResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request != null && request.getEmail() != null ? request.getEmail().trim() : "";
        if (email.isEmpty()) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR,
                    MessageUtils.getMessage("validation.email.not_blank"));
        }
        return AuthSimpleResponse.builder()
                .status(HttpStatus.OK.value())
                .succeeded(Boolean.TRUE)
                .code(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("auth.password.forgot_sent"))
                .build();
    }

    public AuthSimpleResponse resetPassword(ResetPasswordRequest request) {
        if (request == null || request.getNewPassword() == null || request.getNewPassword().isBlank()
                || (request.getConfirmPassword() != null
                        && !request.getNewPassword().equals(request.getConfirmPassword()))) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR,
                    MessageUtils.getMessage("auth.error.password_mismatch"));
        }
        return AuthSimpleResponse.builder()
                .status(HttpStatus.OK.value())
                .succeeded(Boolean.TRUE)
                .code(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("auth.password.reset_success"))
                .build();
    }

    public AuthSimpleResponse resendOtp(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR,
                    MessageUtils.getMessage("validation.email.not_blank"));
        }
        return AuthSimpleResponse.builder()
                .status(HttpStatus.OK.value())
                .succeeded(Boolean.TRUE)
                .code(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("auth.otp.resend_success"))
                .build();
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String userId, String username) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getDetails() instanceof Map<?, ?> claims) {
            Long partnerId = claims.get(SecurityConstants.CLAIM_PARTNER_ID) instanceof Number num ? num.longValue()
                    : null;
            Long branchId = claims.get(SecurityConstants.CLAIM_BRANCH_ID) instanceof Number num ? num.longValue()
                    : null;
            String claimUsername = claims.get(SecurityConstants.CLAIM_SUB) != null
                    ? String.valueOf(claims.get(SecurityConstants.CLAIM_SUB))
                    : auth.getName();
            String claimUserId = claims.get(SecurityConstants.CLAIM_USER_ID_CAMEL) != null
                    ? String.valueOf(claims.get(SecurityConstants.CLAIM_USER_ID_CAMEL))
                    : null;
            String claimFullName = claims.get(SecurityConstants.CLAIM_FULL_NAME) != null
                    ? String.valueOf(claims.get(SecurityConstants.CLAIM_FULL_NAME))
                    : null;
            String claimEmail = claims.get(SecurityConstants.CLAIM_EMAIL) != null
                    ? String.valueOf(claims.get(SecurityConstants.CLAIM_EMAIL))
                    : null;
            String partnerCode = claims.get(SecurityConstants.CLAIM_PARTNER_CODE) != null
                    ? String.valueOf(claims.get(SecurityConstants.CLAIM_PARTNER_CODE))
                    : null;
            String partnerName = claims.get(SecurityConstants.CLAIM_PARTNER_NAME) != null
                    ? String.valueOf(claims.get(SecurityConstants.CLAIM_PARTNER_NAME))
                    : null;
            String tenantId = claims.get(SecurityConstants.CLAIM_TENANT_ID_CAMEL) != null
                    ? String.valueOf(claims.get(SecurityConstants.CLAIM_TENANT_ID_CAMEL))
                    : null;

            List<String> claimRoles = claims.get(SecurityConstants.CLAIM_ROLES) instanceof List<?> rawRoles
                    ? rawRoles.stream().map(String::valueOf).toList()
                    : Collections.emptyList();

            return UserProfileResponse.builder()
                    .status(HttpStatus.OK.value())
                    .succeeded(Boolean.TRUE)
                    .code(HttpStatus.OK.value())
                    .message(MessageUtils.getMessage("auth.profile.success"))
                    .id(claimUserId)
                    .userId(claimUserId)
                    .username(claimUsername)
                    .fullName(claimFullName)
                    .email(claimEmail)
                    .roles(claimRoles)
                    .partnerId(partnerId)
                    .partnerCode(partnerCode)
                    .partnerName(partnerName)
                    .tenantId(tenantId)
                    .branchId(branchId)
                    .build();
        }

        String lookupUsername = (username != null && !username.isBlank()) ? username.trim() : null;
        if (lookupUsername == null && auth != null && auth.isAuthenticated()
                && !SecurityConstants.PRINCIPAL_ANONYMOUS.equals(auth.getName())
                && !SecurityConstants.PRINCIPAL_JWT_USER.equals(auth.getName())) {
            lookupUsername = auth.getName();
        }

        if (lookupUsername != null) {
            Optional<SystemUserEntity> userOpt = systemUserRepository != null
                    ? systemUserRepository.findByUsernameIgnoreCase(lookupUsername)
                    : Optional.empty();
            if (userOpt.isPresent()) {
                return buildProfileFromSystemUser(userOpt.get());
            }
            Optional<PartnerStaffAccountEntity> staffOpt = resolveActiveStaffByUsername(lookupUsername);
            if (staffOpt.isPresent()) {
                return buildProfileFromStaff(staffOpt.get());
            }
        }

        if (userId != null && !userId.isBlank() && systemUserRepository != null) {
            try {
                Long parsedId = Long.parseLong(userId.trim());
                Optional<SystemUserEntity> userById = systemUserRepository.findById(parsedId);
                if (userById.isPresent()) {
                    return buildProfileFromSystemUser(userById.get());
                }
            } catch (NumberFormatException ignored) {
                log.debug("[AUTH-PROFILE] Non-numeric userId parameter ignored: {}", userId);
            }
        }

        throw new LoyaltyException(ErrorCode.UNAUTHORIZED, MessageUtils.getMessage("auth.error.unauthenticated"));
    }

    @Transactional
    public AuthSimpleResponse changePassword(ChangePasswordRequest request) {
        if (request == null || request.getNewPassword() == null || request.getNewPassword().isBlank()
                || (request.getConfirmPassword() != null
                        && !request.getNewPassword().equals(request.getConfirmPassword()))) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR,
                    MessageUtils.getMessage("auth.error.password_mismatch"));
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()
                && !SecurityConstants.PRINCIPAL_ANONYMOUS.equals(auth.getName())
                && !SecurityConstants.PRINCIPAL_JWT_USER.equals(auth.getName())) {
            String principalName = auth.getName();
            if (systemUserRepository != null) {
                Optional<SystemUserEntity> userOpt = systemUserRepository.findByUsernameIgnoreCase(principalName);
                if (userOpt.isPresent()) {
                    SystemUserEntity user = userOpt.get();
                    if (request.getOldPassword() != null && !request.getOldPassword().isBlank()
                            && !PasswordHashUtils.matches(request.getOldPassword(), user.getPasswordHash())) {
                        throw new LoyaltyException(ErrorCode.UNAUTHORIZED,
                                MessageUtils.getMessage("auth.error.invalid_old_password"));
                    }
                    user.setPasswordHash(PasswordHashUtils.hashPassword(request.getNewPassword()));
                    systemUserRepository.save(user);
                }
            }
        }

        return AuthSimpleResponse.builder()
                .status(HttpStatus.OK.value())
                .succeeded(Boolean.TRUE)
                .code(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("auth.password.change_success"))
                .build();
    }

    private Optional<PartnerStaffAccountEntity> resolveActiveStaffByUsername(String username) {
        if (partnerStaffAccountRepository == null || username == null || username.isBlank()) {
            return Optional.empty();
        }
        return partnerStaffAccountRepository.findByUsernameIgnoreCaseOrderByIdDesc(username).stream()
                .filter(staff -> staff.getStatus() == CommonStatus.ACTIVE)
                .findFirst();
    }

    private LoginResponse buildLoginResponseFromSystemUser(SystemUserEntity user) {
        Set<String> roleCodes = new LinkedHashSet<>();
        Set<String> permissionCodes = new LinkedHashSet<>();
        if (user.getRoles() != null) {
            for (SystemRoleEntity role : user.getRoles()) {
                if (role.getStatus() == CommonStatus.ACTIVE && role.getCode() != null) {
                    roleCodes.add(role.getCode());
                    if (role.getPermissions() != null) {
                        for (SystemPermissionEntity perm : role.getPermissions()) {
                            if (Boolean.TRUE.equals(perm.getIsActive()) && perm.getCode() != null) {
                                permissionCodes.add(perm.getCode());
                            }
                        }
                    }
                }
            }
        }

        LoyaltyPartnerEntity partner = resolvePartner(user.getPartnerId(), user.getTenantId());
        String partnerCode = partner != null ? partner.getPartnerCode() : user.getPartnerCode();
        String partnerName = partner != null ? partner.getPartnerName() : null;

        return buildLoginResponse(
                String.valueOf(user.getId()),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                new ArrayList<>(roleCodes),
                new ArrayList<>(permissionCodes),
                user.getPartnerId(),
                partnerCode,
                partnerName,
                user.getTenantId(),
                null);
    }

    private LoginResponse buildLoginResponseFromStaff(PartnerStaffAccountEntity staff) {
        LoyaltyPartnerEntity partner = resolvePartner(staff.getPartnerId(), staff.getTenantId());
        PartnerStaffRole staffRole = staff.getRoleCode() != null ? staff.getRoleCode()
                : PartnerStaffRole.PARTNER_CASHIER;
        List<String> roles = List.of(SystemRoleCode.PARTNER_ADMIN.getCode(), staffRole.name());
        List<String> permissions = List.of(
                SystemPermissionCode.READ.getCode(),
                SystemPermissionCode.WRITE.getCode(),
                SystemPermissionCode.PARTNER_PORTAL.getCode());

        return buildLoginResponse(
                String.valueOf(staff.getId()),
                staff.getUsername(),
                staff.getFullName(),
                staff.getEmail(),
                roles,
                permissions,
                staff.getPartnerId(),
                partner != null ? partner.getPartnerCode() : null,
                partner != null ? partner.getPartnerName() : null,
                staff.getTenantId(),
                staff.getBranchId());
    }

    private UserProfileResponse buildProfileFromSystemUser(SystemUserEntity user) {
        List<String> roleCodes = user.getRoles() != null
                ? user.getRoles().stream()
                        .filter(role -> role.getStatus() == CommonStatus.ACTIVE && role.getCode() != null)
                        .map(SystemRoleEntity::getCode)
                        .toList()
                : Collections.emptyList();
        LoyaltyPartnerEntity partner = resolvePartner(user.getPartnerId(), user.getTenantId());

        return UserProfileResponse.builder()
                .status(HttpStatus.OK.value())
                .succeeded(Boolean.TRUE)
                .code(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("auth.profile.success"))
                .id(String.valueOf(user.getId()))
                .userId(String.valueOf(user.getId()))
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhone())
                .roles(roleCodes)
                .partnerId(user.getPartnerId())
                .partnerCode(partner != null ? partner.getPartnerCode() : user.getPartnerCode())
                .partnerName(partner != null ? partner.getPartnerName() : null)
                .tenantId(user.getTenantId())
                .build();
    }

    private UserProfileResponse buildProfileFromStaff(PartnerStaffAccountEntity staff) {
        LoyaltyPartnerEntity partner = resolvePartner(staff.getPartnerId(), staff.getTenantId());
        String roleName = staff.getRoleCode() != null ? staff.getRoleCode().name()
                : PartnerStaffRole.PARTNER_CASHIER.name();

        return UserProfileResponse.builder()
                .status(HttpStatus.OK.value())
                .succeeded(Boolean.TRUE)
                .code(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("auth.profile.success"))
                .id(String.valueOf(staff.getId()))
                .userId(String.valueOf(staff.getId()))
                .username(staff.getUsername())
                .fullName(staff.getFullName())
                .email(staff.getEmail())
                .phoneNumber(staff.getPhoneNumber())
                .roles(List.of(SystemRoleCode.PARTNER_ADMIN.getCode(), roleName))
                .partnerId(staff.getPartnerId())
                .partnerCode(partner != null ? partner.getPartnerCode() : null)
                .partnerName(partner != null ? partner.getPartnerName() : null)
                .tenantId(staff.getTenantId())
                .branchId(staff.getBranchId())
                .build();
    }

    private LoyaltyPartnerEntity resolvePartner(Long partnerId, String tenantId) {
        if (loyaltyPartnerRepository == null || partnerId == null) {
            return null;
        }
        if (tenantId != null && !tenantId.isBlank()) {
            return loyaltyPartnerRepository.findByIdAndTenantId(partnerId, tenantId)
                    .or(() -> loyaltyPartnerRepository.findById(partnerId))
                    .orElse(null);
        }
        return loyaltyPartnerRepository.findById(partnerId).orElse(null);
    }

    private LoginResponse buildLoginResponse(String userId, String username, String fullName, String email,
            List<String> roles, List<String> permissions,
            Long partnerId, String partnerCode, String partnerName,
            String tenantId, Long branchId) {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put(SecurityConstants.CLAIM_SUB, username);
        claims.put(SecurityConstants.CLAIM_USER_ID_CAMEL, userId);
        claims.put(SecurityConstants.CLAIM_FULL_NAME, fullName);
        claims.put(SecurityConstants.CLAIM_EMAIL, email);
        claims.put(SecurityConstants.CLAIM_ROLES, roles);
        if (partnerId != null) {
            claims.put(SecurityConstants.CLAIM_PARTNER_ID, partnerId);
        }
        if (partnerCode != null) {
            claims.put(SecurityConstants.CLAIM_PARTNER_CODE, partnerCode);
        }
        if (partnerName != null) {
            claims.put(SecurityConstants.CLAIM_PARTNER_NAME, partnerName);
        }
        if (tenantId != null) {
            claims.put(SecurityConstants.CLAIM_TENANT_ID_CAMEL, tenantId);
        }
        if (branchId != null) {
            claims.put(SecurityConstants.CLAIM_BRANCH_ID, branchId);
        }

        long tokenTtlSeconds = SystemParameterService.get().getLong(tenantId, SystemParamSpec.AUTH_DEFAULT_TOKEN_TTL_SECONDS);
        long refreshTokenTtlSeconds = SystemParameterService.get().getLong(tenantId, SystemParamSpec.AUTH_REFRESH_TOKEN_TTL_SECONDS);
        String accessToken = JwtTokenUtils.signClaims(claims, tokenTtlSeconds,
                jwtMasterKey);
        String refreshToken = JwtTokenUtils.signClaims(
                Map.of(SecurityConstants.CLAIM_SUB, username, SecurityConstants.CLAIM_TENANT_ID_CAMEL,
                        tenantId != null ? tenantId : ""),
                refreshTokenTtlSeconds,
                jwtMasterKey);

        return LoginResponse.builder()
                .status(HttpStatus.OK.value())
                .succeeded(Boolean.TRUE)
                .code(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("auth.login.success"))
                .userId(userId)
                .username(username)
                .fullName(fullName)
                .email(email)
                .roles(roles)
                .permissions(permissions)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(tokenTtlSeconds)
                .partnerId(partnerId)
                .partnerCode(partnerCode)
                .partnerName(partnerName)
                .tenantId(tenantId)
                .branchId(branchId)
                .build();
    }
}
