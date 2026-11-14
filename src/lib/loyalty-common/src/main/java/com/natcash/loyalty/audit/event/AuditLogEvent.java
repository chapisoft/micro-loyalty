package com.natcash.loyalty.audit.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private String tenantId;
    private String module;
    private String tableName;
    private String operation;
    private String entityId;
    private String actorUsername;
    private String actorRole;
    private String clientIp;
    private String userAgent;
    private String beforeData;
    private String afterData;
    private String description;
    private String status;
    private Long executionTimeMs;
}
