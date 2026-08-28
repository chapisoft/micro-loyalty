package com.natcash.loyalty.config.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping(value = {"/api/v1/system-parameters", "/loyalty/v1/system-parameters", "/system-parameters"})
@Tag(name = "System Parameters API", description = "Quản lý Tham số Nền tảng Loyalty & GameHub")
public class SystemParameterController {

    private final Map<String, SystemParameterDto> parameterStore = new ConcurrentHashMap<>();

    public SystemParameterController() {
        initDefaultParameters();
    }

    private void initDefaultParameters() {
        addParam("LOYALTY_POINT_EXCHANGE_RATE_HTG", "1.0", "Tỷ giá quy đổi điểm thưởng sang tiền tệ thanh toán (1 Điểm = 1 HTG)", 1);
        addParam("REWARD_WALLET_DYNAMIC_QR_TTL_SECONDS", "60", "Thời gian sống (TTL) của mã QR động thanh toán Ví Phần Thưởng tại POS", 2);
        addParam("REDISSON_LOCK_BURN_TIMEOUT_MS", "3000", "Thời gian chờ khóa phân tán Redisson RLock chống tiêu điểm kép", 3);
        addParam("HMAC_DRIFT_TOLERANCE_SECONDS", "300", "Dung sai lệch thời gian chữ ký số bảo mật HMAC-SHA256 (±300 giây)", 4);
        addParam("TIER_EVALUATION_CYCLE_MONTHS", "12", "Chu kỳ tự động đánh giá thăng hạng và hạ hạng hội viên (12 tháng)", 5);
        addParam("GAME_LUCKY_DRAW_FREE_DAILY_TURNS", "2", "Số lượt quay thưởng GameHub miễn phí mỗi ngày cho hội viên", 6);
        addParam("MAX_DAILY_BURN_PERCENTAGE", "50", "Tỷ lệ khấu trừ điểm tối đa trên tổng giá trị hóa đơn (50%)", 7);
        addParam("MIN_BURN_POINTS_TRANSACTION", "10", "Số điểm tối thiểu trong một giao dịch tiêu điểm", 8);
    }

    private void addParam(String key, String value, String desc, int id) {
        parameterStore.put(key, SystemParameterDto.builder()
                .id((long) id)
                .paramKey(key)
                .paramValue(value)
                .description(desc)
                .status(1)
                .createdAt(Instant.now().toString())
                .updatedAt(Instant.now().toString())
                .build());
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả tham số hệ thống", description = "Trả về danh sách tham số cấu hình nền tảng Loyalty")
    public ResponseEntity<List<SystemParameterDto>> getAllParameters() {
        List<SystemParameterDto> list = new ArrayList<>(parameterStore.values());
        Collections.sort(list, (a, b) -> Long.compare(a.getId() != null ? a.getId() : 0, b.getId() != null ? b.getId() : 0));
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{paramKey}")
    @Operation(summary = "Lấy chi tiết một tham số", description = "Tra cứu giá trị tham số theo khóa paramKey")
    public ResponseEntity<SystemParameterDto> getParameter(@PathVariable("paramKey") String paramKey) {
        SystemParameterDto dto = parameterStore.get(paramKey);
        if (dto == null) {
            dto = SystemParameterDto.builder()
                    .paramKey(paramKey)
                    .paramValue("")
                    .description("Tham số hệ thống " + paramKey)
                    .status(1)
                    .build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    @Operation(summary = "Thêm mới tham số hệ thống", description = "Tạo mới tham số cấu hình nền tảng")
    public ResponseEntity<SystemParameterDto> createParameter(@RequestBody SystemParameterDto request) {
        if (request.getParamKey() == null || request.getParamKey().isBlank()) {
            request.setParamKey("PARAM_" + System.currentTimeMillis());
        }
        request.setId((long) (parameterStore.size() + 1));
        request.setCreatedAt(Instant.now().toString());
        request.setUpdatedAt(Instant.now().toString());
        if (request.getStatus() == null) request.setStatus(1);

        parameterStore.put(request.getParamKey(), request);
        return ResponseEntity.ok(request);
    }

    @PutMapping("/{paramKey}")
    @Operation(summary = "Cập nhật tham số hệ thống", description = "Sửa đổi giá trị và mô tả của tham số cấu hình")
    public ResponseEntity<SystemParameterDto> updateParameter(
            @PathVariable("paramKey") String paramKey,
            @RequestBody SystemParameterDto request) {
        SystemParameterDto existing = parameterStore.get(paramKey);
        if (existing == null) {
            existing = SystemParameterDto.builder()
                    .id((long) (parameterStore.size() + 1))
                    .paramKey(paramKey)
                    .createdAt(Instant.now().toString())
                    .build();
        }

        if (request.getParamValue() != null) existing.setParamValue(request.getParamValue());
        if (request.getDescription() != null) existing.setDescription(request.getDescription());
        if (request.getStatus() != null) existing.setStatus(request.getStatus());
        existing.setUpdatedAt(Instant.now().toString());

        parameterStore.put(paramKey, existing);
        return ResponseEntity.ok(existing);
    }

    @DeleteMapping("/{paramKey}")
    @Operation(summary = "Xóa tham số hệ thống", description = "Loại bỏ tham số cấu hình khỏi hệ thống")
    public ResponseEntity<Void> deleteParameter(@PathVariable("paramKey") String paramKey) {
        parameterStore.remove(paramKey);
        return ResponseEntity.noContent().build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemParameterDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long id;
        private String paramKey;
        private String paramValue;
        private String description;
        private Integer status;
        private String createdAt;
        private String updatedAt;
    }
}
