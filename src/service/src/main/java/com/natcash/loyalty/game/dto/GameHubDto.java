package com.natcash.loyalty.game.dto;

import com.natcash.loyalty.domain.enums.GameStatus;
import com.natcash.loyalty.domain.enums.PaymentMethod;
import com.natcash.loyalty.domain.enums.SessionStatus;

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

public final class GameHubDto {

    private GameHubDto() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GameListRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        private String externalUserId;
        private String category;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GameListItemDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long id;
        private String gameCode;
        private String gameName;
        private String category;
        private BigDecimal pricePerTurn;
        private Integer freeTurnsDaily;
        private Integer remainingTurnsToday;
        private String gameUrl;
        private String iconUrl;
        private GameStatus status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GameListResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private List<GameListItemDto> games;
        private int total;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InitSessionRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã người dùng không được để trống")
        private String externalUserId;

        @NotBlank(message = "Mã game không được để trống")
        private String gameCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InitSessionResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String sessionToken;
        private String gameCode;
        private String gameName;
        private Integer turnsAllocated;
        private Integer turnsUsed;
        private Integer turnsRemaining;
        private SessionStatus status;
        private Instant expiresAt;
        private String gameLaunchUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InGameCheckoutRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã người dùng không được để trống")
        private String externalUserId;

        @NotBlank(message = "Mã game không được để trống")
        private String gameCode;

        @NotBlank(message = "Session token không được để trống")
        private String sessionToken;

        @NotNull(message = "Số lượt mua thêm không được để trống")
        private Integer turnsToBuy;

        @NotNull(message = "Số tiền hoặc điểm thanh toán không được để trống")
        private BigDecimal paymentAmount;

        private PaymentMethod paymentMethod; // POINTS hoặc WALLET
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InGameCheckoutResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String transactionCode;
        private String sessionToken;
        private Integer totalTurnsAvailable;
        private BigDecimal amountDeducted;
        private PaymentMethod paymentMethod;
        private BigDecimal remainingPointBalance;
        private String message;
        private Instant timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerTurnPurchaseWebhookRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã đối tác không được để trống")
        private String partnerCode;

        @NotBlank(message = "Mã người dùng không được để trống")
        private String externalUserId;

        private String sessionToken;

        @NotBlank(message = "Mã game không được để trống")
        private String gameCode;

        @NotNull(message = "Số lượt mua không được để trống")
        private Integer turnsPurchased;

        @NotNull(message = "Số tiền thanh toán không được để trống")
        private BigDecimal paymentAmount;

        private String currency;

        @NotBlank(message = "Mã giao dịch đối tác không được để trống")
        private String partnerTransactionCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerTurnPurchaseWebhookResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String transactionCode;
        private String partnerTransactionCode;
        private String externalUserId;
        private String gameCode;
        private Integer turnsAdded;
        private Integer totalTurnsAvailable;
        private BigDecimal paymentAmount;
        private String currency;
        private String clearingStatus;
        private String message;
        private Instant timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmitGameResultRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã người dùng không được để trống")
        private String externalUserId;

        @NotBlank(message = "Mã game không được để trống")
        private String gameCode;

        private String sessionToken;

        private Integer score;

        private String clientTransactionRef;

        private String details;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmitGameResultResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String transactionRef;
        private String gameCode;
        private String gameName;
        private Integer score;
        private String rewardType;
        private BigDecimal rewardValue;
        private BigDecimal pointsAwarded;
        private String voucherCode;
        private BigDecimal newPointBalance;
        private Integer turnsRemaining;
        private String message;
        private Instant timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GameAdminDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long id;
        private String gameCode;
        private String gameName;
        private String category;
        private BigDecimal pricePerTurn;
        private BigDecimal pricePerTurnHtg;
        private Integer freeTurnsDaily;
        private BigDecimal dailyBudgetLimit;
        private Boolean allowPointsSpin;
        private String gameUrl;
        private String iconUrl;
        private GameStatus status;
        private String gameParams;
        // Third-Party Game Studio Config
        private String partnerCode;
        private String webhookUrl;
        private Integer revenueSharePercent;
        // Game parameters parsed
        private Integer quizQuestionCount;
        private Integer quizCountdownSec;
        private Integer quizRewardPoints;
        private Integer farmSeasonDays;
        private Integer farmVoucherLimit;
        private Integer diceMultiplierMax;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GameHubGlobalConfigDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Integer pointsPerTurnExchange;
        private Boolean goldenHourEnabled;
        private Boolean maintenanceMode;
        private Integer maxDailyTurnsPerUser;
        private String welcomeBannerText;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GamePlayHistoryItemDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long id;
        private String externalUserId;
        private String gameCode;
        private String gameName;
        private String transactionRef;
        private Integer score;
        private String rewardType;
        private BigDecimal rewardValue;
        private BigDecimal pointsAwarded;
        private String voucherCode;
        private String status;
        private Instant createdAt;
    }
}
