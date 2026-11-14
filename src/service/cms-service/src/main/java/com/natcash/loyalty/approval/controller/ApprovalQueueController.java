package com.natcash.loyalty.approval.controller;

import com.natcash.loyalty.approval.dto.ApprovalDto.ApprovalItemResponse;
import com.natcash.loyalty.approval.dto.ApprovalDto.ApprovalPageResponse;
import com.natcash.loyalty.approval.dto.ApprovalDto.ApproveActionRequest;
import com.natcash.loyalty.approval.dto.ApprovalDto.CreateApprovalRequest;
import com.natcash.loyalty.approval.dto.ApprovalDto.RejectActionRequest;
import com.natcash.loyalty.approval.service.ApprovalQueueService;
import com.natcash.loyalty.domain.enums.ApprovalStatus;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/loyalty/v1/approvals")
@RequiredArgsConstructor
@Tag(name = "Approval Queue API", description = "Hàng đợi phê duyệt hai cấp Maker-Checker (QT-04)")
public class ApprovalQueueController {

    private final ApprovalQueueService approvalQueueService;

    @GetMapping
    @Operation(summary = "Danh sách yêu cầu phê duyệt Maker-Checker")
    public ResponseEntity<ApprovalPageResponse> listApprovals(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "status", required = false) ApprovalStatus status,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size) {
        String tenantId = resolveTenantId(headerTenantId);
        return ResponseEntity.ok(approvalQueueService.listApprovals(tenantId, status, page, size));
    }

    @PostMapping
    @Operation(summary = "Tạo yêu cầu chờ duyệt mới")
    public ResponseEntity<ApprovalItemResponse> createApproval(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody CreateApprovalRequest request) {
        String tenantId = resolveTenantId(headerTenantId);
        return ResponseEntity.ok(approvalQueueService.submitRequest(tenantId, request));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Phê duyệt yêu cầu (Checker khác Maker)")
    public ResponseEntity<ApprovalItemResponse> approve(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id,
            @RequestBody(required = false) ApproveActionRequest request) {
        String tenantId = resolveTenantId(headerTenantId);
        String checker = request != null ? request.getCheckerUsername() : null;
        String note = request != null ? request.getNote() : null;
        return ResponseEntity.ok(approvalQueueService.approve(tenantId, id, checker, note));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối yêu cầu phê duyệt")
    public ResponseEntity<ApprovalItemResponse> reject(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id,
            @Valid @RequestBody RejectActionRequest request) {
        String tenantId = resolveTenantId(headerTenantId);
        return ResponseEntity.ok(approvalQueueService.reject(
                tenantId, id, request.getCheckerUsername(), request.getRejectReason()));
    }

    private String resolveTenantId(String headerTenantId) {
        return headerTenantId != null && !headerTenantId.isBlank()
                ? headerTenantId.trim()
                : TenantContext.getTenantId();
    }
}
