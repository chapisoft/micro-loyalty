package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum PartnerStaffRole {
    PARTNER_OWNER("PARTNER_OWNER"),
    PARTNER_BRANCH_MANAGER("PARTNER_BRANCH_MANAGER"),
    PARTNER_CASHIER("PARTNER_CASHIER");

    @JsonValue
    private final String code;

    PartnerStaffRole(String code) {
        this.code = code;
    }

    @JsonCreator
    public static PartnerStaffRole fromCode(String code) {
        if (code == null) return null;
        for (PartnerStaffRole r : values()) {
            if (r.code.equalsIgnoreCase(code)) return r;
        }
        return null;
    }
}
