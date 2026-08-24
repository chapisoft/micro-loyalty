package com.natcash.loyalty.wallet.controller;

import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/loyalty/v1/partners")
@Tag(name = "Partner Management API", description = "Quản lý Đối Tác Liên Minh")
public class PartnerController {

    @GetMapping
    @Operation(summary = "Lấy danh sách đối tác liên minh", description = "Trả về danh sách các đối tác bán lẻ, viễn thông, thanh toán trong hệ sinh thái")
    public ResponseEntity<List<PartnerResponse>> getPartners(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<PartnerResponse> partners = new ArrayList<>();

        if ("TENANT_NATCASH".equalsIgnoreCase(tenantId)) {
            partners.add(PartnerResponse.builder()
                    .id(1L)
                    .partnerCode("NATCASH_WALLET")
                    .partnerName("Ví Điện Tử Natcash Haïti")
                    .partnerType("BANKING")
                    .status("ACTIVE")
                    .description("Dịch vụ ví điện tử, chuyển tiền P2P và thanh toán số")
                    .shortCode("NCW")
                    .earnPolicyText("Hoàn tiền hóa đơn • Đổi data")
                    .build());
            partners.add(PartnerResponse.builder()
                    .id(2L)
                    .partnerCode("NATCOM_TELCO")
                    .partnerName("Tổng Công Ty Viễn Thông Natcom")
                    .partnerType("TELECOM")
                    .status("ACTIVE")
                    .description("Nạp thẻ di động, data 4G/5G và dịch vụ viễn thông")
                    .shortCode("NTC")
                    .earnPolicyText("Nạp thẻ • Đổi gói cước 4G")
                    .build());
            partners.add(PartnerResponse.builder()
                    .id(3L)
                    .partnerCode("EDH_POWER")
                    .partnerName("Tổng Công Ty Điện Lực Quốc Gia Haïti")
                    .partnerType("UTILITIES")
                    .status("ACTIVE")
                    .description("Thanh toán tiền điện sinh hoạt và doanh nghiệp")
                    .shortCode("EDH")
                    .earnPolicyText("Thanh toán hóa đơn điện")
                    .build());
        } else if ("TENANT_MICRO_CRM".equalsIgnoreCase(tenantId)) {
            partners.add(PartnerResponse.builder()
                    .id(1L)
                    .partnerCode("DELIMART_RETAIL")
                    .partnerName("Hệ Thống Siêu Thị Delimart")
                    .partnerType("RETAIL")
                    .status("ACTIVE")
                    .description("Chuỗi siêu thị bán lẻ Delimart toàn quốc")
                    .shortCode("DLM")
                    .earnPolicyText("Tích 1% • Tiêu tối đa 50% bill")
                    .build());
            partners.add(PartnerResponse.builder()
                    .id(2L)
                    .partnerCode("FAHASA_BOOKSTORE")
                    .partnerName("Nhà Sách Fahasa & Văn Phòng Phẩm")
                    .partnerType("RETAIL")
                    .status("ACTIVE")
                    .description("Hệ thống nhà sách và thiết bị giáo dục")
                    .shortCode("FHS")
                    .earnPolicyText("Giảm 20% đơn sách")
                    .build());
            partners.add(PartnerResponse.builder()
                    .id(3L)
                    .partnerCode("HIGHLANDS_COFFEE")
                    .partnerName("Chuỗi Cà Phê Highlands Coffee")
                    .partnerType("F_AND_B")
                    .status("ACTIVE")
                    .description("Đồ uống cà phê, trà và bánh ngọt")
                    .shortCode("HLC")
                    .earnPolicyText("Tích điểm • Đổi đồ uống miễn phí")
                    .build());
            partners.add(PartnerResponse.builder()
                    .id(4L)
                    .partnerCode("CGV_CINEMAS")
                    .partnerName("Cụm Rạp Chiếu Phim CGV Cinemas")
                    .partnerType("ENTERTAINMENT")
                    .status("ACTIVE")
                    .description("Vé xem phim 2D/3D/IMAX")
                    .shortCode("CGV")
                    .earnPolicyText("Giảm giá vé cuối tuần")
                    .build());
        } else {
            partners.add(PartnerResponse.builder()
                    .id(1L)
                    .partnerCode("DELIMART")
                    .partnerName("Siêu Thị Delimart Supermarket")
                    .partnerType("RETAIL")
                    .status("ACTIVE")
                    .description("Chuỗi siêu thị bán lẻ Delimart toàn quốc")
                    .shortCode("DLM")
                    .earnPolicyText("Tích 1% • Tiêu tối đa 50% bill")
                    .build());
            partners.add(PartnerResponse.builder()
                    .id(2L)
                    .partnerCode("NATCOM")
                    .partnerName("Tổng Công Ty Viễn Thông Natcom")
                    .partnerType("TELECOM")
                    .status("ACTIVE")
                    .description("Mạng viễn thông và dịch vụ dữ liệu 4G Natcom")
                    .shortCode("NTC")
                    .earnPolicyText("Nạp thẻ • Đổi gói cước 4G")
                    .build());
            partners.add(PartnerResponse.builder()
                    .id(3L)
                    .partnerCode("RINGME")
                    .partnerName("Cổng Dịch Vụ Số Ringme Entertainment")
                    .partnerType("ENTERTAINMENT")
                    .status("ACTIVE")
                    .description("Cổng dịch vụ số, xem phim và giải trí trực tuyến")
                    .shortCode("RGM")
                    .earnPolicyText("GameHub • Xem phim • Trúng thưởng")
                    .build());
            partners.add(PartnerResponse.builder()
                    .id(4L)
                    .partnerCode("NATCASH_WALLET")
                    .partnerName("Ví Điện Tử Natcash Haïti")
                    .partnerType("BANKING")
                    .status("ACTIVE")
                    .description("Ví điện tử và thanh toán số hàng đầu Haïti")
                    .shortCode("NCW")
                    .earnPolicyText("Thanh toán ví • Hoàn tiền")
                    .build());
        }

        return ResponseEntity.ok(partners);
    }

    @PostMapping
    @Operation(summary = "Cập nhật hoặc thêm đối tác liên minh mới", description = "Dành cho Quản trị viên CMS")
    public ResponseEntity<PartnerResponse> savePartner(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody PartnerResponse request) {
        return ResponseEntity.ok(request);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerResponse {
        private Long id;
        private String partnerCode;
        private String partnerName;
        private String partnerType;
        private String status;
        private String description;
        private String shortCode;
        private String earnPolicyText;
    }
}
