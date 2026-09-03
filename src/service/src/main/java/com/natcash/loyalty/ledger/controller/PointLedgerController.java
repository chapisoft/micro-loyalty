package com.natcash.loyalty.ledger.controller;

import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.EarnPointRequest;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.EarnPointResponse;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.PointHistoryRequest;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.PointHistoryResponse;
import com.natcash.loyalty.ledger.service.PointLedgerService;
import com.natcash.loyalty.tenant.TenantContext;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    @GetMapping("/ledger")
    public ResponseEntity<PointHistoryResponse> getLedgerGet(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "externalUserId", required = false) String externalUserId,
            @RequestParam(value = "actionType", required = false) PointActionType actionType,
            @RequestParam(value = "partnerCode", required = false) String partnerCode,
            @RequestParam(value = "partnerId", required = false) Long partnerId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "15") int size) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        PointHistoryRequest request = PointHistoryRequest.builder()
                .externalUserId(externalUserId)
                .actionType(actionType)
                .partnerCode(partnerCode)
                .partnerId(partnerId)
                .keyword(keyword)
                .page(page)
                .size(size)
                .build();
        PointHistoryResponse response = pointLedgerService.getPointHistory(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/point-history")
    public ResponseEntity<PointHistoryResponse> getPointHistoryGet(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "externalUserId", required = false) String externalUserId,
            @RequestParam(value = "actionType", required = false) PointActionType actionType,
            @RequestParam(value = "partnerCode", required = false) String partnerCode,
            @RequestParam(value = "partnerId", required = false) Long partnerId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "15") int size) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        PointHistoryRequest request = PointHistoryRequest.builder()
                .externalUserId(externalUserId)
                .actionType(actionType)
                .partnerCode(partnerCode)
                .partnerId(partnerId)
                .keyword(keyword)
                .page(page)
                .size(size)
                .build();
        PointHistoryResponse response = pointLedgerService.getPointHistory(tenantId, request);
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
