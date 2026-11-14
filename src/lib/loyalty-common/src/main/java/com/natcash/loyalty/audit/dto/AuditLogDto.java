package com.natcash.loyalty.audit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String tenantId;
    private String module;
    private String tableName;
    private String operation;
    private String entityId;
    private String username;
    private String actorRole;
    private String clientIp;
    private String userAgent;
    private String timestamp;
    private String beforeData;
    private String afterData;
    private String description;
    private String status;
    private Long executionTimeMs;
}
