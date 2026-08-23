package com.natcash.loyalty.domain.enums;

import lombok.Getter;

@Getter
public enum TierLevel {

    SILVER(1, "Bạc"),
    GOLD(2, "Vàng"),
    PLATINUM(3, "Bạch Kim"),
    DIAMOND(4, "Kim Cương");

    private final int level;
    private final String displayName;

    TierLevel(int level, String displayName) {
        this.level = level;
        this.displayName = displayName;
    }
}
