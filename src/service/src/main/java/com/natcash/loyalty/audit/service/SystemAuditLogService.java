package com.natcash.loyalty.audit.service;

import com.natcash.loyalty.audit.controller.AuditLogController.AuditLogDto;
import com.natcash.loyalty.audit.controller.AuditLogController.AuditLogPageResponse;
import com.natcash.loyalty.audit.entity.SystemAuditLogEntity;
import com.natcash.loyalty.audit.event.AuditLogEvent;
import com.natcash.loyalty.audit.repository.SystemAuditLogRepository;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemAuditLogService {

    private final SystemAuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public AuditLogPageResponse getAuditLogs(
            String tenantId,
            String tableName,
            String operation,
            String username,
            String fromDate,
            String toDate,
            int page,
            int size) {

        Instant fromTime = parseDateStartOfDay(fromDate);
        Instant toTime = parseDateEndOfDay(toDate);

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));

        Specification<SystemAuditLogEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (tenantId != null && !tenantId.isBlank()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId.trim()));
            }
            if (tableName != null && !tableName.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("tableName")), tableName.trim().toLowerCase()));
            }
            if (operation != null && !operation.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("operation")), operation.trim().toUpperCase()));
            }
            if (username != null && !username.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("actorUsername")), "%" + username.trim().toLowerCase() + "%"));
            }
            if (fromTime != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromTime));
            }
            if (toTime != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toTime));
            }

            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<SystemAuditLogEntity> pagedResult = auditLogRepository.findAll(spec, pageable);

        List<AuditLogDto> dtos = pagedResult.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return AuditLogPageResponse.builder()
                .data(dtos)
                .content(dtos)
                .totalElements(pagedResult.getTotalElements())
                .totalPages(pagedResult.getTotalPages())
                .currentPage(pagedResult.getNumber())
                .pageSize(pagedResult.getSize())
                .build();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public SystemAuditLogEntity recordAction(AuditLogEvent event) {
        if (event == null) {
            return null;
        }
        try {
            SystemAuditLogEntity entity = SystemAuditLogEntity.builder()
                    .tenantId(event.getTenantId() != null ? event.getTenantId() : "TENANT_NATCASH")
                    .module(event.getModule() != null ? event.getModule() : "SYSTEM")
                    .tableName(event.getTableName() != null ? event.getTableName() : "unknown")
                    .operation(event.getOperation() != null ? event.getOperation().toUpperCase() : "EXECUTE")
                    .entityId(event.getEntityId() != null ? event.getEntityId() : "N/A")
                    .actorUsername(event.getActorUsername() != null ? event.getActorUsername() : "system")
                    .actorRole(event.getActorRole())
                    .clientIp(event.getClientIp())
                    .userAgent(event.getUserAgent())
                    .beforeData(event.getBeforeData())
                    .afterData(event.getAfterData())
                    .description(event.getDescription())
                    .status(event.getStatus() != null ? event.getStatus() : "SUCCESS")
                    .executionTimeMs(event.getExecutionTimeMs() != null ? event.getExecutionTimeMs() : 0L)
                    .createdAt(Instant.now())
                    .build();

            SystemAuditLogEntity saved = auditLogRepository.save(entity);
            log.info("[AUDIT-RECORDED] id={}, tenant={}, module={}, table={}, op={}, actor={}, entity={}",
                    saved.getId(), saved.getTenantId(), saved.getModule(), saved.getTableName(),
                    saved.getOperation(), saved.getActorUsername(), saved.getEntityId());
            return saved;
        } catch (Exception e) {
            log.error("[AUDIT-RECORD-FAILED] Không thể ghi audit log: {}", e.getMessage(), e);
            return null;
        }
    }

    @Async("auditTaskExecutor")
    public void recordActionAsync(AuditLogEvent event) {
        recordAction(event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("auditTaskExecutor")
    public void handleAuditLogEvent(AuditLogEvent event) {
        recordAction(event);
    }

    private AuditLogDto mapToDto(SystemAuditLogEntity entity) {
        return AuditLogDto.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .module(entity.getModule())
                .tableName(entity.getTableName())
                .operation(entity.getOperation())
                .entityId(entity.getEntityId())
                .username(entity.getActorUsername())
                .actorRole(entity.getActorRole())
                .clientIp(entity.getClientIp())
                .userAgent(entity.getUserAgent())
                .timestamp(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null)
                .beforeData(entity.getBeforeData())
                .afterData(entity.getAfterData())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .executionTimeMs(entity.getExecutionTimeMs())
                .build();
    }

    private Instant parseDateStartOfDay(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        try {
            String clean = dateStr.trim().substring(0, 10);
            LocalDate date = LocalDate.parse(clean, DateTimeFormatter.ISO_LOCAL_DATE);
            return date.atStartOfDay(ZoneOffset.UTC).toInstant();
        } catch (Exception e) {
            log.warn("[AUDIT-DATE-PARSE-WARN] Không thể parse fromDate {}: {}", dateStr, e.getMessage());
            return null;
        }
    }

    private Instant parseDateEndOfDay(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        try {
            String clean = dateStr.trim().substring(0, 10);
            LocalDate date = LocalDate.parse(clean, DateTimeFormatter.ISO_LOCAL_DATE);
            return date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusMillis(1);
        } catch (Exception e) {
            log.warn("[AUDIT-DATE-PARSE-WARN] Không thể parse toDate {}: {}", dateStr, e.getMessage());
            return null;
        }
    }
}
