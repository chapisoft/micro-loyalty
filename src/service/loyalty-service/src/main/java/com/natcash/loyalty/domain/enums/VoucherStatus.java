package com.natcash.loyalty.domain.enums;

import lombok.Getter;

@Getter
public enum VoucherStatus {

    ACTIVE("Khả dụng"),
    USED("Đã sử dụng"),
    EXPIRED("Đã hết hạn"),
    CANCELLED("Đã hủy");

    private final String description;

    VoucherStatus(String description) {
        this.description = description;
    }
}
