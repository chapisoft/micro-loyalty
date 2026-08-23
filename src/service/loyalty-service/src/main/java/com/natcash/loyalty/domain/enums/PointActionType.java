package com.natcash.loyalty.domain.enums;

import lombok.Getter;

@Getter
public enum PointActionType {

    EARN("Tích điểm"),
    BURN("Tiêu điểm"),
    REFUND("Hoàn điểm"),
    EXPIRE("Hết hạn điểm"),
    ADJUST("Điều chỉnh điểm"),
    CASHBACK("Đổi điểm sang hoàn tiền ví");

    private final String description;

    PointActionType(String description) {
        this.description = description;
    }
}
