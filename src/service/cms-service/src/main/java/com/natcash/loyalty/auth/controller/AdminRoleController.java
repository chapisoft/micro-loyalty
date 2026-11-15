package com.natcash.loyalty.auth.controller;

import com.natcash.loyalty.auth.entity.SystemPermissionEntity;
import com.natcash.loyalty.auth.entity.SystemRoleEntity;
import com.natcash.loyalty.auth.repository.SystemPermissionRepository;
import com.natcash.loyalty.auth.repository.SystemRoleRepository;
import com.natcash.loyalty.auth.repository.SystemUserRepository;
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

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping(value = {"/roles", "/api/roles", "/loyalty/v1/admin/roles"})
@RequiredArgsConstructor
@Tag(name = "Admin Role & Permission Management API", description = "CMS Administrative Role and Permission Management")
public class AdminRoleController {

    private final SystemRoleRepository systemRoleRepository;
    private final SystemPermissionRepository systemPermissionRepository;
    private final SystemUserRepository systemUserRepository;

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Get admin roles list", description = "Query paginated list of administrative roles")
    public ResponseEntity<RolePageResponse> getRoles(
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageNumber", required = false) Integer pageNumber,
            @RequestParam(value = "size", required = false) Integer size,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "platform", required = false) String platform,
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "status", required = false) String status) {

        int safePage = pageNumber != null ? pageNumber : (page != null ? page : 0);
        int safeSize = pageSize != null ? pageSize : (size != null ? size : 20);
        String effectiveSearch = (keyword != null && !keyword.isBlank()) ? keyword : search;

        String currentTenant = TenantContext.getTenantId();
        List<SystemRoleEntity> roleEntities;
        if (currentTenant != null && !currentTenant.isBlank()) {
            roleEntities = systemRoleRepository.findByTenantIdOrderByIdAsc(currentTenant);
            if (roleEntities.isEmpty()) {
                roleEntities = systemRoleRepository.findAll();
            }
        } else {
            roleEntities = systemRoleRepository.findAll();
        }
        List<RoleDetailDto> list = roleEntities.stream().map(this::toRoleDto).toList();

        if (effectiveSearch != null && !effectiveSearch.isBlank()) {
            String kw = effectiveSearch.toLowerCase().trim();
            list = list.stream()
                    .filter(r -> (r.getCode() != null && r.getCode().toLowerCase().contains(kw))
                            || (r.getName() != null && r.getName().toLowerCase().contains(kw))
                            || (r.getDescription() != null && r.getDescription().toLowerCase().contains(kw)))
                    .toList();
        }

        if (platform != null && !platform.isBlank() && !"ALL".equalsIgnoreCase(platform)) {
            list = list.stream()
                    .filter(r -> platform.equalsIgnoreCase(r.getPlatform()))
                    .toList();
        }

        if (scope != null && !scope.isBlank() && !"ALL".equalsIgnoreCase(scope)) {
            list = list.stream()
                    .filter(r -> scope.equalsIgnoreCase(r.getScope()))
                    .toList();
        }

        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            list = list.stream()
                    .filter(r -> status.equalsIgnoreCase(r.getStatus()))
                    .toList();
        }

        int totalElements = list.size();
        int totalPages = Math.max((int) Math.ceil((double) totalElements / Math.max(safeSize, 1)), 1);
        int fromIndex = Math.min(Math.max(safePage, 0) * Math.max(safeSize, 1), totalElements);
        int toIndex = Math.min(fromIndex + Math.max(safeSize, 1), totalElements);
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
    @Operation(summary = "Get role details", description = "Query role information and assigned permissions by ID")
    public ResponseEntity<RoleDetailResponse> getRoleById(@PathVariable("id") Long id) {
        SystemRoleEntity entity = findRoleOrThrow(id);
        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.roles.detail_success"))
                .data(toRoleDto(entity))
                .build());
    }

    @PostMapping
    @Transactional
    @Operation(summary = "Create role", description = "Add a new administrative role")
    public ResponseEntity<RoleDetailResponse> createRole(@RequestBody RolePayload payload) {
        if (payload == null || payload.getCode() == null || payload.getCode().isBlank()
                || payload.getName() == null || payload.getName().isBlank()) {
            throw new LoyaltyException(
                    ErrorCode.VALIDATION_ERROR,
                    MessageUtils.getMessage("error.validation_error"));
        }

        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = com.natcash.loyalty.config.LoyaltyProperties.get().getTenant().getDefaultTenant();
        }
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = "DEFAULT";
        }
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
                .platform(payload.getPlatform() != null && !payload.getPlatform().isBlank() ? payload.getPlatform() : "WEB_CMS")
                .scope(payload.getScope() != null && !payload.getScope().isBlank() ? payload.getScope() : "ALL")
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
    @Operation(summary = "Update role", description = "Update role code, name, description and assigned permissions")
    public ResponseEntity<RoleDetailResponse> updateRole(
            @PathVariable("id") Long id,
            @RequestBody RolePayload payload) {
        SystemRoleEntity existing = findRoleOrThrow(id);

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
            if (payload.getPlatform() != null && !payload.getPlatform().isBlank()) {
                existing.setPlatform(payload.getPlatform());
            }
            if (payload.getScope() != null && !payload.getScope().isBlank()) {
                existing.setScope(payload.getScope());
            }
            if (payload.getStatus() != null && !payload.getStatus().isBlank()) {
                try {
                    existing.setStatus(CommonStatus.valueOf(payload.getStatus().toUpperCase()));
                } catch (Exception ignored) {}
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
    @Operation(summary = "Delete role", description = "Remove role from system")
    public ResponseEntity<RoleDetailResponse> deleteRole(@PathVariable("id") Long id) {
        SystemRoleEntity existing = findRoleOrThrow(id);
        systemRoleRepository.delete(existing);
        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.roles.delete_success"))
                .build());
    }

    @RequestMapping(value = "/{id}/permissions", method = {RequestMethod.POST, RequestMethod.PUT})
    @Transactional
    @Operation(summary = "Update role permissions", description = "Assign or update permissions for the specified role")
    public ResponseEntity<RoleDetailResponse> updateRolePermissions(
            @PathVariable("id") Long id,
            @RequestBody Map<String, List<Long>> payload) {
        SystemRoleEntity existing = findRoleOrThrow(id);

        List<Long> permissionIds = payload != null ? payload.get("permissionIds") : null;
        if (permissionIds != null) {
            existing.setPermissions(new LinkedHashSet<>(
                    systemPermissionRepository.findAllById(permissionIds)));
        }
        SystemRoleEntity saved = systemRoleRepository.save(existing);
        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.roles.update_success"))
                .data(toRoleDto(saved))
                .build());
    }

    @RequestMapping(value = "/{id}/approve", method = {RequestMethod.POST, RequestMethod.PUT})
    @Transactional
    @Operation(summary = "Approve role", description = "Activate role to ACTIVE status")
    public ResponseEntity<RoleDetailResponse> approveRole(@PathVariable("id") Long id) {
        SystemRoleEntity existing = findRoleOrThrow(id);
        existing.setStatus(CommonStatus.ACTIVE);
        SystemRoleEntity saved = systemRoleRepository.save(existing);
        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.roles.approve_success"))
                .data(toRoleDto(saved))
                .build());
    }

    @RequestMapping(value = "/{id}/reject", method = {RequestMethod.POST, RequestMethod.PUT})
    @Transactional
    @Operation(summary = "Reject role", description = "Deactivate role to INACTIVE status")
    public ResponseEntity<RoleDetailResponse> rejectRole(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, String> body) {
        SystemRoleEntity existing = findRoleOrThrow(id);
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
    @Operation(summary = "Get all permissions", description = "Query all available permissions ordered by module and action")
    public ResponseEntity<PermissionListResponse> getPermissions() {
        List<PermissionDto> list = systemPermissionRepository.findAllByOrderByDisplayOrderAscIdAsc().stream()
                .map(this::toPermissionDto)
                .toList();
        if (list.isEmpty()) {
            list = systemPermissionRepository.findAllByOrderByIdAsc().stream()
                    .map(this::toPermissionDto)
                    .toList();
        }
        return ResponseEntity.ok(PermissionListResponse.builder()
                .status(HttpStatus.OK.value())
                .message(MessageUtils.getMessage("admin.permissions.list_success"))
                .data(list)
                .build());
    }

    private SystemRoleEntity findRoleOrThrow(Long id) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.isBlank()) {
            return systemRoleRepository.findByIdAndTenantId(id, tenantId)
                    .or(() -> systemRoleRepository.findById(id))
                    .orElseThrow(() -> new LoyaltyException(
                            ErrorCode.RESOURCE_NOT_FOUND,
                            MessageUtils.getMessage("admin.roles.not_found")));
        }
        return systemRoleRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        MessageUtils.getMessage("admin.roles.not_found")));
    }

    private RoleDetailDto toRoleDto(SystemRoleEntity entity) {
        List<PermissionDto> permDtos = entity.getPermissions() != null
                ? entity.getPermissions().stream().map(this::toPermissionDto).toList()
                : Collections.emptyList();
        long userCount = systemUserRepository.countByRoleId(entity.getId());
        return RoleDetailDto.builder()
                .roleId(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .platform(entity.getPlatform())
                .scope(entity.getScope())
                .status(entity.getStatus() != null ? entity.getStatus().name() : CommonStatus.ACTIVE.name())
                .isActive(entity.getStatus() == CommonStatus.ACTIVE ? 1 : 0)
                .userCount((int) userCount)
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
                .displayOrder(entity.getDisplayOrder() != null ? entity.getDisplayOrder() : 0)
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
        private String platform;
        private String scope;
        private String status;
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
        private String platform;
        private String scope;
        private String status;
        private Integer isActive;
        private Integer userCount;
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
        private Integer displayOrder;
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
