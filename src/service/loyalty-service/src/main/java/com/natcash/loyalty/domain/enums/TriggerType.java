package com.natcash.loyalty.domain.enums;

import lombok.Getter;

@Getter
public enum TriggerType {

    TIER_UPGRADE_NUDGE("Gợi nhắc thăng hạng sắp đạt mốc"),
    POINT_EXPIRATION_ALERT("Cảnh báo điểm tích lũy sắp hết hạn"),
    BIRTHDAY_GREETING("Chúc mừng sinh nhật và tặng quà"),
    INACTIVE_REMINDER("Nhắc nhở khách hàng lâu ngày không tương tác");

    private final String description;

    TriggerType(String description) {
        this.description = description;
    }
}
