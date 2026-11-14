package com.natcash.loyalty.audit.controller;

import com.natcash.loyalty.audit.dto.AuditLogPageResponse;
import com.natcash.loyalty.audit.service.SystemAuditLogService;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = {"/api/audit-logs", "/loyalty/v1/admin/audit-logs", "/admin/audit-logs"})
@Tag(name = "Audit Logs API", description = "Quản lý Nhật Ký Hoạt Động & Kiểm Toán Hệ Thống")
public class AuditLogController {

    private final SystemAuditLogService auditLogService;

    public AuditLogController(SystemAuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách nhật ký hoạt động từ PostgreSQL 15+", description = "Truy vấn lịch sử thao tác hệ thống có phân trang và bộ lọc theo thuê bao")
    public ResponseEntity<AuditLogPageResponse> getAuditLogs(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "tenantId", required = false) String paramTenantId,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size,
            @RequestParam(value = "tableName", required = false) String tableName,
            @RequestParam(value = "operation", required = false) String operation,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "fromDate", required = false) String fromDate,
            @RequestParam(value = "toDate", required = false) String toDate) {

        String tenantId = paramTenantId != null && !paramTenantId.isBlank()
                ? paramTenantId
                : (headerTenantId != null && !headerTenantId.isBlank() ? headerTenantId : TenantContext.getTenantId());

        AuditLogPageResponse response = auditLogService.getAuditLogs(
                tenantId,
                tableName,
                operation,
                username,
                fromDate,
                toDate,
                page,
                size);

        return ResponseEntity.ok(response);
    }
}
