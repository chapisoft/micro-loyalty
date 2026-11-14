package com.natcash.loyalty.integration.dto;

import com.natcash.loyalty.domain.enums.IntegrationAuthType;
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
        private IntegrationAuthType authType;
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

        @NotBlank(message = "{validation.tenant_id.not_blank}")
        private String tenantId;

        @NotNull(message = "{validation.integration_type.not_null}")
        private IntegrationType integrationType;

        @NotBlank(message = "{validation.provider_code.not_blank}")
        private String providerCode;

        @NotBlank(message = "{validation.endpoint_url.not_blank}")
        private String endpointUrl;

        @Builder.Default
        private IntegrationAuthType authType = IntegrationAuthType.NONE;

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

        private String tenantId;

        @NotNull(message = "{validation.integration_type.not_null}")
        private IntegrationType integrationType;

        @NotBlank(message = "{validation.provider_code.not_blank}")
        private String providerCode;

        @NotBlank(message = "{validation.endpoint_url.not_blank}")
        private String endpointUrl;

        private IntegrationAuthType authType;
        private Map<String, Object> authCredentials;
        private Map<String, Object> additionalParams;
        private String testUserId;
        private String testPhoneNumber;
        private String testMessage;
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
