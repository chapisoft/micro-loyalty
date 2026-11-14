package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum PartnerStaffRole {
    PARTNER_OWNER("PARTNER_OWNER"),
    PARTNER_ADMIN("PARTNER_ADMIN"),
    PARTNER_BRANCH_MANAGER("PARTNER_BRANCH_MANAGER"),
    PARTNER_ACCOUNTANT("PARTNER_ACCOUNTANT"),
    PARTNER_CASHIER("PARTNER_CASHIER");

    @JsonValue
    private final String code;

    PartnerStaffRole(String code) {
        this.code = code;
    }

    @JsonCreator
    public static PartnerStaffRole fromCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        String normalized = code.trim().toUpperCase();
        return switch (normalized) {
            case "OWNER", "PARTNER_OWNER" -> PARTNER_OWNER;
            case "ADMIN", "PARTNER_ADMIN" -> PARTNER_ADMIN;
            case "BRANCH_MANAGER", "PARTNER_BRANCH_MANAGER" -> PARTNER_BRANCH_MANAGER;
            case "ACCOUNTANT", "PARTNER_ACCOUNTANT" -> PARTNER_ACCOUNTANT;
            case "CASHIER", "PARTNER_CASHIER" -> PARTNER_CASHIER;
            default -> null;
        };
    }
}
