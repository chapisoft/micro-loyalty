package com.natcash.loyalty.domain.enums;

import lombok.Getter;

@Getter
public enum CampaignMetric {

    BILL_AMOUNT("Tổng chi tiêu hóa đơn"),
    TRANSACTION_COUNT("Số lượng giao dịch"),
    EARN_POINTS("Số điểm tích lũy"),
    GAME_SPINS("Số lượt tham gia trò chơi");

    private final String description;

    CampaignMetric(String description) {
        this.description = description;
    }
}
