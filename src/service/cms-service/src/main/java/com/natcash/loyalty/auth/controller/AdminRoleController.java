package com.natcash.loyalty.auth.controller;

import com.natcash.loyalty.auth.entity.SystemPermissionEntity;
import com.natcash.loyalty.auth.entity.SystemRoleEntity;
import com.natcash.loyalty.auth.repository.SystemPermissionRepository;
import com.natcash.loyalty.auth.repository.SystemRoleRepository;
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
import java.util.Map;
import java.util.Set;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping(value = {"/roles", "/api/roles", "/loyalty/v1/admin/roles"})
@RequiredArgsConstructor
@Tag(name = "Admin Role & Permission Management API", description = "Quản lý Vai Trò & Phân Quyền CMS")
public class AdminRoleController {

    private final SystemRoleRepository systemRoleRepository;
    private final SystemPermissionRepository systemPermissionRepository;

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Lấy danh sách vai trò", description = "Truy vấn danh sách vai trò có phân trang")
    public ResponseEntity<RolePageResponse> getRoles(
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size) {

        String tenantId = TenantContext.getTenantId();
        List<RoleDetailDto> list = systemRoleRepository.findByTenantIdOrderByIdAsc(tenantId).stream()
                .map(this::toRoleDto)
                .toList();

        int safeSize = Math.max(size, 1);
        int safePage = Math.max(page, 0);
        int totalElements = list.size();
        int totalPages = Math.max((int) Math.ceil((double) totalElements / safeSize), 1);
        int fromIndex = Math.min(safePage * safeSize, totalElements);
        int toIndex = Math.min(fromIndex + safeSize, totalElements);
        List<RoleDetailDto> pageContent = list.subList(fromIndex, toIndex);

        return ResponseEntity.ok(RolePageResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.roles.list_success"))
                .data(pageContent)
                .roles(pageContent)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .currentPage(safePage)
                .pageSize(safeSize)
                .build());
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    @Operation(summary = "Lấy chi tiết vai trò", description = "Truy vấn vai trò kèm danh sách quyền hạn")
    public ResponseEntity<RoleDetailResponse> getRoleById(@PathVariable("id") Long id) {
        String tenantId = TenantContext.getTenantId();
        SystemRoleEntity entity = systemRoleRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.roles.not_found")));

        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.roles.detail_success"))
                .data(toRoleDto(entity))
                .build());
    }

