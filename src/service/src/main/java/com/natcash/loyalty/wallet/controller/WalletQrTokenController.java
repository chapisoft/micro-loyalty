package com.natcash.loyalty.wallet.controller;

import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.QrTokenGenerateRequest;
import com.natcash.loyalty.wallet.dto.RewardWalletDto.QrTokenGenerateResponse;
import com.natcash.loyalty.wallet.service.RewardWalletService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/loyalty/v1/wallet")
@RequiredArgsConstructor
@Tag(name = "Wallet QR 60s API", description = "Sinh mã QR động 60 giây cho Ví Phần Thưởng (LM-17)")
public class WalletQrTokenController {

    private final RewardWalletService rewardWalletService;

    @PostMapping("/qr-token")
    @Operation(summary = "Sinh mã QR thanh toán điểm TTL 60 giây")
    public ResponseEntity<QrTokenGenerateResponse> generateWalletQrToken(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody QrTokenGenerateRequest request) {
        String tenantId = headerTenantId != null && !headerTenantId.isBlank()
                ? headerTenantId.trim()
                : TenantContext.getTenantId();
        return ResponseEntity.ok(rewardWalletService.generateQrToken(tenantId, request));
    }
}
