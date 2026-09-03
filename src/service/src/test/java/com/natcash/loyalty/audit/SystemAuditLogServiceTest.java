package com.natcash.loyalty.audit;

import com.natcash.loyalty.audit.controller.AuditLogController.AuditLogPageResponse;
import com.natcash.loyalty.audit.entity.SystemAuditLogEntity;
import com.natcash.loyalty.audit.event.AuditLogEvent;
import com.natcash.loyalty.audit.repository.SystemAuditLogRepository;
import com.natcash.loyalty.audit.service.SystemAuditLogService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemAuditLogServiceTest {

    @Mock
    private SystemAuditLogRepository auditLogRepository;

    private SystemAuditLogService auditLogService;

    @BeforeEach
    void setUp() {
        auditLogService = new SystemAuditLogService(auditLogRepository);
    }

    @Test
    @DisplayName("Ghi nhật ký kiểm toán thành công khi nhận AuditLogEvent")
    void testRecordActionSuccess() {
        AuditLogEvent event = AuditLogEvent.builder()
                .tenantId("TENANT_DELIMART")
                .module("POLICY")
                .tableName("loyalty_acceptance_policies")
                .operation("UPDATE")
                .entityId("POL_01")
                .actorUsername("operator")
                .actorRole("OPERATOR")
                .clientIp("192.168.1.50")
                .userAgent("Chrome/128")
                .beforeData("{\"maxBurn\": 40}")
                .afterData("{\"maxBurn\": 50}")
                .description("Nâng tỷ lệ khấu trừ tối đa")
                .status("SUCCESS")
                .executionTimeMs(25L)
                .build();

        when(auditLogRepository.save(any(SystemAuditLogEntity.class))).thenAnswer(invocation -> {
            SystemAuditLogEntity entity = invocation.getArgument(0);
            entity.setId(101L);
            entity.setCreatedAt(Instant.now());
            return entity;
        });

        SystemAuditLogEntity result = auditLogService.recordAction(event);

        assertNotNull(result);
        assertEquals(101L, result.getId());
        assertEquals("TENANT_DELIMART", result.getTenantId());
        assertEquals("POLICY", result.getModule());
        assertEquals("UPDATE", result.getOperation());

        ArgumentCaptor<SystemAuditLogEntity> captor = ArgumentCaptor.forClass(SystemAuditLogEntity.class);
        verify(auditLogRepository).save(captor.capture());
        SystemAuditLogEntity captured = captor.getValue();
        assertEquals("operator", captured.getActorUsername());
        assertEquals("192.168.1.50", captured.getClientIp());
    }

    @Test
    @DisplayName("Truy vấn nhật ký kiểm toán phân trang từ CSDL PostgreSQL")
    void testGetAuditLogsPaged() {
        SystemAuditLogEntity sample = SystemAuditLogEntity.builder()
                .id(1L)
                .tenantId("TENANT_NATCASH")
                .module("GAMEHUB")
                .tableName("loyalty_games")
                .operation("UPDATE")
                .entityId("LUCKY_WHEEL")
                .actorUsername("admin")
                .actorRole("SUPER_ADMIN")
                .clientIp("10.228.37.15")
                .beforeData("{\"budget\": 30000}")
                .afterData("{\"budget\": 50000}")
                .description("Tăng ngân sách ngày")
                .status("SUCCESS")
                .executionTimeMs(10L)
                .createdAt(Instant.now())
                .build();

        when(auditLogRepository.findAll(
                any(org.springframework.data.jpa.domain.Specification.class),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(sample)));

        AuditLogPageResponse response = auditLogService.getAuditLogs(
                "TENANT_NATCASH",
                "loyalty_games",
                "UPDATE",
                "admin",
                "2026-09-01",
                "2026-09-30",
                0,
                20
        );

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        assertEquals(1, response.getData().size());
        assertEquals("LUCKY_WHEEL", response.getData().get(0).getEntityId());
        assertEquals("TENANT_NATCASH", response.getData().get(0).getTenantId());
        assertEquals("10.228.37.15", response.getData().get(0).getClientIp());
    }
}
