package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum SystemRoleCode {

    ROLE_USER("ROLE_USER", "enum.system_role.user"),
    ROLE_PARTNER("ROLE_PARTNER", "enum.system_role.partner"),
    SUPER_ADMIN("SUPER_ADMIN", "enum.system_role.super_admin"),
    ADMIN("ADMIN", "enum.system_role.admin"),
    LOYALTY_ADMIN("LOYALTY_ADMIN", "enum.system_role.loyalty_admin"),
    OPERATOR("OPERATOR", "enum.system_role.operator"),
    FINANCE_AUDITOR("FINANCE_AUDITOR", "enum.system_role.finance_auditor"),
    CAMPAIGN_MANAGER("CAMPAIGN_MANAGER", "enum.system_role.campaign_manager"),
    PARTNER_MANAGER("PARTNER_MANAGER", "enum.system_role.partner_manager"),
    CUSTOMER_SUPPORT("CUSTOMER_SUPPORT", "enum.system_role.customer_support"),
    SUPPORT("SUPPORT", "enum.system_role.support"),
    PARTNER_ADMIN("PARTNER_ADMIN", "enum.system_role.partner_admin"),
    PARTNER_OWNER("PARTNER_OWNER", "enum.system_role.partner_owner");

    @JsonValue
    private final String code;
    private final String messageKey;

    SystemRoleCode(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static SystemRoleCode fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (SystemRoleCode item : values()) {
            if (item.code.equalsIgnoreCase(code.trim())) {
                return item;
            }
        }
        return null;
    }
}
