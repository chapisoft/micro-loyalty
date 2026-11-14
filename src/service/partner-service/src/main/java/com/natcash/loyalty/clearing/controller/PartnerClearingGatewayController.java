package com.natcash.loyalty.clearing.controller;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.clearing.service.ClearingSettlementService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.partner.service.PartnerOwnershipGuard;
import com.natcash.loyalty.partner.service.PartnerOwnershipGuard.PartnerIdentity;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.util.MessageUtils;
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

import java.util.Optional;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/loyalty/v1/partner/clearing")
@RequiredArgsConstructor
@Tag(name = "Partner Clearing Gateway API", description = "Cổng B2B Đối Soát & Quyết Toán Bù Trừ Dành Cho Đối Tác")
public class PartnerClearingGatewayController {

    private final ClearingSettlementService clearingService;
    private final PartnerOwnershipGuard ownershipGuard;
    private final LoyaltyPartnerRepository partnerRepository;

    @PostMapping("/reconciliation")
    @Operation(summary = "Đối tác tải dữ liệu đối soát kỳ", description = "Cung cấp bảng tổng hợp và chi tiết toàn bộ giao dịch tiêu/tích điểm của đối tác trong kỳ để đối soát 3 chiều")
    public ResponseEntity<PartnerReconciliationResponse> getReconciliation(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = "X-Partner-Code", required = false) String headerPartnerCode,
            @Valid @RequestBody PartnerReconciliationRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        String partnerCode = resolvePartnerCode(tenantId, headerPartnerCode);
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
        String partnerCode = resolvePartnerCode(tenantId, headerPartnerCode);
        PartnerDisputeResponse response = clearingService.createDispute(tenantId, partnerCode, request);
        return ResponseEntity.ok(response);
    }

    private String resolvePartnerCode(String tenantId, String headerPartnerCode) {
        Optional<PartnerIdentity> authenticatedPartner = ownershipGuard.resolveAuthenticatedPartner();
        if (authenticatedPartner.isPresent()) {
            Long partnerId = authenticatedPartner.get().partnerId();
            LoyaltyPartnerEntity partner = partnerRepository.findByIdAndTenantId(partnerId, tenantId)
                    .orElseThrow(() -> new LoyaltyException(
                            ErrorCode.PARTNER_NOT_FOUND,
                            MessageUtils.getMessage(ErrorCode.PARTNER_NOT_FOUND.getMessageKey())));
            return partner.getPartnerCode();
        }
        if (headerPartnerCode != null && !headerPartnerCode.isBlank()) {
            return headerPartnerCode.trim().toUpperCase();
        }
        throw new LoyaltyException(
                ErrorCode.VALIDATION_ERROR,
                MessageUtils.getMessage("clearing.error.partner_code_required"));
    }
}
