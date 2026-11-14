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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.Serializable;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping(value = {"/users", "/api/users", "/loyalty/v1/admin/users"})
@RequiredArgsConstructor
@Tag(name = "Admin User Management API", description = "Quản lý Người Dùng Quản Trị CMS")
public class AdminUserController {

    private final SystemUserRepository systemUserRepository;
    private final SystemRoleRepository systemRoleRepository;

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Lấy danh sách người dùng quản trị", description = "Truy vấn danh sách tài khoản CMS có phân trang")
    public ResponseEntity<AdminUserPageResponse> getUsers(
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size,
            @RequestParam(value = "search", required = false) String search) {

        String tenantId = TenantContext.getTenantId();
        List<SystemUserEntity> entities = systemUserRepository.findByTenantIdOrderByIdAsc(tenantId);
        List<AdminUserDto> list = entities.stream().map(this::toDto).toList();

        if (search != null && !search.isBlank()) {
            String keyword = search.toLowerCase().trim();
            list = list.stream()
                    .filter(u -> (u.getUsername() != null && u.getUsername().toLowerCase().contains(keyword))
                            || (u.getFullName() != null && u.getFullName().toLowerCase().contains(keyword))
                            || (u.getEmail() != null && u.getEmail().toLowerCase().contains(keyword)))
                    .toList();
        }

        int safeSize = Math.max(size, 1);
        int safePage = Math.max(page, 0);
        int totalElements = list.size();
        int totalPages = Math.max((int) Math.ceil((double) totalElements / safeSize), 1);
        int fromIndex = Math.min(safePage * safeSize, totalElements);
        int toIndex = Math.min(fromIndex + safeSize, totalElements);
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
    @Operation(summary = "Lấy chi tiết người dùng", description = "Truy vấn thông tin tài khoản theo ID")
    public ResponseEntity<AdminUserDetailResponse> getUserById(@PathVariable("id") Long id) {
        String tenantId = TenantContext.getTenantId();
        SystemUserEntity entity = systemUserRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.users.not_found")));

        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.users.detail_success"))
                .data(toDto(entity))
                .build());
    }

    @PostMapping
    @Transactional
    @Operation(summary = "Tạo mới người dùng quản trị", description = "Thêm tài khoản quản trị CMS mới")
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
        String rawPassword = (payload.getPassword() != null && !payload.getPassword().isBlank())
                ? payload.getPassword()
                : UUID.randomUUID().toString();

        Set<SystemRoleEntity> assignedRoles = new LinkedHashSet<>();
        if (payload.getRoleIds() != null && !payload.getRoleIds().isEmpty()) {
            assignedRoles.addAll(systemRoleRepository.findAllById(payload.getRoleIds()).stream()
                    .filter(role -> tenantId.equalsIgnoreCase(role.getTenantId()))
                    .toList());
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
    @Operation(summary = "Cập nhật người dùng quản trị", description = "Sửa đổi thông tin họ tên, email, số điện thoại")
    public ResponseEntity<AdminUserDetailResponse> updateUser(
            @PathVariable("id") Long id,
            @RequestBody AdminUserPayload payload) {
        String tenantId = TenantContext.getTenantId();
        SystemUserEntity existing = systemUserRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.users.not_found")));

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
                        systemRoleRepository.findAllById(payload.getRoleIds()).stream()
                                .filter(role -> tenantId.equalsIgnoreCase(role.getTenantId()))
                                .toList());
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
    @Operation(summary = "Xóa người dùng", description = "Loại bỏ tài khoản khỏi hệ thống")
    public ResponseEntity<AdminUserDetailResponse> deleteUser(@PathVariable("id") Long id) {
        String tenantId = TenantContext.getTenantId();
        SystemUserEntity existing = systemUserRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.users.not_found")));

        systemUserRepository.delete(existing);
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.users.delete_success"))
                .build());
    }

    @PostMapping("/{id}/lock")
    @Transactional
    @Operation(summary = "Khóa tài khoản người dùng", description = "Vô hiệu hóa quyền đăng nhập của người dùng")
    public ResponseEntity<AdminUserDetailResponse> lockUser(@PathVariable("id") Long id) {
        String tenantId = TenantContext.getTenantId();
        SystemUserEntity existing = systemUserRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.users.not_found")));

        existing.setStatus(CommonStatus.LOCKED);
        SystemUserEntity saved = systemUserRepository.save(existing);
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.users.lock_success"))
                .data(toDto(saved))
                .build());
    }

    @PostMapping("/{id}/unlock")
    @Transactional
    @Operation(summary = "Mở khóa tài khoản người dùng", description = "Kích hoạt lại quyền đăng nhập cho người dùng")
    public ResponseEntity<AdminUserDetailResponse> unlockUser(@PathVariable("id") Long id) {
        String tenantId = TenantContext.getTenantId();
        SystemUserEntity existing = systemUserRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.users.not_found")));

        existing.setStatus(CommonStatus.ACTIVE);
        existing.setFailedLoginAttempts(0);
        SystemUserEntity saved = systemUserRepository.save(existing);
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.users.unlock_success"))
                .data(toDto(saved))
                .build());
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
                .isActive(entity.getStatus() == CommonStatus.ACTIVE ? 1 : 0)
                .isLocked(entity.getStatus() == CommonStatus.LOCKED ? 1 : 0)
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
        private Integer isActive;
        private Integer isLocked;
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
