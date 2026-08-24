package com.natcash.loyalty.campaign.dto;

import com.natcash.loyalty.domain.enums.CampaignMetric;
import com.natcash.loyalty.domain.enums.MilestoneStatus;

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

public final class CampaignMilestoneDto {

    private CampaignMilestoneDto() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActiveCampaignsRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã người dùng không được để trống")
        private String externalUserId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MilestoneItemDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long milestoneId;
        private String campaignCode;
        private String campaignName;
        private Integer milestoneStep;
        private CampaignMetric targetMetric;
        private BigDecimal targetValue;
        private BigDecimal currentProgress;
        private Double progressPercentage;
        private BigDecimal rewardPoints;
        private Long rewardVoucherId;
        private Integer rewardGameTurns;
        private MilestoneStatus status; // IN_PROGRESS, COMPLETED, CLAIMED
        private Instant startDate;
        private Instant endDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActiveCampaignsResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private List<MilestoneItemDto> milestones;
        private int totalActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClaimRewardRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã người dùng không được để trống")
        private String externalUserId;

        @NotNull(message = "Mã cột mốc không được để trống")
        private Long milestoneId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClaimRewardResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long milestoneId;
        private String campaignCode;
        private Integer milestoneStep;
        private BigDecimal rewardPoints;
        private Long rewardVoucherId;
        private Integer rewardGameTurns;
        private BigDecimal newTotalPoints;
        private String message;
        private Instant claimedAt;
    }
}
