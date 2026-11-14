package com.natcash.loyalty.device.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;

public final class DeviceRegistrationDto {

    private DeviceRegistrationDto() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceRegisterRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "{validation.partner_code.not_blank}")
        private String partnerCode;

        @NotBlank(message = "{validation.external_user_id.not_blank}")
        private String externalUserId;

        @NotBlank(message = "{validation.device_id.not_blank}")
        private String deviceId;

        @NotBlank(message = "{validation.fcm_token.not_blank}")
        private String fcmToken;

        private String deviceType;
        private String appVersion;
        private String language;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceRegisterResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long id;
        private String partnerCode;
        private String externalUserId;
        private String deviceId;
        private String deviceType;
        private Boolean isActive;
        private String message;
        private Instant timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceUnregisterRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "{validation.partner_code.not_blank}")
        private String partnerCode;

        @NotBlank(message = "{validation.external_user_id.not_blank}")
        private String externalUserId;

        @NotBlank(message = "{validation.device_id.not_blank}")
        private String deviceId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceUnregisterResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private String partnerCode;
        private String externalUserId;
        private String deviceId;
        private Boolean isActive;
        private String message;
        private Instant timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BrandedPushNotificationRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        private String partnerCode;
        private String externalUserId;
        private List<String> deviceIds;
        private String title;
        private String body;
        private String iconUrl;
        private String channelId;
        private String sound;
        private String deepLink;
        private Object customData;
    }
}
