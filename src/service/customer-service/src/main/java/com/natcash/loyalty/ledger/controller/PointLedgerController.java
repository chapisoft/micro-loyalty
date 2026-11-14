package com.natcash.loyalty.ledger.controller;

import com.natcash.loyalty.approval.dto.ApprovalDto.ApprovalItemResponse;
import com.natcash.loyalty.approval.dto.ApprovalDto.ApprovalPageResponse;
import com.natcash.loyalty.approval.dto.ApprovalDto.CreateApprovalRequest;
import com.natcash.loyalty.approval.service.ApprovalQueueService;
import com.natcash.loyalty.domain.enums.ApprovalActionType;
import com.natcash.loyalty.domain.enums.ApprovalStatus;
import com.natcash.loyalty.domain.enums.ApprovalTargetType;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.EarnPointRequest;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.EarnPointResponse;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.PointHistoryRequest;
import com.natcash.loyalty.ledger.dto.PointLedgerDto.PointHistoryResponse;
import com.natcash.loyalty.ledger.entity.PointExpirationBucketEntity;
import com.natcash.loyalty.ledger.service.PointBucketFifoService;
import com.natcash.loyalty.ledger.service.PointLedgerService;
import com.natcash.loyalty.tenant.TenantContext;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/loyalty/v1")
public class PointLedgerController {

    private final PointLedgerService pointLedgerService;

    @Autowired(required = false)
    private PointBucketFifoService pointBucketFifoService;

    @Autowired(required = false)
    private ApprovalQueueService approvalQueueService;

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

    @GetMapping("/ledger/expiring-buckets")
    public ResponseEntity<List<PointExpirationBucketEntity>> getExpiringBuckets(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "days", required = false, defaultValue = "30") int days) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<PointExpirationBucketEntity> buckets = pointBucketFifoService != null
                ? pointBucketFifoService.findExpiringBuckets(tenantId, days)
                : Collections.emptyList();
        return ResponseEntity.ok(buckets);
    }

    @GetMapping("/ledger/adjustments")
    public ResponseEntity<ApprovalPageResponse> getPointAdjustments(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "status", required = false) ApprovalStatus status,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        if (approvalQueueService == null) {
            return ResponseEntity.ok(ApprovalPageResponse.builder()
                    .items(Collections.emptyList())
                    .content(Collections.emptyList())
                    .build());
        }
        return ResponseEntity.ok(approvalQueueService.listApprovals(tenantId, status, page, size));
    }

    @PostMapping("/ledger/adjustments")
    public ResponseEntity<ApprovalItemResponse> submitPointAdjustment(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody PointAdjustmentRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        Map<String, Object> payloadAfter = new LinkedHashMap<>();
        payloadAfter.put("externalUserId", request.getExternalUserId());
        payloadAfter.put("delta", request.getDelta());
        payloadAfter.put("reason", request.getReason());

        CreateApprovalRequest approvalReq = CreateApprovalRequest.builder()
                .targetType(ApprovalTargetType.POINT_ADJUSTMENT)
                .targetId(request.getExternalUserId())
                .actionType(ApprovalActionType.ADJUST)
                .title("Point Adjustment: " + request.getExternalUserId() + " (" + request.getDelta() + ")")
                .payloadAfter(payloadAfter)
                .makerUsername(request.getMakerUsername())
                .reason(request.getReason())
                .build();
        return ResponseEntity.ok(approvalQueueService.submitRequest(tenantId, approvalReq));
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PointAdjustmentRequest {
        private String externalUserId;
        private BigDecimal delta;
        private String reason;
        private String makerUsername;
    }
}
