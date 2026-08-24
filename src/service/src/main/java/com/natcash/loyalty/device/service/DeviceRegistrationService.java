package com.natcash.loyalty.device.service;

import com.natcash.loyalty.device.dto.DeviceRegistrationDto.DeviceRegisterRequest;
import com.natcash.loyalty.device.dto.DeviceRegistrationDto.DeviceRegisterResponse;
import com.natcash.loyalty.device.dto.DeviceRegistrationDto.DeviceUnregisterRequest;
import com.natcash.loyalty.device.dto.DeviceRegistrationDto.DeviceUnregisterResponse;
import com.natcash.loyalty.device.entity.PartnerUserDeviceEntity;
import com.natcash.loyalty.device.repository.PartnerUserDeviceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DeviceRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(DeviceRegistrationService.class);

    private final PartnerUserDeviceRepository deviceRepository;

    public DeviceRegistrationService(PartnerUserDeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    @Transactional
    public DeviceRegisterResponse registerDevice(String tenantId, DeviceRegisterRequest request) {
        String partnerCode = request.getPartnerCode();
        String userId = request.getExternalUserId();
        String deviceId = request.getDeviceId();
        String fcmToken = request.getFcmToken();
        String deviceType = request.getDeviceType() != null ? request.getDeviceType() : "ANDROID";
        String appVersion = request.getAppVersion();
        String language = request.getLanguage() != null ? request.getLanguage() : "vi";

        Optional<PartnerUserDeviceEntity> existingOpt = deviceRepository
                .findByTenantIdAndPartnerCodeAndExternalUserIdAndDeviceId(tenantId, partnerCode, userId, deviceId);

        PartnerUserDeviceEntity device;
        if (existingOpt.isPresent()) {
            device = existingOpt.get();
            device.setFcmToken(fcmToken);
            device.setDeviceType(deviceType);
            device.setAppVersion(appVersion);
            device.setLanguage(language);
            device.setIsActive(true);
            log.info("[DEVICE-REGISTER-UPDATE] tenantId={}, partner={}, user={}, deviceId={}",
                    tenantId, partnerCode, userId, deviceId);
        } else {
            device = PartnerUserDeviceEntity.builder()
                    .tenantId(tenantId)
                    .partnerCode(partnerCode)
                    .externalUserId(userId)
                    .deviceId(deviceId)
                    .fcmToken(fcmToken)
                    .deviceType(deviceType)
                    .appVersion(appVersion)
                    .language(language)
                    .isActive(true)
                    .build();
            log.info("[DEVICE-REGISTER-NEW] tenantId={}, partner={}, user={}, deviceId={}",
                    tenantId, partnerCode, userId, deviceId);
        }

        device = deviceRepository.save(device);

        return DeviceRegisterResponse.builder()
                .id(device.getId())
                .partnerCode(partnerCode)
                .externalUserId(userId)
                .deviceId(deviceId)
                .deviceType(deviceType)
                .isActive(device.getIsActive())
                .message("Đăng ký thiết bị và cập nhật token thành công")
                .timestamp(Instant.now())
                .build();
    }

    @Transactional
    public DeviceUnregisterResponse unregisterDevice(String tenantId, DeviceUnregisterRequest request) {
        String partnerCode = request.getPartnerCode();
        String userId = request.getExternalUserId();
        String deviceId = request.getDeviceId();

        Optional<PartnerUserDeviceEntity> existingOpt = deviceRepository
                .findByTenantIdAndPartnerCodeAndExternalUserIdAndDeviceId(tenantId, partnerCode, userId, deviceId);

        boolean updated = false;
        if (existingOpt.isPresent()) {
            PartnerUserDeviceEntity device = existingOpt.get();
            device.setIsActive(false);
            deviceRepository.save(device);
            updated = true;
            log.info("[DEVICE-UNREGISTER] tenantId={}, partner={}, user={}, deviceId={}",
                    tenantId, partnerCode, userId, deviceId);
        }

        return DeviceUnregisterResponse.builder()
                .partnerCode(partnerCode)
                .externalUserId(userId)
                .deviceId(deviceId)
                .isActive(false)
                .message(updated ? "Hủy kích hoạt thiết bị thành công" : "Thiết bị không tồn tại hoặc đã bị hủy")
                .timestamp(Instant.now())
                .build();
    }

    @Transactional(readOnly = true)
    public List<String> getActiveDeviceTokens(String tenantId, String partnerCode, String externalUserId) {
        List<PartnerUserDeviceEntity> devices = deviceRepository
                .findByTenantIdAndPartnerCodeAndExternalUserIdAndIsActiveTrue(tenantId, partnerCode, externalUserId);
        return devices.stream().map(dev -> dev.getFcmToken()).collect(Collectors.toList());
    }
}
