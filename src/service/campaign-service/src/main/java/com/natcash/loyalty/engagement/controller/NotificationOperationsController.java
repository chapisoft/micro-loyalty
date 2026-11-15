package com.natcash.loyalty.engagement.controller;

import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.engagement.entity.ReminderScenarioEntity;
import com.natcash.loyalty.engagement.entity.SystemAlertEntity;
import com.natcash.loyalty.engagement.entity.UserInboxMessageEntity;
import com.natcash.loyalty.engagement.entity.UserNotificationPreferenceEntity;
import com.natcash.loyalty.engagement.repository.ReminderScenarioRepository;
import com.natcash.loyalty.engagement.repository.SystemAlertRepository;
import com.natcash.loyalty.engagement.repository.UserInboxMessageRepository;
import com.natcash.loyalty.engagement.repository.UserNotificationPreferenceRepository;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/loyalty/v1")
@RequiredArgsConstructor
@Tag(name = "Notifications, Scenarios & Alerts API", description = "Kịch bản gợi nhắc 3 bên, Cảnh báo hệ thống, Opt-out & Inbox (CN-02..05)")
public class NotificationOperationsController {

    private final ReminderScenarioRepository scenarioRepository;
    private final SystemAlertRepository alertRepository;
    private final UserNotificationPreferenceRepository preferenceRepository;
    private final UserInboxMessageRepository inboxRepository;

    @GetMapping("/engagement/scenarios")
    @Operation(summary = "Danh sách kịch bản gợi nhắc đa ngôn ngữ")
    public ResponseEntity<List<ReminderScenarioEntity>> listScenarios(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        return ResponseEntity.ok(scenarioRepository.findByTenantIdOrderByIdDesc(resolveTenantId(headerTenantId)));
    }

    @PostMapping("/engagement/scenarios")
    @Operation(summary = "Tạo hoặc cập nhật kịch bản gợi nhắc")
    public ResponseEntity<ReminderScenarioEntity> saveScenario(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody ReminderScenarioEntity request) {
        String tenantId = resolveTenantId(headerTenantId);
        ReminderScenarioEntity entity = scenarioRepository
                .findByTenantIdAndScenarioCode(tenantId, request.getScenarioCode())
                .orElseGet(() -> ReminderScenarioEntity.builder()
                        .tenantId(tenantId)
                        .scenarioCode(request.getScenarioCode())
                        .build());
        entity.setScenarioName(request.getScenarioName());
        if (request.getTargetSegment() != null) {
            entity.setTargetSegment(request.getTargetSegment());
        }
        if (request.getChannel() != null) {
            entity.setChannel(request.getChannel());
        }
        entity.setTriggerEvent(request.getTriggerEvent());
        entity.setTitleVi(request.getTitleVi());
        entity.setTitleEn(request.getTitleEn());
        entity.setTitleFr(request.getTitleFr());
        entity.setTitleHt(request.getTitleHt());
        entity.setBodyVi(request.getBodyVi());
        entity.setBodyEn(request.getBodyEn());
        entity.setBodyFr(request.getBodyFr());
        entity.setBodyHt(request.getBodyHt());
        entity.setDeepLink(request.getDeepLink());
        if (request.getCooldownHours() != null) {
            entity.setCooldownHours(request.getCooldownHours());
        }
        if (request.getIsMarketing() != null) {
            entity.setIsMarketing(request.getIsMarketing());
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }
        return ResponseEntity.ok(scenarioRepository.save(entity));
    }

    @DeleteMapping("/engagement/scenarios/{id}")
    @Operation(summary = "Xóa kịch bản gợi nhắc")
    public ResponseEntity<Void> deleteScenario(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id) {
        String tenantId = resolveTenantId(headerTenantId);
        ReminderScenarioEntity scenario = scenarioRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        scenarioRepository.delete(scenario);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/engagement/send-logs")
    @Operation(summary = "Nhật ký gửi thông báo / gợi nhắc")
    public ResponseEntity<List<UserInboxMessageEntity>> getReminderSendLogs(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = resolveTenantId(headerTenantId);
        return ResponseEntity.ok(inboxRepository.findByTenantIdOrderByCreatedAtDesc(tenantId));
    }

    @GetMapping("/alerts")
    @Operation(summary = "Danh sách cảnh báo hệ thống")
    public ResponseEntity<List<SystemAlertEntity>> listAlerts(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "acknowledged", required = false) Boolean acknowledged) {
        String tenantId = resolveTenantId(headerTenantId);
        if (acknowledged != null) {
            return ResponseEntity.ok(alertRepository.findByTenantIdAndAcknowledgedOrderByCreatedAtDesc(tenantId, acknowledged));
        }
        return ResponseEntity.ok(alertRepository.findByTenantIdOrderByCreatedAtDesc(tenantId));
    }

