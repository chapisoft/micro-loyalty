package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum PartnerHierarchyLevel {

    PARTNER("PARTNER", "enum.partner_hierarchy_level.partner"),
    BRANCH("BRANCH", "enum.partner_hierarchy_level.branch"),
    PRODUCT_GROUP("PRODUCT_GROUP", "enum.partner_hierarchy_level.product_group"),
    PRODUCT("PRODUCT", "enum.partner_hierarchy_level.product");

    @JsonValue
    private final String code;
    private final String messageKey;

    PartnerHierarchyLevel(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static PartnerHierarchyLevel fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (PartnerHierarchyLevel item : values()) {
            if (item.code.equalsIgnoreCase(code)) {
                return item;
            }
        }
        return null;
    }
}
