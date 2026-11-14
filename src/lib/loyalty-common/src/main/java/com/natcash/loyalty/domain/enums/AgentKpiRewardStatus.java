package com.natcash.loyalty.domain.enums;

import com.natcash.loyalty.util.MessageUtils;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum AgentKpiRewardStatus {

    IN_PROGRESS("IN_PROGRESS", "enum.agent_kpi_reward_status.in_progress"),
    ELIGIBLE("ELIGIBLE", "enum.agent_kpi_reward_status.eligible"),
    APPROVED("APPROVED", "enum.agent_kpi_reward_status.approved"),
    CLAIMED("CLAIMED", "enum.agent_kpi_reward_status.claimed"),
    PAID("PAID", "enum.agent_kpi_reward_status.paid");

    @JsonValue
    private final String code;
    private final String messageKey;

    AgentKpiRewardStatus(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static AgentKpiRewardStatus fromCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        for (AgentKpiRewardStatus status : values()) {
            if (status.code.equalsIgnoreCase(code.trim())) {
                return status;
            }
        }
        return null;
    }
}
