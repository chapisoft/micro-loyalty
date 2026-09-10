package com.natcash.loyalty.clearing.controller;

import com.natcash.loyalty.clearing.dto.ClearingDto.DisputeItemDto;
import com.natcash.loyalty.clearing.dto.ClearingDto.PartnerTransactionsResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.ResolveDisputeRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodResponse;
import com.natcash.loyalty.clearing.service.ClearingSettlementService;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

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
    @Operation(summary = "Quyết toán kết chuyển kỳ bù trừ", description = "Chốt danh sách giao dịch PENDING sang SETTLED và ghi sổ cái chốt kỳ")
    public ResponseEntity<SettlePeriodResponse> settlePeriod(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody SettlePeriodRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        SettlePeriodResponse response = clearingService.settlePeriod(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/partner-transactions")
    @Operation(summary = "Chi tiết giao dịch thành phần của đối tác", description = "Truy vấn danh sách các giao dịch thành phần phát sinh trong kỳ theo đối tác (Drill-down)")
    public ResponseEntity<PartnerTransactionsResponse> getPartnerTransactions(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam("partnerId") Long partnerId,
            @RequestParam("fromDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam("toDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        PartnerTransactionsResponse response = clearingService.getPartnerTransactions(tenantId, partnerId, fromDate, toDate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/disputes")
    @Operation(summary = "Danh sách khiếu nại sai lệch đối soát", description = "Lấy toàn bộ các trường hợp lệch đối soát được đối tác gửi lên")
    public ResponseEntity<List<DisputeItemDto>> getDisputes(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<DisputeItemDto> disputes = clearingService.getDisputes(tenantId);
        return ResponseEntity.ok(disputes);
    }

    @PostMapping("/disputes/{disputeCode}/resolve")
    @Operation(summary = "Xử lý kết luận khiếu nại sai lệch", description = "Cập nhật kết quả giải quyết khiếu nại đối soát")
    public ResponseEntity<DisputeItemDto> resolveDispute(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("disputeCode") String disputeCode,
            @Valid @RequestBody ResolveDisputeRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        DisputeItemDto result = clearingService.resolveDispute(tenantId, disputeCode, request);
        return ResponseEntity.ok(result);
    }
}
