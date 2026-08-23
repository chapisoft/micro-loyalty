package com.natcash.loyalty.wallet.controller;

import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletInquiryRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletInquiryResponse;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletRedeemRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletRedeemResponse;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletRefundRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.RewardWalletRefundResponse;
import com.natcash.loyalty.wallet.service.RewardWalletService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/loyalty/v1/reward-wallet")
public class RewardWalletController {

    private final RewardWalletService rewardWalletService;

    public RewardWalletController(RewardWalletService rewardWalletService) {
        this.rewardWalletService = rewardWalletService;
    }

    @PostMapping("/inquiry")
    public ResponseEntity<RewardWalletInquiryResponse> inquiry(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody RewardWalletInquiryRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        RewardWalletInquiryResponse response = rewardWalletService.inquiry(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/redeem")
    public ResponseEntity<RewardWalletRedeemResponse> redeem(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody RewardWalletRedeemRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        RewardWalletRedeemResponse response = rewardWalletService.redeem(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refund")
    public ResponseEntity<RewardWalletRefundResponse> refund(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody RewardWalletRefundRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        RewardWalletRefundResponse response = rewardWalletService.refund(tenantId, request);
        return ResponseEntity.ok(response);
    }
}
