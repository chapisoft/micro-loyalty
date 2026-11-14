package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum SystemPermissionCode {

    ALL("ALL", "enum.system_permission.all"),
    READ("READ", "enum.system_permission.read"),
    WRITE("WRITE", "enum.system_permission.write"),
    DELETE("DELETE", "enum.system_permission.delete"),
    APPROVE("APPROVE", "enum.system_permission.approve"),
    OPERATE("OPERATE", "enum.system_permission.operate"),
    SUPPORT("SUPPORT", "enum.system_permission.support"),
    PARTNER_PORTAL("PARTNER_PORTAL", "enum.system_permission.partner_portal");

    @JsonValue
    private final String code;
    private final String messageKey;

    SystemPermissionCode(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static SystemPermissionCode fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (SystemPermissionCode item : values()) {
            if (item.code.equalsIgnoreCase(code.trim())) {
                return item;
            }
        }
        return null;
    }
}
