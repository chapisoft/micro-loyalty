package com.natcash.loyalty.wallet.dto;

import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.HoldStatus;
import com.natcash.loyalty.domain.enums.TierLevel;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class PartnerGatewayDto {

    private PartnerGatewayDto() {
        // Chặn khởi tạo class DTO tĩnh
    }

    // =========================================================================
    // 1. INQUIRY: TRA CỨU SỐ DƯ & CHÍNH SÁCH ÁP DỤNG
    // =========================================================================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Yêu cầu tra cứu số dư và chính sách tiêu điểm của khách hàng")
    public static class PartnerInquiryRequest implements Serializable {
        private static final long serialVersionUID = 1L;
        @NotBlank(message = "{validation.customer_identifier.not_blank}")
        @Schema(description = "Số điện thoại, ID khách hàng hoặc Dynamic QR Token", example = "50937123456")
        private String customerIdentifier;

        @Schema(description = "Mã đối tác gọi yêu cầu", example = "DELIMART")
        private String partnerCode;

        @DecimalMin(value = "0.00", message = "{validation.bill_amount.non_negative}")
        @Schema(description = "Tổng tiền hóa đơn hiện tại (nếu có)", example = "1500.00")
        private BigDecimal billAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Thông tin số dư, hạn mức và danh sách voucher khả dụng")
    public static class PartnerInquiryResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        private String externalUserId;
        private String customerName;
        private TierLevel tier;
        private String tierName;
        private BigDecimal currentPoints;
        private BigDecimal pointExchangeRate;
        private BigDecimal maxBurnPercentage;
        private BigDecimal maxDeductiblePoints;
        private BigDecimal maxDeductibleAmount;
        private List<PartnerVoucherItemDto> availableVouchers;
        private int totalVouchers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerVoucherItemDto implements Serializable {
        private static final long serialVersionUID = 1L;
        private Long redemptionId;
        private String redemptionCode;
        private String voucherCode;
        private String title;
        private DiscountType discountType;
        private BigDecimal discountValue;
        private BigDecimal minBillAmount;
        private BigDecimal maxDiscountAmount;
        private Instant expiresAt;
    }

    // =========================================================================
    // 2. AUTHORIZE: TẠM GIỮ ĐIỂM HÓA ĐƠN (LUỒNG 2 BƯỚC)
    // =========================================================================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Yêu cầu tạm giữ điểm theo hóa đơn")
    public static class PartnerPaymentAuthorizeRequest implements Serializable {
        private static final long serialVersionUID = 1L;
        @NotBlank(message = "{validation.customer_identifier.not_blank}")
        private String customerIdentifier;

        @NotBlank(message = "{validation.partner_order_id.not_blank}")
        private String partnerOrderId;

        @NotNull(message = "{validation.bill_amount.not_null}")
        @DecimalMin(value = "0.01", message = "{validation.bill_amount.positive}")
        private BigDecimal billAmount;

        @DecimalMin(value = "0.00", message = "{validation.points_to_burn.non_negative}")
        private BigDecimal pointsToBurn;

        private String voucherRedemptionCode;
        private List<String> voucherRedemptionCodes;
        private String branchCode;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Kết quả tạm giữ điểm thành công")
    public static class PartnerPaymentAuthorizeResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        private String holdCode;
        private String partnerOrderId;
        private String externalUserId;
        private BigDecimal billAmount;
        private BigDecimal pointsHeld;
        private BigDecimal pointDiscountAmount;
        private BigDecimal voucherDiscountAmount;
        private BigDecimal finalAmountToPay;
        private String appliedVoucherCode;
        private List<String> appliedVoucherCodes;
        private HoldStatus status;
        private Instant expiresAt;
        private Instant createdAt;
    }

    // =========================================================================
    // 3. CONFIRM / CAPTURE: XÁC NHẬN KHẤU TRỪ ĐIỂM CHÍNH THỨC
    // =========================================================================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Yêu cầu xác nhận cấn trừ điểm theo mã Hold")
    public static class PartnerPaymentConfirmRequest implements Serializable {
        private static final long serialVersionUID = 1L;
        @NotBlank(message = "{validation.hold_code.not_blank}")
        private String holdCode;

        @NotBlank(message = "{validation.transaction_code.not_blank}")
        private String transactionCode;

        private String partnerOrderId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Kết quả xác nhận khấu trừ điểm thành công")
    public static class PartnerPaymentConfirmResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        private String transactionCode;
        private String holdCode;
        private String partnerOrderId;
        private String externalUserId;
        private BigDecimal billAmount;
        private BigDecimal pointsBurned;
        private BigDecimal pointDiscountAmount;
        private BigDecimal voucherDiscountAmount;
        private BigDecimal finalAmountToPay;
        private BigDecimal remainingPoints;
        private String appliedVoucherCode;
        private List<String> appliedVoucherCodes;
        private ClearingStatus status;
        private Instant capturedAt;
    }

    // =========================================================================
    // 4. CANCEL / VOID: HỦY PHIÊN TẠM GIỮ ĐIỂM
    // =========================================================================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Yêu cầu hủy giải phóng phiên tạm giữ điểm")
    public static class PartnerPaymentCancelRequest implements Serializable {
        private static final long serialVersionUID = 1L;
        @NotBlank(message = "{validation.hold_code.not_blank}")
        private String holdCode;

        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerPaymentCancelResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        private String holdCode;
        private HoldStatus status;
        private BigDecimal pointsReleased;
        private String message;
        private Instant cancelledAt;
    }

    // =========================================================================
    // 5. DIRECT PAYMENT: THANH TOÁN TRỪ ĐIỂM 1 CHẠM TỨC THÌ QUA DYNAMIC QR
    // =========================================================================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Yêu cầu thanh toán trừ điểm 1 chạm trực tiếp")
    public static class PartnerPaymentDirectRequest implements Serializable {
        private static final long serialVersionUID = 1L;
        @NotBlank(message = "{validation.qr_token.not_blank}")
        private String qrToken;

        @NotBlank(message = "{validation.transaction_code.not_blank}")
        private String transactionCode;

        @NotBlank(message = "{validation.partner_order_id.not_blank}")
        private String partnerOrderId;

        @NotNull(message = "{validation.bill_amount.not_null}")
        @DecimalMin(value = "0.01", message = "{validation.bill_amount.positive}")
        private BigDecimal billAmount;

        @DecimalMin(value = "0.00", message = "{validation.points_to_burn.non_negative}")
        private BigDecimal pointsToBurn;

        private String voucherRedemptionCode;
        private List<String> voucherRedemptionCodes;
        private String branchCode;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerPaymentDirectResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        private String transactionCode;
        private String partnerOrderId;
        private String externalUserId;
        private BigDecimal billAmount;
        private BigDecimal pointsBurned;
        private BigDecimal pointDiscountAmount;
        private BigDecimal voucherDiscountAmount;
        private BigDecimal finalAmountToPay;
        private BigDecimal remainingPoints;
        private String appliedVoucherCode;
        private List<String> appliedVoucherCodes;
        private ClearingStatus status;
        private Instant redeemedAt;
    }

    // =========================================================================
    // 6. REFUND: HOÀN ĐIỂM KHI TRẢ HÀNG
    // =========================================================================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Yêu cầu hoàn điểm giao dịch hủy hóa đơn")
    public static class PartnerPaymentRefundRequest implements Serializable {
        private static final long serialVersionUID = 1L;
        @NotBlank(message = "{validation.refund_tx_code.not_blank}")
        private String refundTransactionCode;

        @NotBlank(message = "{validation.original_tx_code.not_blank}")
        private String originalTransactionCode;

        @DecimalMin(value = "0.01", message = "{validation.points_to_refund.positive}")
        private BigDecimal pointsToRefund;

        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerPaymentRefundResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        private String refundTransactionCode;
        private String originalTransactionCode;
        private BigDecimal pointsRefunded;
        private BigDecimal newBalance;
        private ClearingStatus status;
        private Instant refundedAt;
    }

    // =========================================================================
    // 7. STATUS: TRUY VẤN TRẠNG THÁI GIAO DỊCH
    // =========================================================================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerPaymentStatusRequest implements Serializable {
        private static final long serialVersionUID = 1L;
        private String transactionCode;
        private String holdCode;
        private String partnerOrderId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerPaymentStatusResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        private String transactionCode;
        private String holdCode;
        private String partnerOrderId;
        private String externalUserId;
        private BigDecimal billAmount;
        private BigDecimal pointsBurned;
        private BigDecimal pointDiscountAmount;
        private BigDecimal commissionAmount;
        private BigDecimal netPayoutAmount;
        private String status;
        private Instant createdAt;
        private Instant settledAt;
    }

    // =========================================================================
    // 8. RECONCILIATION: ĐỐI SOÁT & SAO KÊ KỲ
    // =========================================================================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerReconciliationRequest implements Serializable {
        private static final long serialVersionUID = 1L;
        private String fromDate; // ISO-8601 hoặc YYYY-MM-DD
        private String toDate;
        private String batchCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerReconciliationResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        private String tenantId;
        private String partnerCode;
        private String partnerName;
        private String period;
        private String batchCode;
        private int totalTransactions;
        private BigDecimal totalPointsBurned;
        private BigDecimal totalFiatAmount;
        private BigDecimal totalCommissionFee;
        private BigDecimal netSettlementAmount;
        private String status;
        private List<PartnerTxDetailDto> transactionDetails;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerTxDetailDto implements Serializable {
        private static final long serialVersionUID = 1L;
        private String transactionCode;
        private String partnerOrderId;
        private String externalUserId;
        private BigDecimal pointsRedeemed;
        private BigDecimal fiatAmount;
        private BigDecimal commissionAmount;
        private BigDecimal netPayoutAmount;
        private String status;
        private Instant createdAt;
    }

    // =========================================================================
    // 9. DISPUTE: KHIẾU NẠI SAI LỆCH ĐỐI SOÁT
    // =========================================================================
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerDisputeRequest implements Serializable {
        private static final long serialVersionUID = 1L;
        @NotBlank(message = "{validation.batch_code.not_blank}")
        private String batchCode;

        private String transactionCode;

        @NotBlank(message = "{validation.dispute_type.not_blank}")
        private String disputeType; // MISSING_TX, AMOUNT_MISMATCH, DUPLICATE_TX

        @NotNull(message = "{validation.partner_amount.not_null}")
        private BigDecimal partnerAmount;

        private BigDecimal loyaltyAmount;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerDisputeResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        private String disputeCode;
        private String batchCode;
        private String disputeType;
        private String status;
        private String message;
        private Instant createdAt;
    }
}
