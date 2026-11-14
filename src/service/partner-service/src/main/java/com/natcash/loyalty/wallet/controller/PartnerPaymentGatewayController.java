package com.natcash.loyalty.wallet.controller;

import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerInquiryRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerInquiryResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentAuthorizeRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentAuthorizeResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentCancelRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentCancelResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentConfirmRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentConfirmResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentDirectRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentDirectResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentRefundRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentRefundResponse;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentStatusRequest;
import com.natcash.loyalty.wallet.dto.PartnerGatewayDto.PartnerPaymentStatusResponse;
import com.natcash.loyalty.wallet.service.PartnerPaymentGatewayService;

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
@RequestMapping("/loyalty/v1/partner")
@RequiredArgsConstructor
@Tag(name = "Partner Payment Gateway API", description = "Cổng Thanh Toán & Khấu Trừ Điểm B2B Dành Cho Đối Tác Liên Minh")
public class PartnerPaymentGatewayController {

    private final PartnerPaymentGatewayService paymentService;

    @PostMapping("/inquiry")
    @Operation(summary = "Tra cứu số dư và chính sách tiêu điểm", description = "Đối tác gửi mã khách hàng hoặc mã QR để lấy số dư điểm khả dụng, tỷ giá quy đổi và danh sách voucher")
    public ResponseEntity<PartnerInquiryResponse> inquiry(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = "X-Partner-Code", required = false) String headerPartnerCode,
            @Valid @RequestBody PartnerInquiryRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        String partnerCode = headerPartnerCode != null ? headerPartnerCode : request.getPartnerCode();
        PartnerInquiryResponse response = paymentService.inquiry(tenantId, partnerCode, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/payment/authorize")
    @Operation(summary = "Tạm giữ điểm hóa đơn (Luồng 2 bước)", description = "Tạo phiên tạm giữ điểm (Hold) theo giá trị hóa đơn POS với thời gian sống TTL 10 phút")
    public ResponseEntity<PartnerPaymentAuthorizeResponse> authorize(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = "X-Partner-Code", required = false) String headerPartnerCode,
            @Valid @RequestBody PartnerPaymentAuthorizeRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        PartnerPaymentAuthorizeResponse response = paymentService.authorize(tenantId, headerPartnerCode, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/payment/confirm")
    @Operation(summary = "Xác nhận cấn trừ điểm chính thức", description = "POS gọi sau khi in hóa đơn để hoàn tất cấn trừ điểm thật, ghi Sổ cái và Giao dịch bù trừ")
    public ResponseEntity<PartnerPaymentConfirmResponse> confirm(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = "X-Partner-Code", required = false) String headerPartnerCode,
            @Valid @RequestBody PartnerPaymentConfirmRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        PartnerPaymentConfirmResponse response = paymentService.confirm(tenantId, headerPartnerCode, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/payment/cancel")
    @Operation(summary = "Hủy phiên tạm giữ điểm", description = "Giải phóng số điểm đang giữ khi khách hàng hủy đơn hàng tại POS")
    public ResponseEntity<PartnerPaymentCancelResponse> cancel(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = "X-Partner-Code", required = false) String headerPartnerCode,
            @Valid @RequestBody PartnerPaymentCancelRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        PartnerPaymentCancelResponse response = paymentService.cancel(tenantId, headerPartnerCode, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/payment/direct")
    @Operation(summary = "Thanh toán trừ điểm 1 chạm trực tiếp", description = "Thanh toán cấn trừ điểm tức thì trong 1 chu kỳ giao dịch atomic duy nhất qua mã Dynamic QR Token")
    public ResponseEntity<PartnerPaymentDirectResponse> directPayment(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = "X-Partner-Code", required = false) String headerPartnerCode,
            @Valid @RequestBody PartnerPaymentDirectRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        PartnerPaymentDirectResponse response = paymentService.directPayment(tenantId, headerPartnerCode, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/payment/refund")
    @Operation(summary = "Hoàn điểm hóa đơn", description = "Hoàn trả điểm vào ví hội viên khi đơn hàng bị trả hàng hoặc hủy sau thanh toán")
    public ResponseEntity<PartnerPaymentRefundResponse> refund(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = "X-Partner-Code", required = false) String headerPartnerCode,
            @Valid @RequestBody PartnerPaymentRefundRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        PartnerPaymentRefundResponse response = paymentService.refund(tenantId, headerPartnerCode, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/payment/status")
    @Operation(summary = "Truy vấn trạng thái giao dịch thanh toán", description = "Tra cứu chi tiết kết quả thanh toán theo mã transactionCode hoặc mã holdCode")
    public ResponseEntity<PartnerPaymentStatusResponse> getStatus(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = "X-Partner-Code", required = false) String headerPartnerCode,
            @RequestBody PartnerPaymentStatusRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        PartnerPaymentStatusResponse response = paymentService.getStatus(tenantId, headerPartnerCode, request);
        return ResponseEntity.ok(response);
    }
}
