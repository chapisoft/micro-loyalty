package com.natcash.loyalty.wallet.controller;

import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.wallet.dto.VoucherDto.CreateVoucherRequest;
import com.natcash.loyalty.wallet.dto.VoucherDto.RedeemVoucherRequest;
import com.natcash.loyalty.wallet.dto.VoucherDto.UserVoucherResponse;
import com.natcash.loyalty.wallet.dto.VoucherDto.VoucherResponse;
import com.natcash.loyalty.wallet.service.VoucherService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
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

    public VoucherController(VoucherService voucherService) {
        this.voucherService = voucherService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả voucher khả dụng", description = "Trả về danh sách voucher của đối tác cho CMS và Portal")
    public ResponseEntity<List<VoucherResponse>> getAllVouchers(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<VoucherResponse> vouchers = voucherService.getAllVouchers(tenantId);
        return ResponseEntity.ok(vouchers);
    }

    @GetMapping("/my-vouchers")
    @Operation(summary = "Lấy kho voucher của người dùng", description = "Trả về danh sách voucher đã nhận/sở hữu của người dùng theo trạng thái")
    public ResponseEntity<List<UserVoucherResponse>> getMyVouchers(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "externalUserId", required = false, defaultValue = "84988888888") String externalUserId,
            @RequestParam(value = "status", required = false, defaultValue = "ALL") String status) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<UserVoucherResponse> userVouchers = voucherService.getUserVouchers(tenantId, externalUserId, status);
        return ResponseEntity.ok(userVouchers);
    }

    @PostMapping
    @Operation(summary = "Tạo mới voucher ưu đãi", description = "Dành cho Quản trị viên CMS tạo chiến dịch voucher")
    public ResponseEntity<VoucherResponse> createVoucher(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody CreateVoucherRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        VoucherResponse response = voucherService.createVoucher(tenantId, request);
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
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa voucher", description = "Xóa voucher khỏi hệ thống")
    public ResponseEntity<Void> deleteVoucher(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        voucherService.deleteVoucher(tenantId, id);
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

    @PostMapping("/batch-import")
    @Operation(summary = "Import hàng loạt voucher bằng CSV/JSON", description = "Dành cho Quản trị viên CMS import danh sách voucher")
    public ResponseEntity<List<VoucherResponse>> batchImportVouchers(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody List<CreateVoucherRequest> requests) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<VoucherResponse> response = voucherService.batchImportVouchers(tenantId, requests);
        return ResponseEntity.ok(response);
    }
}
