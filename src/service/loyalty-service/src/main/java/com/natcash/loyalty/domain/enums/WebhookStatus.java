package com.natcash.loyalty.domain.enums;

import lombok.Getter;

@Getter
public enum WebhookStatus {

    PENDING("Chờ phát sự kiện"),
    PROCESSING("Đang gửi"),
    PROCESSED("Đã gửi và nhận ACK thành công"),
    FAILED("Gửi thất bại sau các lần thử lại");

    private final String description;

    WebhookStatus(String description) {
        this.description = description;
    }
}
