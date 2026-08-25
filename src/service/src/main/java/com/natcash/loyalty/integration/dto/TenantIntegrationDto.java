package com.natcash.loyalty.integration.dto;

import com.natcash.loyalty.domain.enums.IntegrationType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

public final class TenantIntegrationDto {

    private TenantIntegrationDto() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IntegrationConfigDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long id;
        private String tenantId;
        private IntegrationType integrationType;
        private String providerCode;
        private Boolean isActive;
        private String endpointUrl;
        private String authType;
        private Map<String, Object> authCredentials;
        private Map<String, Object> additionalParams;
        private Instant updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaveIntegrationRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã đối tác thuê bao không được để trống")
        private String tenantId;

        @NotNull(message = "Loại tích hợp không được để trống")
        private IntegrationType integrationType;

        @NotBlank(message = "Mã nhà cung cấp không được để trống")
        private String providerCode;

        @NotBlank(message = "Đường dẫn điểm cuối không được để trống")
        private String endpointUrl;

        @Builder.Default
        private String authType = "NONE";

        private Map<String, Object> authCredentials;
        private Map<String, Object> additionalParams;

        @Builder.Default
        private Boolean isActive = true;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestConnectionRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotNull(message = "Loại tích hợp không được để trống")
        private IntegrationType integrationType;

        @NotBlank(message = "Mã nhà cung cấp không được để trống")
        private String providerCode;

        @NotBlank(message = "Đường dẫn endpoint không được để trống")
        private String endpointUrl;

        private String authType;
        private Map<String, Object> authCredentials;
        private Map<String, Object> additionalParams;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestConnectionResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private boolean success;
        private int httpStatus;
        private String responsePayload;
        private String message;
        private long latencyMs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentDeductResult implements Serializable {
        private static final long serialVersionUID = 1L;

        private boolean success;
        private String transactionRef;
        private String externalCode;
        private BigDecimal deductedAmount;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentRefundResult implements Serializable {
        private static final long serialVersionUID = 1L;

        private boolean success;
        private String refundTransactionRef;
        private BigDecimal refundedAmount;
        private String message;
    }
}
