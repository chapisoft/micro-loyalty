package com.natcash.loyalty.auth.controller;

import com.natcash.loyalty.auth.entity.SystemRoleEntity;
import com.natcash.loyalty.auth.entity.SystemUserEntity;
import com.natcash.loyalty.auth.repository.SystemRoleRepository;
import com.natcash.loyalty.auth.repository.SystemUserRepository;
import com.natcash.loyalty.common.util.PasswordHashUtils;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.util.MessageUtils;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.Serializable;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping(value = {"/users", "/api/users", "/loyalty/v1/admin/users"})
@RequiredArgsConstructor
@Tag(name = "Admin User Management API", description = "CMS Administrative User Management")
public class AdminUserController {

    private final SystemUserRepository systemUserRepository;
    private final SystemRoleRepository systemRoleRepository;

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Get admin users list", description = "Query paginated list of CMS administrator accounts")
    public ResponseEntity<AdminUserPageResponse> getUsers(
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageNumber", required = false) Integer pageNumber,
            @RequestParam(value = "size", required = false) Integer size,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "roleId", required = false) Long roleId,
            @RequestParam(value = "status", required = false) String status) {

        int safePage = pageNumber != null ? pageNumber : (page != null ? page : 0);
        int safeSize = pageSize != null ? pageSize : (size != null ? size : 20);
        String effectiveSearch = (keyword != null && !keyword.isBlank()) ? keyword : search;

        String currentTenant = TenantContext.getTenantId();
        List<SystemUserEntity> entities;
        if (currentTenant != null && !currentTenant.isBlank()) {
            entities = systemUserRepository.findByTenantIdOrderByIdAsc(currentTenant);
            if (entities.isEmpty()) {
                entities = systemUserRepository.findAll();
            }
        } else {
            entities = systemUserRepository.findAll();
        }
        List<AdminUserDto> list = entities.stream().map(this::toDto).toList();

        if (effectiveSearch != null && !effectiveSearch.isBlank()) {
            String kw = effectiveSearch.toLowerCase().trim();
            list = list.stream()
                    .filter(u -> (u.getUsername() != null && u.getUsername().toLowerCase().contains(kw))
                            || (u.getFullName() != null && u.getFullName().toLowerCase().contains(kw))
                            || (u.getEmail() != null && u.getEmail().toLowerCase().contains(kw))
                            || (u.getPhone() != null && u.getPhone().toLowerCase().contains(kw)))
                    .toList();
        }

        if (roleId != null) {
            list = list.stream()
                    .filter(u -> u.getRoles() != null && u.getRoles().stream().anyMatch(r -> roleId.equals(r.getRoleId())))
                    .toList();
        }

        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            list = list.stream()
                    .filter(u -> status.equalsIgnoreCase(u.getStatus()))
                    .toList();
        }

        int totalElements = list.size();
        int totalPages = Math.max((int) Math.ceil((double) totalElements / Math.max(safeSize, 1)), 1);
        int fromIndex = Math.min(Math.max(safePage, 0) * Math.max(safeSize, 1), totalElements);
        int toIndex = Math.min(fromIndex + Math.max(safeSize, 1), totalElements);
        List<AdminUserDto> pageContent = list.subList(fromIndex, toIndex);

        return ResponseEntity.ok(AdminUserPageResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.users.list_success"))
                .data(pageContent)
                .users(pageContent)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .currentPage(safePage)
                .pageSize(safeSize)
                .build());
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    @Operation(summary = "Get user details", description = "Query account information by user ID")
    public ResponseEntity<AdminUserDetailResponse> getUserById(@PathVariable("id") Long id) {
        SystemUserEntity entity = findUserOrThrow(id);
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.users.detail_success"))
                .data(toDto(entity))
                .build());
    }

    @PostMapping
    @Transactional
    @Operation(summary = "Create admin user", description = "Add a new CMS administrative account")
    public ResponseEntity<AdminUserDetailResponse> createUser(@RequestBody AdminUserPayload payload) {
        if (payload == null || payload.getUsername() == null || payload.getUsername().isBlank()
                || payload.getEmail() == null || payload.getEmail().isBlank()
                || payload.getFullName() == null || payload.getFullName().isBlank()) {
            throw new LoyaltyException(
                    ErrorCode.VALIDATION_ERROR,
                    MessageUtils.getMessage("error.validation_error"));
        }

        String normalizedUsername = payload.getUsername().trim();
        if (systemUserRepository.findByUsernameIgnoreCase(normalizedUsername).isPresent()) {
            throw new LoyaltyException(
                    ErrorCode.TRANSACTION_DUPLICATE,
                    MessageUtils.getMessage("admin.users.username_exists"));
        }

        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = com.natcash.loyalty.config.LoyaltyProperties.get().getTenant().getDefaultTenant();
        }
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = "DEFAULT";
        }
        String rawPassword = (payload.getPassword() != null && !payload.getPassword().isBlank())
                ? payload.getPassword()
                : UUID.randomUUID().toString();

        Set<SystemRoleEntity> assignedRoles = new LinkedHashSet<>();
        if (payload.getRoleIds() != null && !payload.getRoleIds().isEmpty()) {
            assignedRoles.addAll(systemRoleRepository.findAllById(payload.getRoleIds()));
        }

        SystemUserEntity saved = systemUserRepository.save(SystemUserEntity.builder()
                .tenantId(tenantId)
                .username(normalizedUsername)
                .passwordHash(PasswordHashUtils.hashPassword(rawPassword))
                .fullName(payload.getFullName().trim())
                .email(payload.getEmail().trim())
                .phone(payload.getPhone() != null ? payload.getPhone().trim() : null)
                .status(CommonStatus.ACTIVE)
                .failedLoginAttempts(0)
                .roles(assignedRoles)
                .build());

        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.users.create_success"))
                .data(toDto(saved))
                .build());
    }

    @PutMapping("/{id}")
    @Transactional
    @Operation(summary = "Update admin user", description = "Update full name, email, phone number and assigned roles")
    public ResponseEntity<AdminUserDetailResponse> updateUser(
            @PathVariable("id") Long id,
            @RequestBody AdminUserPayload payload) {
        SystemUserEntity existing = findUserOrThrow(id);

        if (payload != null) {
            if (payload.getFullName() != null && !payload.getFullName().isBlank()) {
                existing.setFullName(payload.getFullName().trim());
            }
            if (payload.getEmail() != null && !payload.getEmail().isBlank()) {
                existing.setEmail(payload.getEmail().trim());
            }
            if (payload.getPhone() != null) {
                existing.setPhone(payload.getPhone().trim());
            }
            if (payload.getPassword() != null && !payload.getPassword().isBlank()) {
                existing.setPasswordHash(PasswordHashUtils.hashPassword(payload.getPassword()));
            }
            if (payload.getRoleIds() != null) {
                Set<SystemRoleEntity> assignedRoles = new LinkedHashSet<>(
                        systemRoleRepository.findAllById(payload.getRoleIds()));
                existing.setRoles(assignedRoles);
            }
        }

        SystemUserEntity saved = systemUserRepository.save(existing);
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.users.update_success"))
                .data(toDto(saved))
                .build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    @Operation(summary = "Delete admin user", description = "Remove user account from system")
    public ResponseEntity<AdminUserDetailResponse> deleteUser(@PathVariable("id") Long id) {
        SystemUserEntity existing = findUserOrThrow(id);
        systemUserRepository.delete(existing);
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.users.delete_success"))
                .build());
    }

    @RequestMapping(value = "/{id}/lock", method = {RequestMethod.POST, RequestMethod.PUT})
    @Transactional
    @Operation(summary = "Lock user account", description = "Disable login access for the specified user")
    public ResponseEntity<AdminUserDetailResponse> lockUser(@PathVariable("id") Long id) {
        SystemUserEntity existing = findUserOrThrow(id);
        existing.setStatus(CommonStatus.LOCKED);
        SystemUserEntity saved = systemUserRepository.save(existing);
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.users.lock_success"))
                .data(toDto(saved))
                .build());
    }

    @RequestMapping(value = "/{id}/unlock", method = {RequestMethod.POST, RequestMethod.PUT})
    @Transactional
    @Operation(summary = "Unlock user account", description = "Re-enable login access for the specified user")
    public ResponseEntity<AdminUserDetailResponse> unlockUser(@PathVariable("id") Long id) {
        SystemUserEntity existing = findUserOrThrow(id);
        existing.setStatus(CommonStatus.ACTIVE);
        existing.setFailedLoginAttempts(0);
        SystemUserEntity saved = systemUserRepository.save(existing);
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.users.unlock_success"))
                .data(toDto(saved))
                .build());
    }

    @RequestMapping(value = "/{id}/reset-password", method = {RequestMethod.POST, RequestMethod.PUT})
    @Transactional
    @Operation(summary = "Reset user password", description = "Generate temporary password or assign a new password")
    public ResponseEntity<Map<String, Object>> resetPassword(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, String> request) {
        SystemUserEntity user = findUserOrThrow(id);

        String newPassword = request != null && request.containsKey("newPassword") && !request.get("newPassword").isBlank()
                ? request.get("newPassword").trim()
                : "Loyalty@" + (1000 + (int)(Math.random() * 9000));

        user.setPasswordHash(PasswordHashUtils.hashPassword(newPassword));
        user.setMustChangePassword(Boolean.TRUE);
        user.setFailedLoginAttempts(0);
        systemUserRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "status", HttpStatus.OK.value(),
                "message", "Password reset successfully",
                "temporaryPassword", newPassword
        ));
    }

    @RequestMapping(value = "/{id}/roles", method = {RequestMethod.POST, RequestMethod.PUT})
    @Transactional
    @Operation(summary = "Assign roles to user", description = "Update assigned security roles for the user")
    public ResponseEntity<AdminUserDetailResponse> assignRoles(
            @PathVariable("id") Long id,
            @RequestBody Map<String, List<Long>> body) {
        SystemUserEntity existing = findUserOrThrow(id);

        List<Long> roleIds = body != null ? body.get("roleIds") : null;
        if (roleIds != null) {
            Set<SystemRoleEntity> assignedRoles = new LinkedHashSet<>(
                    systemRoleRepository.findAllById(roleIds));
            existing.setRoles(assignedRoles);
        }
        SystemUserEntity saved = systemUserRepository.save(existing);
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.users.update_success"))
                .data(toDto(saved))
                .build());
    }

    private SystemUserEntity findUserOrThrow(Long id) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.isBlank()) {
            return systemUserRepository.findByIdAndTenantId(id, tenantId)
                    .or(() -> systemUserRepository.findById(id))
                    .orElseThrow(() -> new LoyaltyException(
                            ErrorCode.RESOURCE_NOT_FOUND,
                            MessageUtils.getMessage("admin.users.not_found")));
        }
        return systemUserRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.users.not_found")));
    }

    private AdminUserDto toDto(SystemUserEntity entity) {
        List<AdminRoleDto> roleDtos = entity.getRoles() != null
                ? entity.getRoles().stream()
                        .map(role -> AdminRoleDto.builder()
                                .roleId(role.getId())
                                .code(role.getCode())
                                .name(role.getName())
                                .description(role.getDescription())
                                .isActive(role.getStatus() == CommonStatus.ACTIVE ? 1 : 0)
                                .createdAt(role.getCreatedAt() != null ? role.getCreatedAt().toString() : null)
                                .updatedAt(role.getUpdatedAt() != null ? role.getUpdatedAt().toString() : null)
                                .build())
                        .toList()
                : Collections.emptyList();

        return AdminUserDto.builder()
                .userId(entity.getId())
                .username(entity.getUsername())
                .email(entity.getEmail())
                .fullName(entity.getFullName())
                .phone(entity.getPhone())
                .avatarUrl(entity.getAvatarUrl())
                .status(entity.getStatus() != null ? entity.getStatus().name() : CommonStatus.ACTIVE.name())
                .isActive(entity.getStatus() == CommonStatus.ACTIVE ? 1 : 0)
                .isLocked(entity.getStatus() == CommonStatus.LOCKED ? 1 : 0)
                .mustChangePassword(entity.getMustChangePassword())
                .failedLoginAttempts(entity.getFailedLoginAttempts() != null ? entity.getFailedLoginAttempts() : 0)
                .lastLoginAt(entity.getLastLoginAt() != null ? entity.getLastLoginAt().toString() : null)
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null)
                .roles(roleDtos)
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminUserPayload implements Serializable {
        private static final long serialVersionUID = 1L;
        private String username;
        private String email;
        private String fullName;
        private String phone;
        private String password;
        private List<Long> roleIds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminUserDto implements Serializable {
        private static final long serialVersionUID = 1L;
        private Long userId;
        private String username;
        private String email;
        private String fullName;
        private String phone;
        private String avatarUrl;
        private String status;
        private Integer isActive;
        private Integer isLocked;
        private Boolean mustChangePassword;
        private Integer failedLoginAttempts;
        private String lastLoginAt;
        private String createdAt;
        private String updatedAt;
        private List<AdminRoleDto> roles;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminRoleDto implements Serializable {
        private static final long serialVersionUID = 1L;
        private Long roleId;
        private String code;
        private String name;
        private String description;
        private Integer isActive;
        private String createdAt;
        private String updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminUserPageResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        private int status;
        private String message;
        private List<AdminUserDto> data;
        private List<AdminUserDto> users;
        private long totalElements;
        private int totalPages;
        private int currentPage;
        private int pageSize;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminUserDetailResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        private int status;
        private String message;
        private AdminUserDto data;
    }
}
