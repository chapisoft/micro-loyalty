package com.natcash.loyalty.integration;

import com.natcash.loyalty.domain.enums.IntegrationType;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.IntegrationConfigDto;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.PaymentDeductResult;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.SaveIntegrationRequest;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.TestConnectionRequest;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.TestConnectionResponse;
import com.natcash.loyalty.integration.entity.TenantIntegrationEntity;
import com.natcash.loyalty.integration.provider.GenericRestPaymentProvider;
import com.natcash.loyalty.integration.provider.GenericRestSmsProvider;
import com.natcash.loyalty.integration.provider.NatcashPaymentProvider;
import com.natcash.loyalty.integration.provider.NatcomSmsProvider;
import com.natcash.loyalty.integration.provider.TwilioSmsProvider;
import com.natcash.loyalty.integration.repository.TenantIntegrationRepository;
import com.natcash.loyalty.integration.service.TenantIntegrationService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TenantIntegrationServiceTest {

    @Mock
    private TenantIntegrationRepository repository;
    @Mock
    private RedissonClient redissonClient;
    @Mock
    private RBucket<Object> rBucket;
    @Mock
    private NatcashWalletClient natcashWalletClient;
    @Mock
    private NatcomSmsClient natcomSmsClient;

    private TenantIntegrationService integrationService;

    private static final String TENANT_DELIMART = "TENANT_DELIMART";
    private static final String TENANT_NATCASH = "TENANT_NATCASH";

    @BeforeEach
    void setUp() {
        when(redissonClient.getBucket(anyString())).thenReturn(rBucket);
        when(rBucket.get()).thenReturn(null);

        NatcashPaymentProvider natcashPaymentProvider = new NatcashPaymentProvider(natcashWalletClient);
        GenericRestPaymentProvider genericRestPaymentProvider = new GenericRestPaymentProvider();
        NatcomSmsProvider natcomSmsProvider = new NatcomSmsProvider(natcomSmsClient);
        TwilioSmsProvider twilioSmsProvider = new TwilioSmsProvider();
        GenericRestSmsProvider genericRestSmsProvider = new GenericRestSmsProvider();

        integrationService = new TenantIntegrationService(
                repository,
                redissonClient,
                List.of(natcashPaymentProvider, genericRestPaymentProvider),
                List.of(natcomSmsProvider, twilioSmsProvider, genericRestSmsProvider)
        );
    }

    @Test
    @DisplayName("Lưu Cấu hình Tích hợp Đa Thuê bao và Xóa Cache Redis")
    void testSaveIntegration() {
        SaveIntegrationRequest request = SaveIntegrationRequest.builder()
                .tenantId(TENANT_DELIMART)
                .integrationType(IntegrationType.PAYMENT_GATEWAY)
                .providerCode("GENERIC_REST")
                .endpointUrl("https://api.delimart.ht/v1/pay")
                .authType("BEARER_TOKEN")
                .authCredentials(Map.of("token", "DELI_SECRET_TOKEN"))
                .additionalParams(Map.of("timeoutMs", 3000))
                .isActive(true)
                .build();

        TenantIntegrationEntity savedEntity = TenantIntegrationEntity.builder()
                .id(1L)
                .tenantId(TENANT_DELIMART)
                .integrationType(IntegrationType.PAYMENT_GATEWAY)
                .providerCode("GENERIC_REST")
                .endpointUrl("https://api.delimart.ht/v1/pay")
                .authType("BEARER_TOKEN")
                .authCredentials("{\"token\":\"DELI_SECRET_TOKEN\"}")
                .additionalParams("{\"timeoutMs\":3000}")
                .isActive(true)
                .updatedAt(Instant.now())
                .build();

        when(repository.findByTenantIdAndIntegrationType(TENANT_DELIMART, IntegrationType.PAYMENT_GATEWAY))
                .thenReturn(Optional.empty());
        when(repository.save(any(TenantIntegrationEntity.class))).thenReturn(savedEntity);

        IntegrationConfigDto dto = integrationService.saveIntegration(TENANT_DELIMART, request);

        assertNotNull(dto);
        assertEquals(TENANT_DELIMART, dto.getTenantId());
        assertEquals("GENERIC_REST", dto.getProviderCode());
        verify(repository, times(1)).save(any(TenantIntegrationEntity.class));
        verify(rBucket, times(1)).delete();
    }

    @Test
    @DisplayName("Thanh toán Trừ tiền Đa Thuê bao: Natcash Provider")
    void testDeductWalletPayment_NatcashProvider() {
        TenantIntegrationEntity natcashConfig = TenantIntegrationEntity.builder()
                .tenantId(TENANT_NATCASH)
                .integrationType(IntegrationType.PAYMENT_GATEWAY)
                .providerCode("NATCASH")
                .endpointUrl("http://10.228.37.65:8080/api/v1/wallet/deduct")
                .isActive(true)
                .build();

        when(repository.findByTenantIdAndIntegrationTypeAndIsActiveTrue(TENANT_NATCASH, IntegrationType.PAYMENT_GATEWAY))
                .thenReturn(Optional.of(natcashConfig));
        when(natcashWalletClient.verifyAndDeductWalletBalance(anyString(), any(BigDecimal.class), anyString()))
                .thenReturn(true);

        PaymentDeductResult result = integrationService.deductWalletPayment(
                TENANT_NATCASH, "CUST_001", BigDecimal.valueOf(300), "TX_REF_001");

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertEquals("TX_REF_001", result.getTransactionRef());
    }

    @Test
    @DisplayName("Gửi SMS Brandname Đa Thuê bao: Natcom SMS vs Twilio SMS")
    void testSendBrandnameSms() {
        TenantIntegrationEntity twilioConfig = TenantIntegrationEntity.builder()
                .tenantId(TENANT_DELIMART)
                .integrationType(IntegrationType.SMS_BRANDNAME)
                .providerCode("TWILIO")
                .endpointUrl("https://api.twilio.com/2010-04-01/Accounts")
                .authCredentials("{\"accountSid\":\"AC123\",\"authToken\":\"TOKEN123\"}")
                .additionalParams("{\"brandname\":\"DELIMART\",\"fromNumber\":\"+1800555\"}")
                .isActive(true)
                .build();

        when(repository.findByTenantIdAndIntegrationTypeAndIsActiveTrue(TENANT_DELIMART, IntegrationType.SMS_BRANDNAME))
                .thenReturn(Optional.of(twilioConfig));

        boolean sent = integrationService.sendBrandnameSms(
                TENANT_DELIMART, "+50937000000", "Ban da nhan 100 diem thuong Delimart");

        assertTrue(sent);
    }

    @Test
    @DisplayName("Kiểm tra Kết nối Thử nghiệm Endpoint (Test Connection)")
    void testConnection() {
        TestConnectionRequest req = TestConnectionRequest.builder()
                .integrationType(IntegrationType.PAYMENT_GATEWAY)
                .providerCode("GENERIC_REST")
                .endpointUrl("https://httpbin.org/post")
                .authType("API_KEY")
                .authCredentials(Map.of("apiKey", "TEST_KEY"))
                .build();

        TestConnectionResponse res = integrationService.testConnection(req);
        assertNotNull(res);
        assertTrue(res.isSuccess());
    }
}
