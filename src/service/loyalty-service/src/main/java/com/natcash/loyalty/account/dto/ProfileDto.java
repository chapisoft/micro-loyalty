package com.natcash.loyalty.account.dto;

import com.natcash.loyalty.domain.enums.TierLevel;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class ProfileDto {

    private ProfileDto() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã người dùng không được để trống")
        private String externalUserId;

        private String phoneNumber;
        private String fullName;
        private LocalDate dateOfBirth;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long accountId;
        private String tenantId;
        private String externalUserId;
        private String phoneNumber;
        private String fullName;
        private LocalDate dateOfBirth;
        private BigDecimal currentPoints;
        private BigDecimal tierPoints;
        private TierInfo tier;
        private NextTierProgress nextTierProgress;
        private String status;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TierInfo implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long id;
        private TierLevel code;
        private String name;
        private Integer tierLevel;
        private BigDecimal minPoints;
        private BigDecimal pointMultiplier;
        private Integer freeDailyTurns;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NextTierProgress implements Serializable {
        private static final long serialVersionUID = 1L;

        private TierLevel nextTierCode;
        private String nextTierName;
        private BigDecimal pointsNeeded;
        private BigDecimal currentTierPoints;
        private BigDecimal targetTierPoints;
        private Double progressPercentage;
    }
}
