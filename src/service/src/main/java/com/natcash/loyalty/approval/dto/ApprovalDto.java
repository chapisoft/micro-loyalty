package com.natcash.loyalty.approval.dto;

import com.natcash.loyalty.domain.enums.ApprovalActionType;
import com.natcash.loyalty.domain.enums.ApprovalStatus;
import com.natcash.loyalty.domain.enums.ApprovalTargetType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

public class ApprovalDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateApprovalRequest {
        @NotNull
        private ApprovalTargetType targetType;
        @NotBlank
        private String targetId;
        @NotNull
        private ApprovalActionType actionType;
        private String title;
        private Object payloadBefore;
        private Object payloadAfter;
        private String makerUsername;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApproveActionRequest {
        private String checkerUsername;
        private String note;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RejectActionRequest {
        private String checkerUsername;
        @NotBlank
        private String rejectReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApprovalItemResponse {
        private Long id;
        private String requestCode;
        private String tenantId;
        private ApprovalTargetType targetType;
        private String targetId;
        private ApprovalActionType actionType;
        private String title;
        private String payloadBefore;
        private String payloadAfter;
        private String makerUsername;
        private String checkerUsername;
        private ApprovalStatus status;
        private String reason;
        private String rejectReason;
        private Instant reviewedAt;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApprovalPageResponse {
        private List<ApprovalItemResponse> items;
        private List<ApprovalItemResponse> content;
        private long totalElements;
        private int totalPages;
        private int currentPage;
        private int pageSize;
        private long pendingCount;
    }
}
