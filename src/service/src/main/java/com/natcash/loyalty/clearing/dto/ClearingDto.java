package com.natcash.loyalty.clearing.dto;

import com.natcash.loyalty.domain.enums.ClearingStatus;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class ClearingDto {

    private ClearingDto() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReconciliationReportRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotNull(message = "Thời gian bắt đầu không được để trống")
        private Instant fromDate;

        @NotNull(message = "Thời gian kết thúc không được để trống")
        private Instant toDate;

        private Long partnerId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerClearingSummaryDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long partnerId;
        private String partnerCode;
        private String partnerName;
        private String partnerType;
        private long totalTransactions;
        private BigDecimal totalPointsIssued;
        private BigDecimal totalPointsRedeemed;
        private BigDecimal totalFiatPayable;
        private BigDecimal totalFiatReceivable;
        private BigDecimal netSettlementAmount; // Dư nợ ròng (+ phải thu, - phải trả)
        private ClearingStatus status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReconciliationReportResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private Instant periodFrom;
        private Instant periodTo;
        private long grandTotalTransactions;
        private BigDecimal grandTotalPointsIssued;
        private BigDecimal grandTotalPointsRedeemed;
        private BigDecimal grandTotalFiatPayable;
        private BigDecimal grandTotalFiatReceivable;
        private BigDecimal grandTotalNetSettlement;
        private List<PartnerClearingSummaryDto> partnerSummaries;
        private Instant generatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SettlePeriodRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotNull(message = "Thời gian bắt đầu không được để trống")
        private Instant fromDate;

        @NotNull(message = "Thời gian kết thúc không được để trống")
        private Instant toDate;

        private String remarks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SettlePeriodResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String settlementBatchCode;
        private String period;
        private int settledTransactionCount;
        private BigDecimal totalSettledAmount;
        private ClearingStatus status;
        private String message;
        private Instant settledAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerClearingTransactionDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long id;
        private String transactionCode;
        private String externalUserId;
        private BigDecimal pointsRedeemed;
        private BigDecimal fiatAmount;
        private BigDecimal exchangeRate;
        private String role; // "REDEEMER" (Thu hồi) hoặc "ISSUER" (Phát hành)
        private ClearingStatus status;
        private Instant settledAt;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerTransactionsResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long partnerId;
        private String partnerCode;
        private String partnerName;
        private long totalTransactions;
        private BigDecimal totalPoints;
        private BigDecimal totalFiat;
        private List<PartnerClearingTransactionDto> transactions;
    }
}
