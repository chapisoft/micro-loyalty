package com.natcash.loyalty.engagement.dto;

import com.natcash.loyalty.domain.enums.TriggerType;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;

public final class NudgeDto {

    private NudgeDto() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InAppNudgeRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        @NotBlank(message = "Mã người dùng không được để trống")
        private String externalUserId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NudgeItemDto implements Serializable {
        private static final long serialVersionUID = 1L;

        private Long id;
        private TriggerType triggerType;
        private String title;
        private String content;
        private String deepLinkUrl;
        private String priority; // HIGH, NORMAL, LOW
        private Instant timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InAppNudgeResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private List<NudgeItemDto> nudges;
        private int totalNudges;
    }
}
