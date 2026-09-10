package com.natcash.loyalty.clearing.controller;

import com.natcash.loyalty.clearing.service.ClearingSettlementService;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerDisputeRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerDisputeResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerReconciliationRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerReconciliationResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/loyalty/v1/partner/clearing")
@RequiredArgsConstructor
@Tag(name = "Partner Clearing Gateway API", description = "Cổng B2B Đối Soát & Quyết Toán Bù Trừ Dành Cho Đối Tác")
public class PartnerClearingGatewayController {

    private final ClearingSettlementService clearingService;

    @PostMapping("/reconciliation")
    @Operation(summary = "Đối tác tải dữ liệu đối soát kỳ", description = "Cung cấp bảng tổng hợp và chi tiết toàn bộ giao dịch tiêu/tích điểm của đối tác trong kỳ để đối soát 3 chiều")
    public ResponseEntity<PartnerReconciliationResponse> getReconciliation(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = "X-Partner-Code", required = false) String headerPartnerCode,
            @Valid @RequestBody PartnerReconciliationRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        String partnerCode = headerPartnerCode != null ? headerPartnerCode : "DELIMART";
        PartnerReconciliationResponse response = clearingService.getPartnerReconciliation(tenantId, partnerCode, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/dispute")
    @Operation(summary = "Mở khiếu nại sai lệch đối soát", description = "Đối tác gửi thông tin sai lệch (thừa/thiếu/lệch số tiền) để phòng Kế toán Loyalty kiểm tra và xử lý")
    public ResponseEntity<PartnerDisputeResponse> createDispute(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = "X-Partner-Code", required = false) String headerPartnerCode,
            @Valid @RequestBody PartnerDisputeRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        String partnerCode = headerPartnerCode != null ? headerPartnerCode : "DELIMART";
        PartnerDisputeResponse response = clearingService.createDispute(tenantId, partnerCode, request);
        return ResponseEntity.ok(response);
    }
}
