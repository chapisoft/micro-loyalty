package com.natcash.loyalty.wallet.dto;

import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.VoucherStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

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
        private String partnerCode;
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
        // CMS VQ-04 "How to get" / "How to use" (Figma 18/11)
        private String acquireType;
        private String usageType;
        private String categoryCode;
        private String audienceRole;
        private List<String> eligibleTiers;
        private Integer perCustomerLimit;
        private Integer batchQuantity;
        private String batchPeriod;
        private Integer validDaysAfterCollect;
        private Boolean requireEkyc;
        private Boolean showInFreeStrip;
        private Integer stripOrder;
        private String serviceLink;
        private String branchScope;
        private String imageUrl;
        private String i18nJson;
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
        /** dd/MM/yyyy, kept for existing clients */
        private String validUntil;
        /** ISO instant of validUntil */
        private Instant expiresAt;
        private String status;
        private String terms;
        private Long voucherId;
        private String voucherCode;
        private String acquireType;
        private String usageType;
        private String serviceLink;
        private String imageUrl;
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
        private String partnerCode;
        private DiscountType discountType;
        private BigDecimal discountValue;
        private BigDecimal minBillAmount;
        private BigDecimal maxDiscountAmount;
        private Integer totalQuantity;
        private BigDecimal pointCost;
        private Instant startDate;
        private Instant endDate;
        private VoucherStatus status;
        private String acquireType;
        private String usageType;
        private String categoryCode;
        private String audienceRole;
        private List<String> eligibleTiers;
        private Integer perCustomerLimit;
        private Integer batchQuantity;
        private String batchPeriod;
        private Integer validDaysAfterCollect;
        private Boolean requireEkyc;
        private Boolean showInFreeStrip;
        private Integer stripOrder;
        private String serviceLink;
        private String branchScope;
        private String imageUrl;
        private String i18nJson;
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
