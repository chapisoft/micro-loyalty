package com.natcash.loyalty.device;

import com.natcash.loyalty.device.dto.DeviceRegistrationDto.DeviceRegisterRequest;
import com.natcash.loyalty.device.dto.DeviceRegistrationDto.DeviceRegisterResponse;
import com.natcash.loyalty.device.dto.DeviceRegistrationDto.DeviceUnregisterRequest;
import com.natcash.loyalty.device.dto.DeviceRegistrationDto.DeviceUnregisterResponse;
import com.natcash.loyalty.device.entity.PartnerUserDeviceEntity;
import com.natcash.loyalty.device.repository.PartnerUserDeviceRepository;
import com.natcash.loyalty.device.service.DeviceRegistrationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeviceRegistrationServiceTest {

    @Mock
    private PartnerUserDeviceRepository deviceRepository;

    @InjectMocks
    private DeviceRegistrationService deviceService;

    @Test
    @DisplayName("BE-16.1: Đăng ký thiết bị mới thành công")
    void testRegisterNewDeviceSuccess() {
        DeviceRegisterRequest request = DeviceRegisterRequest.builder()
                .partnerCode("NATCASH_WALLET")
                .externalUserId("0987654321")
                .deviceId("DEV_IPHONE_16_PRO")
                .fcmToken("fcm_token_sample_123456")
                .deviceType("IOS")
                .appVersion("2.4.0")
                .language("vi")
                .build();

        when(deviceRepository.findByTenantIdAndPartnerCodeAndExternalUserIdAndDeviceId(
                "TENANT_DELIMART", "NATCASH_WALLET", "0987654321", "DEV_IPHONE_16_PRO"))
                .thenReturn(Optional.empty());

        PartnerUserDeviceEntity savedEntity = PartnerUserDeviceEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .partnerCode("NATCASH_WALLET")
                .externalUserId("0987654321")
                .deviceId("DEV_IPHONE_16_PRO")
                .fcmToken("fcm_token_sample_123456")
                .deviceType("IOS")
                .appVersion("2.4.0")
                .language("vi")
                .isActive(true)
                .build();

        when(deviceRepository.save(any(PartnerUserDeviceEntity.class))).thenReturn(savedEntity);

        DeviceRegisterResponse response = deviceService.registerDevice("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("NATCASH_WALLET", response.getPartnerCode());
        assertEquals("0987654321", response.getExternalUserId());
        assertEquals("DEV_IPHONE_16_PRO", response.getDeviceId());
        assertTrue(response.getIsActive());

        verify(deviceRepository, times(1)).save(any(PartnerUserDeviceEntity.class));
    }

    @Test
    @DisplayName("BE-16.2: Cập nhật token thiết bị đã tồn tại thành công")
    void testUpdateExistingDeviceTokenSuccess() {
        PartnerUserDeviceEntity existing = PartnerUserDeviceEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .partnerCode("NATCASH_WALLET")
                .externalUserId("0987654321")
                .deviceId("DEV_IPHONE_16_PRO")
                .fcmToken("old_token_xyz")
                .deviceType("IOS")
                .appVersion("2.3.0")
                .language("vi")
                .isActive(false)
                .build();

        when(deviceRepository.findByTenantIdAndPartnerCodeAndExternalUserIdAndDeviceId(
                "TENANT_DELIMART", "NATCASH_WALLET", "0987654321", "DEV_IPHONE_16_PRO"))
                .thenReturn(Optional.of(existing));

        when(deviceRepository.save(any(PartnerUserDeviceEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        DeviceRegisterRequest request = DeviceRegisterRequest.builder()
                .partnerCode("NATCASH_WALLET")
                .externalUserId("0987654321")
                .deviceId("DEV_IPHONE_16_PRO")
                .fcmToken("new_token_updated_abc")
                .deviceType("IOS")
                .appVersion("2.4.0")
                .language("en")
                .build();

        DeviceRegisterResponse response = deviceService.registerDevice("TENANT_DELIMART", request);

        assertNotNull(response);
        assertTrue(response.getIsActive());
        assertEquals("new_token_updated_abc", existing.getFcmToken());
        assertEquals("2.4.0", existing.getAppVersion());
        assertEquals("en", existing.getLanguage());

        verify(deviceRepository, times(1)).save(existing);
    }

    @Test
    @DisplayName("BE-16.3: Hủy kích hoạt thiết bị khi đăng xuất")
    void testUnregisterDeviceSuccess() {
        PartnerUserDeviceEntity existing = PartnerUserDeviceEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .partnerCode("NATCASH_WALLET")
                .externalUserId("0987654321")
                .deviceId("DEV_IPHONE_16_PRO")
                .isActive(true)
                .build();

        when(deviceRepository.findByTenantIdAndPartnerCodeAndExternalUserIdAndDeviceId(
                "TENANT_DELIMART", "NATCASH_WALLET", "0987654321", "DEV_IPHONE_16_PRO"))
                .thenReturn(Optional.of(existing));

        DeviceUnregisterRequest request = DeviceUnregisterRequest.builder()
                .partnerCode("NATCASH_WALLET")
                .externalUserId("0987654321")
                .deviceId("DEV_IPHONE_16_PRO")
                .build();

        DeviceUnregisterResponse response = deviceService.unregisterDevice("TENANT_DELIMART", request);

        assertNotNull(response);
        assertFalse(response.getIsActive());
        assertFalse(existing.getIsActive());

        verify(deviceRepository, times(1)).save(existing);
    }

    @Test
    @DisplayName("BE-16.4: Tra cứu danh sách token thiết bị active theo đối tác")
    void testGetActiveDeviceTokens() {
        PartnerUserDeviceEntity dev1 = PartnerUserDeviceEntity.builder()
                .fcmToken("token_1")
                .isActive(true)
                .build();
        PartnerUserDeviceEntity dev2 = PartnerUserDeviceEntity.builder()
                .fcmToken("token_2")
                .isActive(true)
                .build();

        when(deviceRepository.findByTenantIdAndPartnerCodeAndExternalUserIdAndIsActiveTrue(
                "TENANT_DELIMART", "NATCASH_WALLET", "0987654321"))
                .thenReturn(List.of(dev1, dev2));

        List<String> tokens = deviceService.getActiveDeviceTokens(
                "TENANT_DELIMART", "NATCASH_WALLET", "0987654321");

        assertEquals(2, tokens.size());
        assertEquals("token_1", tokens.get(0));
        assertEquals("token_2", tokens.get(1));
    }
}
