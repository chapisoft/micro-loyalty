package com.natcash.loyalty.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
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
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping(value = {"/roles", "/api/roles", "/loyalty/v1/admin/roles"})
@Tag(name = "Admin Role & Permission Management API", description = "Quản lý Vai Trò & Phân Quyền CMS")
public class AdminRoleController {

    private final Map<Long, RoleDetailDto> roleStore = new ConcurrentHashMap<>();
    private final List<PermissionDto> permissionList = new ArrayList<>();

    public AdminRoleController() {
        initPermissions();
        initDefaultRoles();
    }

    private void initPermissions() {
        long id = 1;
        permissionList.add(PermissionDto.builder().permissionId(id++).code("USER_MGMT").name("Quản lý Người Dùng").module("USER").action("ALL").isActive(1).build());
        permissionList.add(PermissionDto.builder().permissionId(id++).code("ROLE_MGMT").name("Quản lý Vai Trò").module("ROLE").action("ALL").isActive(1).build());
        permissionList.add(PermissionDto.builder().permissionId(id++).code("POLICY_MGMT").name("Quản lý Chính Sách").module("POLICY").action("ALL").isActive(1).build());
        permissionList.add(PermissionDto.builder().permissionId(id++).code("VOUCHER_MGMT").name("Quản lý Voucher").module("VOUCHER").action("ALL").isActive(1).build());
        permissionList.add(PermissionDto.builder().permissionId(id++).code("GAME_MGMT").name("Quản lý GameHub").module("GAME").action("ALL").isActive(1).build());
        permissionList.add(PermissionDto.builder().permissionId(id++).code("CLEARING_MGMT").name("Quyết Toán Bù Trừ").module("CLEARING").action("ALL").isActive(1).build());
        permissionList.add(PermissionDto.builder().permissionId(id++).code("AUDIT_LOG_VIEW").name("Xem Nhật Ký Kiểm Toán").module("AUDIT").action("READ").isActive(1).build());
        permissionList.add(PermissionDto.builder().permissionId(id++).code("SYSTEM_PARAM_MGMT").name("Cấu Hình Tham Số").module("SYSTEM").action("ALL").isActive(1).build());
    }

