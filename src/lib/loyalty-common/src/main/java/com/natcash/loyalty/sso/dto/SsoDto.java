package com.natcash.loyalty.sso.dto;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class SsoDto {

    private SsoDto() {
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SsoTicketRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "{validation.partner_code.not_blank}")
        private String partnerCode;

        @NotBlank(message = "{validation.external_user_id.not_blank}")
        private String externalUserId;

        private String username;
        private String phoneNumber;
        private String fullName;
        private String accountRole;
        private Boolean ekycVerified;
        private List<String> permissions;
        private Long timestamp;
        private String signature;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SsoTicketResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String sessionTicket;
        private long expiresInSeconds;
        private String webviewLaunchUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SsoExchangeRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "{validation.session_ticket.not_blank}")
        private String sessionTicket;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SsoExchangeResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String accessToken;
        private String tokenType;
        private long expiresInSeconds;
        private String tenantId;
        private String externalUserId;
        private String fullName;
        private String phoneNumber;
        private String accountRole;
        private TenantUserContextResponse userContext;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SsoTicketPayload implements Serializable {
        private static final long serialVersionUID = 1L;

        private String tenantId;
        private String partnerCode;
        private String externalUserId;
        private String username;
        private String phoneNumber;
        private String fullName;
        private String accountRole;
        private Boolean ekycVerified;
        private List<String> permissions;
        private long createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TenantUserAuthRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        private String tenantId;
        private String externalUserId;
        private String phoneNumber;
        private String fullName;
        private String verifyCode;
        private String authMethod;
        private String partnerCode;
        private String accountRole;
        private Long timestamp;
        private String signature;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TenantAccountSummary implements Serializable {
        private static final long serialVersionUID = 1L;

        private String tenantId;
        private String externalUserId;
        private String phoneNumber;
        private String fullName;
        private String accountRole;
        private String tierCode;
        private String tierName;
        private BigDecimal currentPoints;
        private BigDecimal tierPoints;
        private String segmentCode;
        private String segmentName;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicablePolicyDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private String partnerCode;
        private String partnerName;
        private String partnerType;
        private BigDecimal pointExchangeRate;
        private BigDecimal tierPointMultiplier;
        private BigDecimal maxBurnPercentage;
        private BigDecimal minBurnPoints;
        private BigDecimal maxBurnPointsPerTx;
        private BigDecimal maxBurnPointsPerDay;
        private BigDecimal payAtCounterPinLimitHtg;
        private String policySummary;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendedVoucherDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long id;
        private String voucherCode;
        private String title;
        private String description;
        private String partnerName;
        private String discountType;
        private BigDecimal discountValue;
        private BigDecimal minBillAmount;
        private BigDecimal pointCost;
        private String acquireType;
        private String usageType;
        private String categoryCode;
        private String audienceRole;
        private String imageUrl;
        private boolean affordable;
        private boolean freeCollect;
        private String matchReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendedMissionDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long milestoneId;
        private String campaignCode;
        private String campaignName;
        private Integer milestoneStep;
        private String targetMetric;
        private BigDecimal targetValue;
        private BigDecimal currentProgress;
        private BigDecimal rewardPoints;
        private String status;
        private String audienceRole;
        private String matchReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TenantUserContextResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String accessToken;
        private String tokenType;
        private long expiresInSeconds;
        private String tenantId;
        private String externalUserId;
        private String phoneNumber;
        private String fullName;
        private String accountRole;
        private BigDecimal expiringPoints;
        private Instant nearestExpiryDate;
        private BigDecimal payAtCounterPinLimitHtg;
        private ProfileResponse profile;
        private String segmentCode;
        private String segmentName;
        private String segmentHeadline;
        private String segmentSubheadline;
        private String segmentCtaLabel;
        private String segmentCtaTarget;
        private List<ApplicablePolicyDto> applicablePolicies;
        private List<RecommendedVoucherDto> recommendedVouchers;
        private List<RecommendedMissionDto> recommendedMissions;
    }
}
