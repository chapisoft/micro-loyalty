package com.natcash.loyalty.outbox.controller;

import com.natcash.loyalty.outbox.entity.WebhookDeadLetterEntity;
import com.natcash.loyalty.outbox.service.OutboxService;
import com.natcash.loyalty.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/loyalty/v1/admin/dead-letter")
@Tag(name = "Webhook Dead-Letter Management", description = "Quản Trị & Bơm Gửi Bù Webhook Lỗi Mạng")
public class WebhookDeadLetterController {

    private final OutboxService outboxService;

    public WebhookDeadLetterController(OutboxService outboxService) {
        this.outboxService = outboxService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách các sự kiện Webhook trong hàng đợi Dead-Letter")
    public ResponseEntity<List<WebhookDeadLetterEntity>> getDeadLetters(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<WebhookDeadLetterEntity> list = outboxService.getDeadLetters(tenantId);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{id}/retrigger")
    @Operation(summary = "Bơm gửi lại 1 sự kiện Dead-Letter vào hàng đợi Outbox")
    public ResponseEntity<Map<String, Object>> retriggerDeadLetter(@PathVariable("id") Long id) {
        boolean success = outboxService.retriggerDeadLetter(id);
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Đã chuyển sự kiện vào hàng đợi Outbox để gửi lại" : "Không tìm thấy bản ghi Dead Letter"
        ));
    }

    @PostMapping("/batch-retrigger")
    @Operation(summary = "Bơm gửi lại toàn bộ sự kiện Dead-Letter của Tenant")
    public ResponseEntity<Map<String, Object>> batchRetriggerDeadLetters(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        int count = outboxService.batchRetriggerDeadLetters(tenantId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "retriggeredCount", count,
                "message", "Đã chuyển toàn bộ " + count + " sự kiện vào hàng đợi Outbox để phát lại"
        ));
    }
}
