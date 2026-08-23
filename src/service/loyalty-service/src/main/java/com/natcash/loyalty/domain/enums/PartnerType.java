package com.natcash.loyalty.domain.enums;

import lombok.Getter;

@Getter
public enum PartnerType {

    RETAIL("Bán lẻ / Siêu thị"),
    TELECOM("Viễn thông"),
    BANKING("Ngân hàng / Ví điện tử"),
    F_AND_B("Ẩm thực / Nhà hàng"),
    FUEL("Cây xăng / Nhiên liệu");

    private final String description;

    PartnerType(String description) {
        this.description = description;
    }
}