    private void initDefaultRoles() {
        roleStore.put(1L, RoleDetailDto.builder()
                .roleId(1L)
                .code("SUPER_ADMIN")
                .name("Quản Trị Tối Cao")
                .description("Toàn quyền quản trị toàn bộ hệ sinh thái Loyalty & GameHub")
                .isActive(1)
                .createdAt(Instant.now().toString())
                .updatedAt(Instant.now().toString())
                .permissions(new ArrayList<>(permissionList))
                .build());

        roleStore.put(2L, RoleDetailDto.builder()
                .roleId(2L)
                .code("OPERATOR")
                .name("Quản Trị Vận Hành")
                .description("Vận hành minigame, chiến dịch điểm thưởng và voucher")
                .isActive(1)
                .createdAt(Instant.now().toString())
                .updatedAt(Instant.now().toString())
                .permissions(permissionList.stream().filter(p -> p.getCode().contains("GAME") || p.getCode().contains("VOUCHER")).collect(Collectors.toList()))
                .build());

        roleStore.put(3L, RoleDetailDto.builder()
                .roleId(3L)
                .code("FINANCE_AUDITOR")
                .name("Kiểm Toán & Đối Soát Tài Chính")
                .description("Quyết toán kết chuyển kỳ bù trừ và đối soát liên minh")
                .isActive(1)
                .createdAt(Instant.now().toString())
                .updatedAt(Instant.now().toString())
                .permissions(permissionList.stream().filter(p -> p.getCode().contains("CLEARING") || p.getCode().contains("AUDIT")).collect(Collectors.toList()))
                .build());
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách vai trò", description = "Truy vấn danh sách vai trò có phân trang")
    public ResponseEntity<RolePageResponse> getRoles(
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size) {

        List<RoleDetailDto> list = new ArrayList<>(roleStore.values());
        Collections.sort(list, (a, b) -> Long.compare(a.getRoleId() != null ? a.getRoleId() : 0, b.getRoleId() != null ? b.getRoleId() : 0));

        int totalElements = list.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<RoleDetailDto> pageContent = list.subList(fromIndex, toIndex);

        return ResponseEntity.ok(RolePageResponse.builder()
                .status(200)
                .message("Lấy danh sách vai trò thành công")
                .data(pageContent)
                .roles(pageContent)
                .totalElements(totalElements)
                .totalPages(totalPages > 0 ? totalPages : 1)
                .currentPage(page)
                .pageSize(size)
                .build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết vai trò", description = "Truy vấn vai trò kèm danh sách quyền hạn")
    public ResponseEntity<RoleDetailResponse> getRoleById(@PathVariable("id") Long id) {
        RoleDetailDto role = roleStore.get(id);
        if (role == null) {
            role = RoleDetailDto.builder()
                    .roleId(id)
                    .code("ROLE_" + id)
                    .name("Vai trò #" + id)
                    .description("Mô tả vai trò")
                    .isActive(1)
                    .permissions(Collections.emptyList())
                    .build();
        }
        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(200)
                .message("Lấy thông tin vai trò thành công")
                .data(role)
                .build());
    }

    @PostMapping
    @Operation(summary = "Tạo mới vai trò", description = "Thêm vai trò quản trị mới")
    public ResponseEntity<RoleDetailResponse> createRole(@RequestBody RolePayload payload) {
        Long newId = (long) (roleStore.size() + 1);
        String code = payload.getCode() != null ? payload.getCode().toUpperCase().trim() : "ROLE_" + newId;
        String name = payload.getName() != null ? payload.getName() : code;

        List<PermissionDto> perms = new ArrayList<>();
        if (payload.getPermissionIds() != null) {
            perms = permissionList.stream()
                    .filter(p -> payload.getPermissionIds().contains(p.getPermissionId()))
                    .collect(Collectors.toList());
        }

        RoleDetailDto role = RoleDetailDto.builder()
                .roleId(newId)
                .code(code)
                .name(name)
                .description(payload.getDescription())
                .isActive(1)
                .createdAt(Instant.now().toString())
                .updatedAt(Instant.now().toString())
                .permissions(perms)
                .build();

        roleStore.put(newId, role);
        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(200)
                .message("Tạo vai trò thành công")
                .data(role)
                .build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật vai trò", description = "Sửa đổi tên, mô tả và danh sách quyền hạn")
    public ResponseEntity<RoleDetailResponse> updateRole(@PathVariable("id") Long id, @RequestBody RolePayload payload) {
        RoleDetailDto existing = roleStore.get(id);
        if (existing == null) {
            existing = RoleDetailDto.builder().roleId(id).build();
        }
        if (payload.getName() != null) existing.setName(payload.getName());
        if (payload.getDescription() != null) existing.setDescription(payload.getDescription());
        if (payload.getCode() != null) existing.setCode(payload.getCode().toUpperCase().trim());

        if (payload.getPermissionIds() != null) {
            List<PermissionDto> perms = permissionList.stream()
                    .filter(p -> payload.getPermissionIds().contains(p.getPermissionId()))
                    .collect(Collectors.toList());
            existing.setPermissions(perms);
        }
        existing.setUpdatedAt(Instant.now().toString());

        roleStore.put(id, existing);
        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(200)
                .message("Cập nhật vai trò thành công")
                .data(existing)
                .build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa vai trò", description = "Loại bỏ vai trò khỏi hệ thống")
    public ResponseEntity<RoleDetailResponse> deleteRole(@PathVariable("id") Long id) {
        roleStore.remove(id);
        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(200)
                .message("Xóa vai trò thành công")
                .build());
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Phê duyệt vai trò", description = "Kích hoạt trạng thái hoạt động của vai trò")
    public ResponseEntity<RoleDetailResponse> approveRole(@PathVariable("id") Long id) {
        RoleDetailDto existing = roleStore.get(id);
        if (existing != null) {
            existing.setIsActive(1);
            existing.setUpdatedAt(Instant.now().toString());
            roleStore.put(id, existing);
        }
        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(200)
                .message("Đã phê duyệt vai trò thành công")
                .data(existing)
                .build());
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối vai trò", description = "Vô hiệu hóa vai trò")
    public ResponseEntity<RoleDetailResponse> rejectRole(@PathVariable("id") Long id, @RequestBody(required = false) Map<String, String> body) {
        RoleDetailDto existing = roleStore.get(id);
        if (existing != null) {
            existing.setIsActive(0);
            existing.setUpdatedAt(Instant.now().toString());
            roleStore.put(id, existing);
        }
        return ResponseEntity.ok(RoleDetailResponse.builder()
                .status(200)
                .message("Đã từ chối vai trò")
                .data(existing)
                .build());
    }

    @GetMapping("/permissions")
    @Operation(summary = "Lấy danh sách tất cả quyền hạn", description = "Danh sách quyền theo phân hệ chức năng")
    public ResponseEntity<PermissionListResponse> getPermissions() {
        return ResponseEntity.ok(PermissionListResponse.builder()
                .status(200)
                .message("Lấy danh sách quyền thành công")
                .data(permissionList)
                .build());
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RolePayload implements Serializable {
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
        private int status;
        private String message;
        private RoleDetailDto data;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionListResponse implements Serializable {
        private int status;
        private String message;
        private List<PermissionDto> data;
    }
}
