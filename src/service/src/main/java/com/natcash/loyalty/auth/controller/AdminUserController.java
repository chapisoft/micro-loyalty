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
@RequestMapping(value = {"/users", "/api/users", "/loyalty/v1/admin/users"})
@Tag(name = "Admin User Management API", description = "Quản lý Người Dùng Quản Trị CMS")
public class AdminUserController {

    private final Map<Long, AdminUserDto> userStore = new ConcurrentHashMap<>();

    public AdminUserController() {
        initDefaultUsers();
    }

    private void initDefaultUsers() {
        AdminRoleDto superAdminRole = AdminRoleDto.builder()
                .roleId(1L)
                .code("SUPER_ADMIN")
                .name("Quản Trị Tối Cao")
                .description("Toàn quyền quản trị toàn bộ hệ sinh thái Loyalty & GameHub")
                .isActive(1)
                .createdAt(Instant.now().toString())
                .updatedAt(Instant.now().toString())
                .build();

        AdminRoleDto operatorRole = AdminRoleDto.builder()
                .roleId(2L)
                .code("OPERATOR")
                .name("Quản Trị Vận Hành")
                .description("Vận hành chiến dịch, minigame và cấu hình voucher")
                .isActive(1)
                .createdAt(Instant.now().toString())
                .updatedAt(Instant.now().toString())
                .build();

        AdminRoleDto financeRole = AdminRoleDto.builder()
                .roleId(3L)
                .code("FINANCE_AUDITOR")
                .name("Kiểm Toán & Đối Soát Tài Chính")
                .description("Quyết toán kết chuyển kỳ bù trừ và đối soát liên minh")
                .isActive(1)
                .createdAt(Instant.now().toString())
                .updatedAt(Instant.now().toString())
                .build();

        addUser(1L, "admin", "admin@mid.io.vn", "Quản Trị Viên Hệ Thống", "+84988888888", Collections.singletonList(superAdminRole));
        addUser(2L, "loyalty_admin", "operator@mid.io.vn", "Nguyễn Văn Vận Hành", "+84977777777", Collections.singletonList(operatorRole));
        addUser(3L, "finance_auditor", "finance@mid.io.vn", "Trần Thị Đối Soát", "+84966666666", Collections.singletonList(financeRole));
    }

