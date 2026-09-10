package com.natcash.loyalty.wallet.controller;

import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/loyalty/v1/partner/webhook")
@RequiredArgsConstructor
@Tag(name = "Partner Webhook Inbound API", description = "Điểm Tiếp Nhận Webhook Từ Đối Tác & Cổng Thanh Toán")
public class PartnerWebhookCallbackController {

    private final ClearingTransactionRepository clearingRepository;

    @PostMapping("/settlement-ack")
    @Operation(summary = "Tiếp nhận xác nhận thanh toán bù trừ từ Ngân hàng / Đối tác", description = "Cập nhật trạng thái chuyển tiền thực tế cho lô quyết toán")
    public ResponseEntity<Map<String, Object>> receiveSettlementAck(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody SettlementAckRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        String batchCode = request.getBatchCode();

        log.info("[INBOUND-SETTLEMENT-ACK] tenantId={}, batchCode={}, bankRef={}, amount={}",
                tenantId, batchCode, request.getBankReferenceNumber(), request.getPaidAmount());

        List<ClearingTransactionEntity> txs = clearingRepository.findByTenantIdAndStatus(tenantId, ClearingStatus.PENDING);
        if (batchCode != null && !batchCode.trim().isEmpty()) {
            txs = txs.stream()
                    .filter(tx -> batchCode.equals(tx.getReconciliationBatchCode()))
                    .toList();
        }

        for (ClearingTransactionEntity tx : txs) {
            tx.setStatus(ClearingStatus.SETTLED);
            tx.setSettledAt(Instant.now());
        }
        if (!txs.isEmpty()) {
            clearingRepository.saveAll(txs);
        }

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Đã tiếp nhận và hạch toán lô quyết toán thành công",
                "batchCode", batchCode != null ? batchCode : "",
                "updatedTransactions", txs.size(),
                "receivedAt", Instant.now().toString()
        ));
    }

    @PostMapping("/payment-callback")
    @Operation(summary = "Tiếp nhận thông báo trạng thái đơn hàng từ POS", description = "Cập nhật thông tin hủy hoặc hoàn tiền từ máy POS đối tác")
    public ResponseEntity<Map<String, Object>> receivePaymentCallback(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody PaymentCallbackRequest request) {

        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        log.info("[INBOUND-PAYMENT-CALLBACK] tenantId={}, partnerOrder={}, status={}",
                tenantId, request.getPartnerOrderId(), request.getStatus());

        return ResponseEntity.ok(Map.of(
                "status", "ACKNOWLEDGED",
                "partnerOrderId", request.getPartnerOrderId() != null ? request.getPartnerOrderId() : "",
                "timestamp", Instant.now().toString()
        ));
    }

    @Data
    public static class SettlementAckRequest implements Serializable {
        private String batchCode;
        private String partnerCode;
        private String bankReferenceNumber;
        private BigDecimal paidAmount;
        private String paidAt;
        private String remarks;
    }

    @Data
    public static class PaymentCallbackRequest implements Serializable {
        private String partnerOrderId;
        private String transactionCode;
        private String status;
        private String failureReason;
    }
}
