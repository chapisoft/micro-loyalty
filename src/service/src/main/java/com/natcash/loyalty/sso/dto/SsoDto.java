package com.natcash.loyalty.sso.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

public final class SsoDto {

    private SsoDto() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SsoTicketRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã đối tác không được để trống")
        private String partnerCode;

        @NotBlank(message = "Mã định danh người dùng không được để trống")
        private String externalUserId;

        private String username;
        private List<String> permissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SsoTicketResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String sessionTicket;
        private long expiresInSeconds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SsoExchangeRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Vé phiên không được để trống")
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
        private List<String> permissions;
        private long createdAt;
    }
}
