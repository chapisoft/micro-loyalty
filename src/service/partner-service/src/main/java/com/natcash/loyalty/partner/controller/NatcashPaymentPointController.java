package com.natcash.loyalty.partner.controller;

import com.natcash.loyalty.codegeneration.domain.CodeType;
import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.partner.entity.PartnerBranchEntity;
import com.natcash.loyalty.partner.repository.PartnerBranchRepository;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/loyalty/v1/payment-points")
@RequiredArgsConstructor
@Tag(name = "Natcash Payment Points API", description = "Quản lý Điểm thanh toán nội bộ Natcash (LM-02)")
public class NatcashPaymentPointController {

    private final PartnerBranchRepository branchRepository;

    @GetMapping
    @Operation(summary = "Danh sách điểm thanh toán Natcash")
    public ResponseEntity<List<PartnerBranchEntity>> listPaymentPoints(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = resolveTenantId(headerTenantId);
        return ResponseEntity.ok(branchRepository.findByTenantIdAndIsNatcashOwnOrderByIdDesc(tenantId, Boolean.TRUE));
    }

    @PostMapping
    @Operation(summary = "Tạo mới điểm thanh toán Natcash")
    public ResponseEntity<PartnerBranchEntity> createPaymentPoint(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody PaymentPointRequest request) {
        String tenantId = resolveTenantId(headerTenantId);
        String code = request.getBranchCode() != null && !request.getBranchCode().isBlank()
                ? request.getBranchCode().trim()
                : CentralizedCodeGeneratorService.get().generateCode(CodeType.PARTNER_PAYMENT_POINT);

        PartnerBranchEntity entity = PartnerBranchEntity.builder()
                .tenantId(tenantId)
                .partnerId(request.getPartnerId())
                .branchCode(code)
                .branchName(request.getBranchName().trim())
                .paymentPointCode(request.getPaymentPointCode() != null ? request.getPaymentPointCode() : code)
                .isNatcashOwn(Boolean.TRUE)
                .province(request.getProvince())
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .phoneNumber(request.getPhoneNumber())
                .status(request.getStatus() != null ? request.getStatus() : CommonStatus.ACTIVE)
                .build();
        return ResponseEntity.ok(branchRepository.save(entity));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin điểm thanh toán Natcash")
    public ResponseEntity<PartnerBranchEntity> updatePaymentPoint(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id,
            @Valid @RequestBody PaymentPointRequest request) {
        String tenantId = resolveTenantId(headerTenantId);
        PartnerBranchEntity entity = branchRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));

        entity.setBranchName(request.getBranchName().trim());
        if (request.getPaymentPointCode() != null) {
            entity.setPaymentPointCode(request.getPaymentPointCode());
        }
        entity.setProvince(request.getProvince());
        entity.setAddress(request.getAddress());
        entity.setLatitude(request.getLatitude());
        entity.setLongitude(request.getLongitude());
        entity.setPhoneNumber(request.getPhoneNumber());
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }
        return ResponseEntity.ok(branchRepository.save(entity));
    }

    private String resolveTenantId(String headerTenantId) {
        return headerTenantId != null && !headerTenantId.isBlank()
                ? headerTenantId.trim()
                : TenantContext.getTenantId();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentPointRequest {
        private Long partnerId;
        private String branchCode;
        @NotBlank
        private String branchName;
        private String paymentPointCode;
        private String province;
        private String address;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private String phoneNumber;
        private CommonStatus status;
    }
}