    @PostMapping
    @Transactional
    @Operation(summary = "Tạo mới vai trò", description = "Thêm vai trò quản trị mới")
    public ResponseEntity<RoleDetailResponse> createRole(@RequestBody RolePayload payload) {
        if (payload == null || payload.getCode() == null || payload.getCode().isBlank()
                || payload.getName() == null || payload.getName().isBlank()) {
            throw new LoyaltyException(
                    ErrorCode.VALIDATION_ERROR,
                    MessageUtils.getMessage("error.validation_error"));
        }

        String tenantId = TenantContext.getTenantId();
        String normalizedCode = payload.getCode().toUpperCase().trim();
        if (systemRoleRepository.findByTenantIdAndCodeIgnoreCase(tenantId, normalizedCode).isPresent()) {
            throw new LoyaltyException(
                    ErrorCode.TRANSACTION_DUPLICATE,
                    MessageUtils.getMessage("admin.roles.code_exists"));
        }

        Set<SystemPermissionEntity> permissions = payload.getPermissionIds() != null && !payload.getPermissionIds().isEmpty()
                ? new LinkedHashSet<>(systemPermissionRepository.findAllById(payload.getPermissionIds()))
                : new LinkedHashSet<>();

        SystemRoleEntity saved = systemRoleRepository.save(SystemRoleEntity.builder()
                .tenantId(tenantId)
                .code(normalizedCode)
                .name(payload.getName().trim())
                .description(payload.getDescription())
                .isSystem(Boolean.FALSE)
                .status(CommonStatus.ACTIVE)
                .permissions(permissions)
                .build());

        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.roles.create_success"))
                .data(toRoleDto(saved))
                .build());
    }

    @PutMapping("/{id}")
    @Transactional
    @Operation(summary = "Cập nhật vai trò", description = "Sửa đổi tên, mô tả và danh sách quyền hạn")
    public ResponseEntity<RoleDetailResponse> updateRole(
            @PathVariable("id") Long id,
            @RequestBody RolePayload payload) {
        String tenantId = TenantContext.getTenantId();
        SystemRoleEntity existing = systemRoleRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.roles.not_found")));

        if (payload != null) {
            if (payload.getName() != null && !payload.getName().isBlank()) {
                existing.setName(payload.getName().trim());
            }
            if (payload.getDescription() != null) {
                existing.setDescription(payload.getDescription());
            }
            if (payload.getCode() != null && !payload.getCode().isBlank()) {
                existing.setCode(payload.getCode().toUpperCase().trim());
            }
            if (payload.getPermissionIds() != null) {
                existing.setPermissions(new LinkedHashSet<>(
                        systemPermissionRepository.findAllById(payload.getPermissionIds())));
            }
        }

        SystemRoleEntity saved = systemRoleRepository.save(existing);
        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.roles.update_success"))
                .data(toRoleDto(saved))
                .build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    @Operation(summary = "Xóa vai trò", description = "Loại bỏ vai trò khỏi hệ thống")
    public ResponseEntity<RoleDetailResponse> deleteRole(@PathVariable("id") Long id) {
        String tenantId = TenantContext.getTenantId();
        SystemRoleEntity existing = systemRoleRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.roles.not_found")));

        systemRoleRepository.delete(existing);
        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.roles.delete_success"))
                .build());
    }

    @PostMapping("/{id}/approve")
    @Transactional
    @Operation(summary = "Phê duyệt vai trò", description = "Kích hoạt trạng thái hoạt động của vai trò")
    public ResponseEntity<RoleDetailResponse> approveRole(@PathVariable("id") Long id) {
        String tenantId = TenantContext.getTenantId();
        SystemRoleEntity existing = systemRoleRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.roles.not_found")));

        existing.setStatus(CommonStatus.ACTIVE);
        SystemRoleEntity saved = systemRoleRepository.save(existing);
        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.roles.approve_success"))
                .data(toRoleDto(saved))
                .build());
    }

    @PostMapping("/{id}/reject")
    @Transactional
    @Operation(summary = "Từ chối vai trò", description = "Vô hiệu hóa vai trò")
    public ResponseEntity<RoleDetailResponse> rejectRole(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String tenantId = TenantContext.getTenantId();
        SystemRoleEntity existing = systemRoleRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.roles.not_found")));

        existing.setStatus(CommonStatus.INACTIVE);
        SystemRoleEntity saved = systemRoleRepository.save(existing);
        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.roles.reject_success"))
                .data(toRoleDto(saved))
                .build());
    }

    @GetMapping("/permissions")
    @Transactional(readOnly = true)
    @Operation(summary = "Lấy danh sách tất cả quyền hạn", description = "Danh sách quyền theo phân hệ chức năng")
    public ResponseEntity<PermissionListResponse> getPermissions() {
        List<PermissionDto> list = systemPermissionRepository.findAllByOrderByIdAsc().stream()
                .map(this::toPermissionDto)
                .toList();
        return ResponseEntity.ok(PermissionListResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.permissions.list_success"))
                .data(list)
                .build());
    }

    private RoleDetailDto toRoleDto(SystemRoleEntity entity) {
        List<PermissionDto> permDtos = entity.getPermissions() != null
                ? entity.getPermissions().stream().map(this::toPermissionDto).toList()
                : Collections.emptyList();
        return RoleDetailDto.builder()
                .roleId(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .isActive(entity.getStatus() == CommonStatus.ACTIVE ? 1 : 0)
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null)
                .permissions(permDtos)
                .build();
    }

    private PermissionDto toPermissionDto(SystemPermissionEntity entity) {
        return PermissionDto.builder()
                .permissionId(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .module(entity.getModule())
                .action(entity.getAction())
                .isActive(Boolean.TRUE.equals(entity.getIsActive()) ? 1 : 0)
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RolePayload implements Serializable {
        private static final long serialVersionUID = 1L;
        private String code;
        private String name;
        private String description;
        private List<Long> permissionIds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleDetailDto implements Serializable {
        private static final long serialVersionUID = 1L;
        private Long roleId;
        private String code;
        private String name;
        private String description;
        private Integer isActive;
        private String createdAt;
        private String updatedAt;
        private List<PermissionDto> permissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionDto implements Serializable {
        private static final long serialVersionUID = 1L;
        private Long permissionId;
        private String code;
        private String name;
        private String description;
        private String module;
        private String action;
        private Integer isActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RolePageResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        private int status;
        private String message;
        private List<RoleDetailDto> data;
        private List<RoleDetailDto> roles;
        private long totalElements;
        private int totalPages;
        private int currentPage;
        private int pageSize;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleDetailResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        private int status;
        private String message;
        private RoleDetailDto data;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionListResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        private int status;
        private String message;
        private List<PermissionDto> data;
    }
}
