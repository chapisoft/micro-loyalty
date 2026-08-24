package com.natcash.loyalty.wallet.dto;

import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.VoucherStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

public class VoucherDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoucherResponse {
        private Long id;
        private String voucherCode;
        private String title;
        private String description;
        private Long partnerId;
        private String partnerName;
        private DiscountType discountType;
        private BigDecimal discountValue;
        private BigDecimal minBillAmount;
        private BigDecimal maxDiscountAmount;
        private Integer totalQuantity;
        private Integer availableQuantity;
        private BigDecimal pointCost;
        private Instant startDate;
        private Instant endDate;
        private VoucherStatus status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserVoucherResponse {
        private Long id;
        private String code;
        private String title;
        private String partnerName;
        private String category;
        private String discountText;
        private String minOrder;
        private String validUntil;
        private String status;
        private String terms;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateVoucherRequest {
        private String voucherCode;
        private String title;
        private String description;
        private Long partnerId;
        private DiscountType discountType;
        private BigDecimal discountValue;
        private BigDecimal minBillAmount;
        private BigDecimal maxDiscountAmount;
        private Integer totalQuantity;
        private BigDecimal pointCost;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RedeemVoucherRequest {
        private String externalUserId;
        private String voucherCode;
    }
}
