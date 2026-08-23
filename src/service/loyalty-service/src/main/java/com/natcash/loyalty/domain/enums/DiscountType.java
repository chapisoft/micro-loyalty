package com.natcash.loyalty.domain.enums;

import lombok.Getter;

@Getter
public enum DiscountType {

    FIXED_AMOUNT("Giảm giá số tiền cố định"),
    PERCENTAGE("Giảm giá theo phần trăm hóa đơn"),
    FREE_ITEM("Tặng sản phẩm / Dịch vụ miễn phí");

    private final String description;

    DiscountType(String description) {
        this.description = description;
    }
}
