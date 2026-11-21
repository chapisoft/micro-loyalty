package com.natcash.loyalty.wallet.controller;

import com.natcash.loyalty.audit.event.AuditLogEvent;
import com.natcash.loyalty.audit.service.SystemAuditLogService;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.security.SecurityContextUtils;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.util.MessageUtils;
import com.natcash.loyalty.wallet.dto.VoucherDto.CheckVoucherRequest;
import com.natcash.loyalty.wallet.dto.VoucherDto.CheckVoucherResponse;
import com.natcash.loyalty.wallet.dto.VoucherDto.CreateVoucherRequest;
import com.natcash.loyalty.wallet.dto.VoucherDto.RedeemDynamicVoucherRequest;
import com.natcash.loyalty.wallet.dto.VoucherDto.RedeemDynamicVoucherResponse;
import com.natcash.loyalty.wallet.dto.VoucherDto.RedeemVoucherRequest;
import com.natcash.loyalty.wallet.dto.VoucherDto.UseVoucherRequest;
import com.natcash.loyalty.wallet.dto.VoucherDto.UserVoucherResponse;
import com.natcash.loyalty.wallet.dto.VoucherDto.VoucherResponse;
import com.natcash.loyalty.wallet.dto.VoucherDto.VoucherUseCodeResponse;
import com.natcash.loyalty.wallet.service.VoucherDynamicCodeService;
import com.natcash.loyalty.wallet.service.VoucherService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/loyalty/v1/vouchers")
@Tag(name = "Voucher Management API", description = "Quản lý Phiếu Ưu Đãi & Kho Voucher Hội Viên")
public class VoucherController {

    private final VoucherService voucherService;
    private final VoucherDynamicCodeService voucherDynamicCodeService;
    private final SystemAuditLogService auditLogService;