    @PostMapping({"/alerts/{id}/acknowledge", "/alerts/{id}/resolve"})
    @Operation(summary = "Xác nhận đã xử lý cảnh báo hệ thống")
    public ResponseEntity<SystemAlertEntity> acknowledgeAlert(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id,
            @RequestParam(value = "actor", required = false, defaultValue = "admin") String actor) {
        String tenantId = resolveTenantId(headerTenantId);
        SystemAlertEntity alert = alertRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        alert.setAcknowledged(Boolean.TRUE);
        alert.setAcknowledgedBy(actor);
        alert.setAcknowledgedAt(Instant.now());
        return ResponseEntity.ok(alertRepository.save(alert));
    }

    @GetMapping("/notification-preferences")
    @Operation(summary = "Lấy tùy chọn nhận thông báo & opt-out tiếp thị")
    public ResponseEntity<UserNotificationPreferenceEntity> getPreferences(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam("externalUserId") String externalUserId) {
        String tenantId = resolveTenantId(headerTenantId);
        UserNotificationPreferenceEntity pref = preferenceRepository
                .findByTenantIdAndExternalUserId(tenantId, externalUserId)
                .orElseGet(() -> UserNotificationPreferenceEntity.builder()
                        .tenantId(tenantId)
                        .externalUserId(externalUserId)
                        .build());
        return ResponseEntity.ok(pref);
    }

    @PutMapping("/notification-preferences")
    @Operation(summary = "Cập nhật tùy chọn nhận thông báo & opt-out tiếp thị")
    public ResponseEntity<UserNotificationPreferenceEntity> updatePreferences(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody UserNotificationPreferenceEntity request) {
        String tenantId = resolveTenantId(headerTenantId);
        UserNotificationPreferenceEntity pref = preferenceRepository
                .findByTenantIdAndExternalUserId(tenantId, request.getExternalUserId())
                .orElseGet(() -> UserNotificationPreferenceEntity.builder()
                        .tenantId(tenantId)
                        .externalUserId(request.getExternalUserId())
                        .build());
        if (request.getOptOutMarketing() != null) {
            pref.setOptOutMarketing(request.getOptOutMarketing());
        }
        if (request.getAllowPush() != null) {
            pref.setAllowPush(request.getAllowPush());
        }
        if (request.getAllowSms() != null) {
            pref.setAllowSms(request.getAllowSms());
        }
        if (request.getAllowInApp() != null) {
            pref.setAllowInApp(request.getAllowInApp());
        }
        if (request.getPreferredLocale() != null) {
            pref.setPreferredLocale(request.getPreferredLocale());
        }
        if (request.getQuietHoursEnabled() != null) {
            pref.setQuietHoursEnabled(request.getQuietHoursEnabled());
        }
        return ResponseEntity.ok(preferenceRepository.save(pref));
    }

    @GetMapping("/inbox")
    @Operation(summary = "Hộp thư thông báo của hội viên")
    public ResponseEntity<List<UserInboxMessageEntity>> listInbox(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam("externalUserId") String externalUserId) {
        return ResponseEntity.ok(inboxRepository.findByTenantIdAndExternalUserIdOrderByCreatedAtDesc(
                resolveTenantId(headerTenantId), externalUserId));
    }

    @PostMapping("/inbox/{id}/read")
    @Operation(summary = "Đánh dấu đã đọc tin nhắn trong hộp thư")
    public ResponseEntity<UserInboxMessageEntity> markInboxRead(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id) {
        String tenantId = resolveTenantId(headerTenantId);
        UserInboxMessageEntity msg = inboxRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        msg.setIsRead(Boolean.TRUE);
        msg.setReadAt(Instant.now());
        return ResponseEntity.ok(inboxRepository.save(msg));
    }

    private String resolveTenantId(String headerTenantId) {
        return headerTenantId != null && !headerTenantId.isBlank()
                ? headerTenantId.trim()
                : TenantContext.getTenantId();
    }
}
