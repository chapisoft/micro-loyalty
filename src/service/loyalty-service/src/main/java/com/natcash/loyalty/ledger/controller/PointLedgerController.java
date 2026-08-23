package com.natcash.loyalty.ledger.controller;

import com.natcash.loyalty.ledger.dto.PointLedgerDto.EarnPointRequest;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.EarnPointResponse;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.PointHistoryRequest;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.PointHistoryResponse;
import com.natcash.loyalty.ledger.service.PointLedgerService;
import com.natcash.loyalty.tenant.TenantContext;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/loyalty/v1")
public class PointLedgerController {

    private final PointLedgerService pointLedgerService;

    public PointLedgerController(PointLedgerService pointLedgerService) {
        this.pointLedgerService = pointLedgerService;
    }

    @PostMapping("/earn")
    public ResponseEntity<EarnPointResponse> earnPoints(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody EarnPointRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        EarnPointResponse response = pointLedgerService.earnPoints(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/point-history")
    public ResponseEntity<PointHistoryResponse> getPointHistory(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody PointHistoryRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        PointHistoryResponse response = pointLedgerService.getPointHistory(tenantId, request);
        return ResponseEntity.ok(response);
    }
}