    private void addUser(Long id, String username, String email, String fullName, String phone, List<AdminRoleDto> roles) {
        userStore.put(id, AdminUserDto.builder()
                .userId(id)
                .username(username)
                .email(email)
                .fullName(fullName)
                .phone(phone)
                .isActive(1)
                .isLocked(0)
                .failedLoginAttempts(0)
                .lastLoginAt(Instant.now().toString())
                .createdAt(Instant.now().toString())
                .updatedAt(Instant.now().toString())
                .roles(roles)
                .build());
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách người dùng quản trị", description = "Truy vấn danh sách tài khoản CMS có phân trang")
    public ResponseEntity<AdminUserPageResponse> getUsers(
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size,
            @RequestParam(value = "search", required = false) String search) {

        List<AdminUserDto> list = new ArrayList<>(userStore.values());
        if (search != null && !search.isBlank()) {
            String s = search.toLowerCase().trim();
            list = list.stream()
                    .filter(u -> u.getUsername().toLowerCase().contains(s) || u.getFullName().toLowerCase().contains(s) || u.getEmail().toLowerCase().contains(s))
                    .collect(Collectors.toList());
        }

        Collections.sort(list, (a, b) -> Long.compare(a.getUserId() != null ? a.getUserId() : 0, b.getUserId() != null ? b.getUserId() : 0));

        int totalElements = list.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<AdminUserDto> pageContent = list.subList(fromIndex, toIndex);

        return ResponseEntity.ok(AdminUserPageResponse.builder()
                .status(200)
                .message("Lấy danh sách người dùng thành công")
                .data(pageContent)
                .users(pageContent)
                .totalElements(totalElements)
                .totalPages(totalPages > 0 ? totalPages : 1)
                .currentPage(page)
                .pageSize(size)
                .build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết người dùng", description = "Truy vấn thông tin tài khoản theo ID")
    public ResponseEntity<AdminUserDetailResponse> getUserById(@PathVariable("id") Long id) {
        AdminUserDto user = userStore.get(id);
        if (user == null) {
            user = AdminUserDto.builder()
                    .userId(id)
                    .username("user_" + id)
                    .email("user" + id + "@mid.io.vn")
                    .fullName("Người Dùng #" + id)
                    .isActive(1)
                    .isLocked(0)
                    .roles(Collections.emptyList())
                    .build();
        }
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(200)
                .message("Lấy thông tin thành công")
                .data(user)
                .build());
    }

    @PostMapping
    @Operation(summary = "Tạo mới người dùng quản trị", description = "Thêm tài khoản quản trị CMS mới")
    public ResponseEntity<AdminUserDetailResponse> createUser(@RequestBody AdminUserPayload payload) {
        Long newId = (long) (userStore.size() + 1);
        String username = payload.getUsername() != null ? payload.getUsername() : "user_" + newId;
        String email = payload.getEmail() != null ? payload.getEmail() : username + "@mid.io.vn";
        String fullName = payload.getFullName() != null ? payload.getFullName() : username;

        AdminUserDto user = AdminUserDto.builder()
                .userId(newId)
                .username(username)
                .email(email)
                .fullName(fullName)
                .phone(payload.getPhone() != null ? payload.getPhone() : "+84988888888")
                .isActive(1)
                .isLocked(0)
                .failedLoginAttempts(0)
                .createdAt(Instant.now().toString())
                .updatedAt(Instant.now().toString())
                .roles(Collections.singletonList(AdminRoleDto.builder()
                        .roleId(1L)
                        .code("ADMIN")
                        .name("Quản Trị Viên")
                        .description("Quyền quản trị viên")
                        .isActive(1)
                        .build()))
                .build();

        userStore.put(newId, user);
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(200)
                .message("Tạo tài khoản thành công")
                .data(user)
                .build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật người dùng quản trị", description = "Sửa đổi thông tin họ tên, email, số điện thoại")
    public ResponseEntity<AdminUserDetailResponse> updateUser(@PathVariable("id") Long id, @RequestBody AdminUserPayload payload) {
        AdminUserDto existing = userStore.get(id);
        if (existing == null) {
            existing = AdminUserDto.builder().userId(id).build();
        }
        if (payload.getFullName() != null) existing.setFullName(payload.getFullName());
        if (payload.getEmail() != null) existing.setEmail(payload.getEmail());
        if (payload.getPhone() != null) existing.setPhone(payload.getPhone());
        existing.setUpdatedAt(Instant.now().toString());

        userStore.put(id, existing);
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(200)
                .message("Cập nhật tài khoản thành công")
                .data(existing)
                .build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa người dùng", description = "Loại bỏ tài khoản khỏi hệ thống")
    public ResponseEntity<AdminUserDetailResponse> deleteUser(@PathVariable("id") Long id) {
        userStore.remove(id);
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(200)
                .message("Xóa tài khoản thành công")
                .build());
    }

    @PostMapping("/{id}/lock")
    @Operation(summary = "Khóa tài khoản người dùng", description = "Vô hiệu hóa quyền đăng nhập của người dùng")
    public ResponseEntity<AdminUserDetailResponse> lockUser(@PathVariable("id") Long id) {
        AdminUserDto existing = userStore.get(id);
        if (existing != null) {
            existing.setIsLocked(1);
            existing.setUpdatedAt(Instant.now().toString());
            userStore.put(id, existing);
        }
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(200)
                .message("Đã khóa tài khoản thành công")
                .data(existing)
                .build());
    }

    @PostMapping("/{id}/unlock")
    @Operation(summary = "Mở khóa tài khoản người dùng", description = "Kích hoạt lại quyền đăng nhập cho người dùng")
    public ResponseEntity<AdminUserDetailResponse> unlockUser(@PathVariable("id") Long id) {
        AdminUserDto existing = userStore.get(id);
        if (existing != null) {
            existing.setIsLocked(0);
            existing.setUpdatedAt(Instant.now().toString());
            userStore.put(id, existing);
        }
        return ResponseEntity.ok(AdminUserDetailResponse.builder()
                .status(200)
                .message("Đã mở khóa tài khoản thành công")
                .data(existing)
                .build());
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminUserPayload implements Serializable {
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
        private int status;
        private String message;
        private AdminUserDto data;
    }
}
