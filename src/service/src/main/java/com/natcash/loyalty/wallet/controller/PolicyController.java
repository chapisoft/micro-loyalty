package com.natcash.loyalty.wallet.controller;

import com.natcash.loyalty.domain.enums.CommonStatus;
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

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/loyalty/v1/policies")
@Tag(name = "Policy Configuration API", description = "Quản lý Chính Sách Tích & Tiêu Điểm")
public class PolicyController {

    @GetMapping
    @Operation(summary = "Lấy danh sách chính sách tích tiêu điểm", description = "Trả về danh sách chính sách tích lũy và khấu trừ điểm tại các điểm bán")
    public ResponseEntity<List<PolicyResponse>> getPolicies(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<PolicyResponse> policies = new ArrayList<>();

        if ("TENANT_NATCASH".equalsIgnoreCase(tenantId)) {
            policies.add(PolicyResponse.builder()
                    .id(1L)
                    .code("EARN_TELCO_TOPUP")
                    .name("Chính Sách Tích Điểm Nạp Cước Natcom")
                    .partnerCode("NATCOM_TELCO")
                    .partnerName("Viễn Thông Natcom")
                    .type("EARN")
                    .earnRatePercent(new BigDecimal("2.00"))
                    .exchangeRate(new BigDecimal("1.0000"))
                    .minBillAmount(new BigDecimal("50.00"))
                    .maxBurnPercentage(new BigDecimal("100.00"))
                    .status(CommonStatus.ACTIVE)
                    .description("Tích 2% cho mỗi giao dịch nạp tiền trực tuyến hoặc nạp thẻ cào")
                    .build());
            policies.add(PolicyResponse.builder()
                    .id(2L)
                    .code("BURN_NATCASH_PAYMENT")
                    .name("Chính Sách Khấu Trừ Điểm Thanh Toán Ví")
                    .partnerCode("NATCASH_WALLET")
                    .partnerName("Ví Điện Tử Natcash")
                    .type("BURN")
                    .earnRatePercent(BigDecimal.ZERO)
                    .exchangeRate(new BigDecimal("1.0000"))
                    .minBillAmount(new BigDecimal("10.00"))
                    .maxBurnPercentage(new BigDecimal("100.00"))
                    .status(CommonStatus.ACTIVE)
                    .description("Khấu trừ tối đa 100% khi thanh toán cước, data 4G và hóa đơn dịch vụ")
                    .build());
        } else {
            policies.add(PolicyResponse.builder()
                    .id(1L)
                    .code("EARN_RETAIL_DEFAULT")
                    .name("Chính Sách Tích Điểm Bán Lẻ Siêu Thị")
                    .partnerCode("DELIMART")
                    .partnerName("Siêu Thị Delimart")
                    .type("EARN")
                    .earnRatePercent(new BigDecimal("1.00"))
                    .exchangeRate(new BigDecimal("1.0000"))
                    .minBillAmount(new BigDecimal("50.00"))
                    .maxBurnPercentage(new BigDecimal("50.00"))
                    .status(CommonStatus.ACTIVE)
                    .description("Tích 1% giá trị hóa đơn cho mỗi giao dịch mua sắm")
                    .build());

            policies.add(PolicyResponse.builder()
                    .id(2L)
                    .code("BURN_RETAIL_DEFAULT")
                    .name("Chính Sách Tiêu Điểm Tại Quầy Thu Ngân")
                    .partnerCode("DELIMART")
                    .partnerName("Siêu Thị Delimart")
                    .type("BURN")
                    .earnRatePercent(BigDecimal.ZERO)
                    .exchangeRate(new BigDecimal("1.0000"))
                    .minBillAmount(new BigDecimal("10.00"))
                    .maxBurnPercentage(new BigDecimal("50.00"))
                    .status(CommonStatus.ACTIVE)
                    .description("Khấu trừ tối đa 50% tổng giá trị hóa đơn thanh toán")
                    .build());

            policies.add(PolicyResponse.builder()
                    .id(3L)
                    .code("EARN_TELECOM_TOPUP")
                    .name("Chính Sách Tích Điểm Nạp Cước Viễn Thông")
                    .partnerCode("NATCOM")
                    .partnerName("Tổng Công Ty Natcom")
                    .type("EARN")
                    .earnRatePercent(new BigDecimal("2.00"))
                    .exchangeRate(new BigDecimal("1.0000"))
                    .minBillAmount(new BigDecimal("100.00"))
                    .maxBurnPercentage(new BigDecimal("100.00"))
                    .status(CommonStatus.ACTIVE)
                    .description("Tích 2% cho giao dịch nạp tiền trực tuyến hoặc mua gói 4G")
                    .build());
        }

        return ResponseEntity.ok(policies);
    }

    @PostMapping
    @Operation(summary = "Cập nhật chính sách tích tiêu điểm", description = "Dành cho Quản trị viên CMS điều chỉnh tham số chính sách")
    public ResponseEntity<PolicyResponse> updatePolicy(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody PolicyResponse request) {
        return ResponseEntity.ok(request);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PolicyResponse {
        private Long id;
        private String code;
        private String name;
        private String partnerCode;
        private String partnerName;
        private String type;
        private BigDecimal earnRatePercent;
        private BigDecimal exchangeRate;
        private BigDecimal minBillAmount;
        private BigDecimal maxBurnPercentage;
        private CommonStatus status;
        private String description;
    }
}
