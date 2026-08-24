package com.natcash.loyalty.device.controller;

import com.natcash.loyalty.device.dto.DeviceRegistrationDto.DeviceRegisterRequest;
import com.natcash.loyalty.device.dto.DeviceRegistrationDto.DeviceRegisterResponse;
import com.natcash.loyalty.device.dto.DeviceRegistrationDto.DeviceUnregisterRequest;
import com.natcash.loyalty.device.dto.DeviceRegistrationDto.DeviceUnregisterResponse;
import com.natcash.loyalty.device.service.DeviceRegistrationService;
import com.natcash.loyalty.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/loyalty/v1/devices")
@Tag(name = "Device Registry API", description = "Đăng Ký & Quản Lý Thiết Bị Đa Thuê Bao")
public class DeviceRegistrationController {

    private final DeviceRegistrationService deviceService;

    public DeviceRegistrationController(DeviceRegistrationService deviceService) {
        this.deviceService = deviceService;
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký hoặc cập nhật FCM/APNs token của thiết bị", description = "Đồng bộ deviceId, token đẩy tin và ngôn ngữ theo đối tác")
    public ResponseEntity<DeviceRegisterResponse> registerDevice(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody DeviceRegisterRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        DeviceRegisterResponse response = deviceService.registerDevice(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/unregister")
    @Operation(summary = "Hủy kích hoạt thiết bị khi đăng xuất", description = "Vô hiệu hóa token thiết bị tránh gửi nhầm thông báo")
    public ResponseEntity<DeviceUnregisterResponse> unregisterDevice(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody DeviceUnregisterRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        DeviceUnregisterResponse response = deviceService.unregisterDevice(tenantId, request);
        return ResponseEntity.ok(response);
    }
}
