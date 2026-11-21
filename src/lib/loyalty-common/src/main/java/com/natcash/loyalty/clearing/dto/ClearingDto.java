package com.natcash.loyalty.clearing.dto;

import com.natcash.loyalty.domain.enums.BatchDirection;
import com.natcash.loyalty.domain.enums.ClearingSourceType;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.ReconciliationStatus;
import com.natcash.loyalty.domain.enums.SponsorType;

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

        @NotNull(message = "{validation.from_date.not_null}")
        private Instant fromDate;

        @NotNull(message = "{validation.to_date.not_null}")
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
        private BigDecimal totalCommissionFee;
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
        private BigDecimal grandTotalFiatAmount;
        private BigDecimal grandTotalCommissionFee;
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

        @NotNull(message = "{validation.from_date.not_null}")
        private Instant fromDate;

        @NotNull(message = "{validation.to_date.not_null}")
        private Instant toDate;

        private Long partnerId;
        private String remarks;
        private Boolean strictMatchedOnly;
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
        private BigDecimal totalVoucherDiscountSettled;
        private BigDecimal totalCommissionFee;
        private BigDecimal totalNetPayout;
        private ClearingStatus status;
        private String message;
        private List<SponsorAttributionDto> sponsorAttributions;
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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DisputeItemDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long id;
        private String disputeCode;
        private String batchCode;
        private Long partnerId;
        private String partnerName;
        private String disputeType;
        private BigDecimal partnerAmount;
        private BigDecimal loyaltyAmount;
        private BigDecimal resolvedAmount;
        private String status;
        private String resolutionNote;
        private Instant createdAt;
        private Instant resolvedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResolveDisputeRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotNull(message = "{validation.status.not_null}")
        private String status; // RESOLVED, REJECTED

        private BigDecimal resolvedAmount;
        private String note;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ThreeWayReconcileItem implements Serializable {
        private static final long serialVersionUID = 1L;

        private String coreTxId;
        private String holdCode;
        private String transactionCode;
        private String partnerOrderId;
        private BigDecimal orgAmount;
        private BigDecimal walletPaidAmount;
        private BigDecimal poolDeductedAmount;
        private String coreStatus; // SUCCESS | REVERTED
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ThreeWayReconcileRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        private String batchCode;
        private List<ThreeWayReconcileItem> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ThreeWayReconcileResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String batchCode;
        private int totalChecked;
        private int matchedCount;
        private int autoConfirmedCount;
        private int autoRevertedCount;
        private int disputedCount;
        private int missingTxCount;
        private BigDecimal totalPoolDeductedAmount;
        private BigDecimal totalBreakdownMatchedAmount;
        private List<String> disputeCodes;
        private Instant reconciledAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SponsorAttributionDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long fundingPartnerId;
        private String partnerCode;
        private String partnerName;
        private SponsorType sponsorType;
        private BigDecimal voucherAmount;
        private BigDecimal coinAmount;
        private BigDecimal totalPayableToPool;
        private long txCount;
        private String replenishChannel; // CORE_035404 | PARTNER_RECEIVABLE
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SponsorAttributionSummaryResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private Instant periodFrom;
        private Instant periodTo;
        private BigDecimal totalPoolReplenishRequired;
        private BigDecimal natcashBudgetAmount;
        private BigDecimal partnerReceivableAmount;
        private List<SponsorAttributionDto> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClearingBreakdownItemDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long id;
        private Long clearingTxId;
        private String transactionCode;
        private String holdCode;
        private ClearingSourceType sourceType;
        private String sourceRef;
        private Long bucketId;
        private Long redemptionId;
        private SponsorType sponsorType;
        private Long fundingPartnerId;
        private String fundingPartnerCode;
        private String fundingPartnerName;
        private BigDecimal shareRatio;
        private BigDecimal pointsConsumed;
        private BigDecimal exchangeRate;
        private BigDecimal payableAmount;
        private Boolean reverted;
        private ReconciliationStatus reconciliationStatus;
        private String coreTxId;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PayBatchRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        private String bankRefCode;
        private String coreSettlementTxId;
        private String paidBy;
        private String note;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AutoBatchCreateRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotNull
        private Long partnerId;
        private String period;
        private String periodFrom;
        private String periodTo;
        private BigDecimal grossAmount;
        private BigDecimal discountAmount;
        private BigDecimal mdrFeePercent;
        private Integer txCount;
        private BatchDirection batchDirection;
    }
}
