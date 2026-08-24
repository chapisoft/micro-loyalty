package com.natcash.loyalty.wheel.controller;

import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.SpinWheelRequest;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.SpinWheelResponse;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.WheelConfigRequest;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.WheelConfigResponse;
import com.natcash.loyalty.wheel.service.LuckyWheelService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/loyalty/v1/luckydraw")
@Tag(name = "Lucky Wheel API", description = "Vòng Quay May Mắn & Cơ Cấu Giải Thưởng")
public class LuckyWheelController {

    private final LuckyWheelService luckyWheelService;

    public LuckyWheelController(LuckyWheelService luckyWheelService) {
        this.luckyWheelService = luckyWheelService;
    }

    @GetMapping("/config")
    @Operation(summary = "Lấy cấu hình đĩa quay may mắn (GET)", description = "Trả về danh sách ô thưởng, màu sắc và lượt quay khả dụng")
    public ResponseEntity<WheelConfigResponse> getWheelConfigGet(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "wheelCode", required = false, defaultValue = "LUCKY_WHEEL") String wheelCode,
            @RequestParam(value = "externalUserId", required = false, defaultValue = "84988888888") String externalUserId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        WheelConfigRequest request = WheelConfigRequest.builder()
                .wheelCode(wheelCode)
                .externalUserId(externalUserId)
                .build();
        WheelConfigResponse response = luckyWheelService.getWheelConfig(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/config")
    @Operation(summary = "Lấy cấu hình đĩa quay may mắn (POST)", description = "Trả về danh sách ô thưởng, màu sắc, hình ảnh và lượt quay khả dụng")
    public ResponseEntity<WheelConfigResponse> getWheelConfig(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody(required = false) WheelConfigRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        WheelConfigResponse response = luckyWheelService.getWheelConfig(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/spin")
    @Operation(summary = "Thực hiện quay thưởng may mắn", description = "Kiểm tra khóa phân tán Redisson, trừ lượt/điểm, quay số ngẫu nhiên và khống chế ngân sách nguyên tử")
    public ResponseEntity<SpinWheelResponse> executeSpin(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody SpinWheelRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        SpinWheelResponse response = luckyWheelService.executeSpin(tenantId, request);
        return ResponseEntity.ok(response);
    }
}
