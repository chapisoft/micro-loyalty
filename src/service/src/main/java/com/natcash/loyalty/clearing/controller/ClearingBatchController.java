package com.natcash.loyalty.clearing.controller;

import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodResponse;
import com.natcash.loyalty.clearing.service.ClearingSettlementService;
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
@RequestMapping("/loyalty/v1/clearinghouse")
@Tag(name = "Clearinghouse API", description = "Bù Trừ & Quyết Toán Tài Chính Đa Phương")
public class ClearingBatchController {

    private final ClearingSettlementService clearingService;

    public ClearingBatchController(ClearingSettlementService clearingService) {
        this.clearingService = clearingService;
    }

    @PostMapping("/reconciliation-report")
    @Operation(summary = "Báo cáo đối soát bù trừ tài chính", description = "Tổng hợp khối lượng giao dịch phát hành vs tiêu dùng điểm, tính công nợ ròng theo kỳ")
    public ResponseEntity<ReconciliationReportResponse> getReconciliationReport(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody ReconciliationReportRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        ReconciliationReportResponse response = clearingService.getReconciliationReport(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/settle-period")
    @Operation(summary = "Quyết toán kết chuyển kỳ bù trừ", description = "Chốt danh sách giao dịch PENDING sang SETTLED và sinh mã lô quyết toán")
    public ResponseEntity<SettlePeriodResponse> settlePeriod(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody SettlePeriodRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        SettlePeriodResponse response = clearingService.settlePeriod(tenantId, request);
        return ResponseEntity.ok(response);
    }
}
