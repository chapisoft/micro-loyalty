package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;

@Getter
public enum MilestoneStatus {

    IN_PROGRESS("IN_PROGRESS", "enum.milestone_status.in_progress"),
    COMPLETED("COMPLETED", "enum.milestone_status.completed"),
    CLAIMED("CLAIMED", "enum.milestone_status.claimed");

    @JsonValue
    private final String code;
    private final String messageKey;

    MilestoneStatus(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static MilestoneStatus fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (MilestoneStatus status : values()) {
            if (status.code.equalsIgnoreCase(code)) {
                return status;
            }
        }
        return null;
    }
}
