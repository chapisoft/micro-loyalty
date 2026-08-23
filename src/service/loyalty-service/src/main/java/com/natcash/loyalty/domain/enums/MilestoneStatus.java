package com.natcash.loyalty.domain.enums;

import lombok.Getter;

@Getter
public enum MilestoneStatus {

    IN_PROGRESS("Đang thực hiện"),
    COMPLETED("Đã hoàn thành điều kiện"),
    CLAIMED("Đã nhận phần thưởng");

    private final String description;

    MilestoneStatus(String description) {
        this.description = description;
    }
}
