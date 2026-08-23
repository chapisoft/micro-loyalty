package com.natcash.loyalty.wallet.dto;

import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.TierLevel;

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

public final class RewardWalletDto {

    private RewardWalletDto() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RewardWalletInquiryRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã người dùng không được để trống")
        private String externalUserId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailableVoucherDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long redemptionId;
        private String redemptionCode;
        private String voucherCode;
        private String title;
        private String description;
        private DiscountType discountType;
        private BigDecimal discountValue;
        private BigDecimal minBillAmount;
        private BigDecimal maxDiscountAmount;
        private Instant expiresAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RewardWalletInquiryResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String externalUserId;
        private TierLevel tier;
        private String tierName;
        private BigDecimal currentPoints;
        private BigDecimal maxDeductiblePercentage; // 30%, 50%, 100%
        private List<AvailableVoucherDto> availableVouchers;
        private int totalVouchers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RewardWalletRedeemRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã người dùng không được để trống")
        private String externalUserId;

        @NotBlank(message = "Mã giao dịch duy nhất không được để trống")
        private String transactionCode;

        @NotNull(message = "Tổng tiền hóa đơn không được để trống")
        @DecimalMin(value = "0.01", message = "Tổng tiền hóa đơn phải lớn hơn 0")
        private BigDecimal totalBillAmount;

        @Builder.Default
        private BigDecimal pointsToBurn = BigDecimal.ZERO;

        private String voucherRedemptionCode;

        @NotNull(message = "Mã đối tác thu ngân không được để trống")
        private Long redeemerPartnerId;

        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RewardWalletRedeemResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String transactionCode;
        private BigDecimal totalBillAmount;
        private BigDecimal pointDiscountAmount;
        private BigDecimal voucherDiscountAmount;
        private BigDecimal finalAmountToPay;
        private BigDecimal pointsBurned;
        private BigDecimal remainingPoints;
        private String appliedVoucherCode;
        private String status;
        private Instant redeemedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RewardWalletRefundRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã giao dịch gốc không được để trống")
        private String originalTransactionCode;

        @NotBlank(message = "Mã giao dịch hoàn tiền không được để trống")
        private String refundTransactionCode;

        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RewardWalletRefundResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String refundTransactionCode;
        private String originalTransactionCode;
        private BigDecimal pointsRefunded;
        private BigDecimal newBalance;
        private String status;
        private Instant refundedAt;
    }
}
