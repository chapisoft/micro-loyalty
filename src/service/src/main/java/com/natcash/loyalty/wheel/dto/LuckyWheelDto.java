package com.natcash.loyalty.wheel.dto;

import com.natcash.loyalty.domain.enums.PrizeType;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class LuckyWheelDto {

    private LuckyWheelDto() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WheelConfigRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        private String wheelCode;
        private String externalUserId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrizeConfigDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long prizeId;
        private String prizeName;
        private String nameVi;
        private String nameEn;
        private String nameFr;
        private String nameHt;
        private PrizeType prizeType;
        private BigDecimal prizeValue;
        private Integer displayOrder;
        private String colorCode;
        private String iconUrl;
        private String iconSymbol;
        private String bgImageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WheelConfigResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long wheelId;
        private String wheelCode;
        private String wheelName;
        private BigDecimal pricePerSpin;
        private Integer freeSpinsDaily;
        private Integer remainingSpinsToday;
        private List<PrizeConfigDto> prizes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpinWheelRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã người dùng không được để trống")
        private String externalUserId;

        @NotBlank(message = "Mã vòng quay không được để trống")
        private String wheelCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpinWheelResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long prizeId;
        private String prizeName;
        private PrizeType prizeType;
        private BigDecimal prizeValue;
        private Integer winningIndex; // Vị trí nan quạt dừng (0-indexed)
        private Double winningAngle; // Góc dừng chính xác trên Canvas (vd: 45.0, 90.0...)
        private BigDecimal newPointBalance;
        private Integer remainingSpinsToday;
        private String message;
        private Instant timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WheelPrizeAdminDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long id;
        private Integer displayOrder;
        private String prizeName;
        private String nameVi;
        private String nameEn;
        private String nameFr;
        private String nameHt;
        private String prizeType;
        private BigDecimal prizeValue;
        private Integer probabilityWeight;
        private BigDecimal dailyBudgetLimit;
        private BigDecimal weeklyBudgetLimit;
        private BigDecimal monthlyBudgetLimit;
        private Integer dailyMaxWinners;
        private Integer weeklyMaxWinners;
        private Integer monthlyMaxWinners;
        private String colorCode;
        private String iconUrl;
        private String iconSymbol;
        private String bgImageUrl;
        private String status;
        private Integer actualWinCountToday;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AutoBalancePrizesResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private List<WheelPrizeAdminDto> prizes;
        private Integer totalProbability;
        private String message;
    }
}
