package com.natcash.loyalty.ledger.dto;

import com.natcash.loyalty.domain.enums.PointActionType;
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

public final class PointLedgerDto {

    private PointLedgerDto() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EarnPointRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã người dùng không được để trống")
        private String externalUserId;

        @NotNull(message = "Số tiền thanh toán không được để trống")
        @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
        private BigDecimal billAmount;

        @NotBlank(message = "Mã giao dịch duy nhất không được để trống")
        private String transactionCode;

        private String partnerCode;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EarnPointResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String transactionCode;
        private BigDecimal basePoints;
        private BigDecimal multiplier;
        private BigDecimal pointsEarned;
        private BigDecimal currentPoints;
        private BigDecimal tierPoints;
        private TierLevel tier;
        private boolean tierUpgraded;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PointHistoryRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        private String externalUserId;
        private PointActionType actionType;
        private String partnerCode;
        private Long partnerId;
        private String keyword;
        private Instant fromDate;
        private Instant toDate;

        @Builder.Default
        private int page = 0;

        @Builder.Default
        private int size = 10;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PointTransactionItem implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long id;
        private String externalUserId;
        private BigDecimal pointChange;
        private BigDecimal balanceBefore;
        private BigDecimal balanceAfter;
        private PointActionType changeType;
        private String referenceCode;
        private Long partnerId;
        private String partnerCode;
        private String partnerName;
        private String partnerType;
        private String description;
        private String status;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PointHistoryResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private List<PointTransactionItem> items;
        private List<PointTransactionItem> content;
        private long totalElements;
        private int totalPages;
        private int currentPage;
        private int pageSize;
    }
}
