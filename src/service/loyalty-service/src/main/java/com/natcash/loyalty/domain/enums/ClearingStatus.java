package com.natcash.loyalty.domain.enums;

import lombok.Getter;

@Getter
public enum ClearingStatus {

    PENDING("Chờ phê duyệt"),
    APPROVED("Đã phê duyệt"),
    SETTLED("Đã quyết toán hoàn tất"),
    DISPUTED("Đang khiếu nại đối soát");

    private final String description;

    ClearingStatus(String description) {
        this.description = description;
    }
}
