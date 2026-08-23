package com.natcash.loyalty.domain.enums;

import lombok.Getter;

@Getter
public enum PrizeType {

    POINTS("Điểm thưởng Loyalty"),
    VOUCHER("Phiếu ưu đãi giảm giá"),
    CASHBACK("Tiền mặt hoàn ví"),
    PHYSICAL_GIFT("Quà hiện vật đổi tại quầy"),
    NO_LUCK("Chúc bạn may mắn lần sau");

    private final String description;

    PrizeType(String description) {
        this.description = description;
    }
}