    public VoucherController(
            VoucherService voucherService,
            VoucherDynamicCodeService voucherDynamicCodeService,
            SystemAuditLogService auditLogService) {
        this.voucherService = voucherService;
        this.voucherDynamicCodeService = voucherDynamicCodeService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả voucher khả dụng", description = "Trả về danh sách voucher của đối tác cho CMS và Portal")
    public ResponseEntity<List<VoucherResponse>> getAllVouchers(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "audience", required = false) String audience) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<VoucherResponse> vouchers = voucherService.getAllVouchers(tenantId, audience);
        return ResponseEntity.ok(vouchers);
    }

    @GetMapping("/my-vouchers")
    @Operation(summary = "Lấy kho voucher của người dùng", description = "Trả về danh sách voucher đã nhận/sở hữu của người dùng theo trạng thái")
    public ResponseEntity<List<UserVoucherResponse>> getMyVouchers(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "externalUserId", required = false) String externalUserId,
            @RequestParam(value = "status", required = false, defaultValue = "ALL") String status) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        String resolvedUserId = SecurityContextUtils.resolveUserId(externalUserId);
        List<UserVoucherResponse> userVouchers = voucherService.getUserVouchers(tenantId, resolvedUserId, status);
        return ResponseEntity.ok(userVouchers);
    }

    @PostMapping
    @Operation(summary = "Tạo mới voucher ưu đãi", description = "Dành cho Quản trị viên CMS tạo chiến dịch voucher")
    public ResponseEntity<VoucherResponse> createVoucher(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody CreateVoucherRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        VoucherResponse response = voucherService.createVoucher(tenantId, request);

        auditLogService.recordActionAsync(AuditLogEvent.builder()
                .tenantId(tenantId)
                .module("VOUCHER")
                .tableName("loyalty_vouchers")
                .operation("INSERT")
                .entityId(response.getVoucherCode() != null ? response.getVoucherCode() : "VCH_" + response.getId())
                .actorUsername(getActorUsername())
                .actorRole("ADMIN")
                .beforeData(null)
                .afterData(toVoucherJson(response))
                .description(MessageUtils.getMessage("voucher.audit.create", response.getTitle()))
                .status(CommonStatus.SUCCESS.name())
                .build());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật voucher ưu đãi", description = "Dành cho Quản trị viên CMS cập nhật chiến dịch voucher")
    public ResponseEntity<VoucherResponse> updateVoucher(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody CreateVoucherRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        VoucherResponse response = voucherService.updateVoucher(tenantId, id, request);

        auditLogService.recordActionAsync(AuditLogEvent.builder()
                .tenantId(tenantId)
                .module("VOUCHER")
                .tableName("loyalty_vouchers")
                .operation("UPDATE")
                .entityId(response.getVoucherCode() != null ? response.getVoucherCode() : "VCH_" + response.getId())
                .actorUsername(getActorUsername())
                .actorRole("ADMIN")
                .beforeData(null)
                .afterData(toVoucherJson(response))
                .description(MessageUtils.getMessage("voucher.audit.update", response.getTitle()))
                .status(CommonStatus.SUCCESS.name())
                .build());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa voucher", description = "Xóa voucher khỏi hệ thống")
    public ResponseEntity<Void> deleteVoucher(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        voucherService.deleteVoucher(tenantId, id);

        auditLogService.recordActionAsync(AuditLogEvent.builder()
                .tenantId(tenantId)
                .module("VOUCHER")
                .tableName("loyalty_vouchers")
                .operation("DELETE")
                .entityId("VCH_" + id)
                .actorUsername(getActorUsername())
                .actorRole("ADMIN")
                .beforeData(null)
                .afterData(null)
                .description(MessageUtils.getMessage("voucher.audit.delete", id))
                .status(CommonStatus.SUCCESS.name())
                .build());

        return ResponseEntity.ok().build();
    }

    @PostMapping("/redeem")
    @Operation(summary = "Đổi điểm lấy voucher", description = "Khấu trừ điểm thưởng để cấp mã voucher cho khách hàng")
    public ResponseEntity<UserVoucherResponse> redeemVoucher(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody RedeemVoucherRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        UserVoucherResponse response = voucherService.redeemVoucher(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{voucherCode}/collect")
    @Operation(summary = "Collect a free voucher", description = "Lưu voucher miễn phí vào My vouchers (giữ chỗ khi lưu, giới hạn theo đợt và theo khách)")
    public ResponseEntity<UserVoucherResponse> collectVoucher(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("voucherCode") String voucherCode,
            @RequestBody RedeemVoucherRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        return ResponseEntity.ok(voucherService.collectVoucher(tenantId, request.getExternalUserId(), voucherCode));
    }

    @PostMapping("/my-vouchers/{redemptionId}/use")
    @Operation(summary = "Sinh mã sử dụng voucher động (6-8 ký tự, TTL 5 phút)",
            description = "Người dùng bấm Sử dụng voucher để sinh mã động nén từ chuỗi cấu trúc ký bằng cặp khóa kèm QR/Barcode, hiệu lực theo tham số cấu hình (mặc định 5 phút)")
    public ResponseEntity<VoucherUseCodeResponse> generateUseCode(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("redemptionId") Long redemptionId,
            @RequestBody(required = false) UseVoucherRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        String requestedUserId = request != null ? request.getExternalUserId() : null;
        String resolvedUserId = SecurityContextUtils.resolveUserId(requestedUserId);
        return ResponseEntity.ok(voucherDynamicCodeService.generateUseCode(tenantId, redemptionId, resolvedUserId));
    }

    @PostMapping({"/checkVoucher", "/check-voucher"})
    @Operation(summary = "Kiểm tra tính hợp lệ và thời gian hiệu lực của mã voucher động",
            description = "Các hệ thống sử dụng gọi API checkVoucher để xác thực chuỗi mã động (6-8 ký tự), chữ ký cặp khóa và thời gian hiệu lực 5 phút trước khi cho phép áp dụng")
    public ResponseEntity<CheckVoucherResponse> checkVoucher(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody CheckVoucherRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        return ResponseEntity.ok(voucherDynamicCodeService.checkVoucher(tenantId, request));
    }

    @PostMapping("/redeem-dynamic")
    @Operation(summary = "Xác nhận sử dụng mã voucher động cho giao dịch",
            description = "Kiểm tra checkVoucher và gạch nợ nguyên tử mã voucher động (Single-Use)")
    public ResponseEntity<RedeemDynamicVoucherResponse> redeemDynamicVoucher(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody RedeemDynamicVoucherRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        return ResponseEntity.ok(voucherDynamicCodeService.redeemDynamicVoucher(tenantId, request));
    }

    @PostMapping("/batch-import")
    @Operation(summary = "Import hàng loạt voucher bằng CSV/JSON", description = "Dành cho Quản trị viên CMS import danh sách voucher")
    public ResponseEntity<List<VoucherResponse>> batchImportVouchers(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody List<CreateVoucherRequest> requests) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<VoucherResponse> response = voucherService.batchImportVouchers(tenantId, requests);
        return ResponseEntity.ok(response);
    }

    private String getActorUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().isBlank()) {
                return auth.getName();
            }
        } catch (Exception ignored) {
        }
        return "admin";
    }

    private String toVoucherJson(VoucherResponse v) {
        if (v == null)
            return null;
        return String.format(
                "{\"id\":%d,\"voucherCode\":\"%s\",\"title\":\"%s\",\"status\":\"%s\"}",
                v.getId(),
                escapeJson(v.getVoucherCode()),
                escapeJson(v.getTitle()),
                v.getStatus() != null ? v.getStatus().name() : VoucherStatus.ACTIVE.name());
    }

    private String escapeJson(String str) {
        if (str == null)
            return "";
        return str.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
