package com.natcash.loyalty.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lib.ims.redis.service.RedisService;
import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.domain.enums.WebhookStatus;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.outbox.entity.WebhookDeadLetterEntity;
import com.natcash.loyalty.outbox.entity.WebhookOutboxEntity;
import com.natcash.loyalty.outbox.repository.WebhookDeadLetterRepository;
import com.natcash.loyalty.outbox.repository.WebhookOutboxRepository;
import com.natcash.loyalty.outbox.service.OutboxService;
import com.natcash.loyalty.security.SignatureUtils;
import com.natcash.loyalty.sso.dto.SsoDto.SsoExchangeRequest;
import com.natcash.loyalty.sso.dto.SsoDto.SsoExchangeResponse;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketRequest;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketResponse;
import com.natcash.loyalty.sso.service.SsoTicketService;
import com.natcash.loyalty.tenant.TenantContext;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InfrastructureIntegrationTest {

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private RLock rLock;

    @Mock
    private RedisService redisService;

    @Mock
    private WebhookOutboxRepository outboxRepository;

    @Mock
    private WebhookDeadLetterRepository deadLetterRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("QA-01.1: Kiểm tra tính cô lập đa thuê bao (TenantContext Isolation)")
    void testTenantContextIsolation() {
        TenantContext.setTenantId("TENANT_DELIMART");
        assertEquals("TENANT_DELIMART", TenantContext.getTenantId());

        TenantContext.clear();
        assertEquals(LoyaltyConstants.DEFAULT_TENANT_ID, TenantContext.getTenantId());
    }

    @Test
    @DisplayName("QA-01.2: Kiểm tra ký số HMAC-SHA256 và xác thực chữ ký")
    void testHmacSha256SignatureWorkflow() {
        String payload = "{\"tenantId\":\"TENANT_DELIMART\",\"amount\":50000}";
        String secretKey = "super_secret_partner_key_123456";

        String signature = SignatureUtils.calculateHmacSha256(payload, secretKey);
        assertNotNull(signature);
        assertFalse(signature.isEmpty());

        boolean valid = SignatureUtils.verifySignature(payload, signature, secretKey);
        assertTrue(valid, "Chữ ký số phải khớp tuyệt đối");

        boolean invalidPayload = SignatureUtils.verifySignature(payload + "tampered", signature, secretKey);
        assertFalse(invalidPayload, "Chữ ký số bị thay đổi dữ liệu phải bị từ chối");
    }

    @Test
    @DisplayName("QA-01.3: Kiểm tra luồng khóa phân tán chống chi tiêu điểm kép")
    void testDistributedLockExecution() throws InterruptedException {
        when(redissonClient.getLock("lock:burn:TENANT_DELIMART:USER_01")).thenReturn(rLock);
        when(rLock.tryLock(3000, 10000, TimeUnit.MILLISECONDS)).thenReturn(true);
        when(rLock.isHeldByCurrentThread()).thenReturn(true);

        DistributedLockHelper helper = new DistributedLockHelper(redissonClient);

        String result = helper.executeWithLock("lock:burn:TENANT_DELIMART:USER_01", 3000, 10000, () -> "SUCCESS_REDEEM");

        assertEquals("SUCCESS_REDEEM", result);
        verify(rLock, times(1)).unlock();
    }

    @Test
    @DisplayName("QA-01.4: Kiểm tra Transactional Outbox ghi nhận và chuyển Dead Letter")
    void testOutboxAndDeadLetterFlow() {
        OutboxService outboxService = new OutboxService(outboxRepository, deadLetterRepository, objectMapper);

        WebhookOutboxEntity entity = WebhookOutboxEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .eventType("POINTS_DEDUCTED")
                .payload("{\"points\":1000}")
                .targetUrl("https://partner.delimart.com/webhook")
                .retryCount(4)
                .maxRetries(5)
                .status(WebhookStatus.PENDING)
                .build();

        when(outboxRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(deadLetterRepository.save(any(WebhookDeadLetterEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        outboxService.handleFailure(1L, "HTTP 500 Server Error");

        assertEquals(5, entity.getRetryCount());
        assertEquals(WebhookStatus.FAILED, entity.getStatus());
        verify(deadLetterRepository, times(1)).save(any(WebhookDeadLetterEntity.class));
    }

    @Test
    @DisplayName("QA-01.5: Kiểm tra vòng đời SSO Ticket và đổi vé lấy JWT Token")
    void testSsoTicketLifecycle() {
        SsoTicketService ssoTicketService = new SsoTicketService(redisService, objectMapper);

        SsoTicketRequest request = SsoTicketRequest.builder()
                .partnerCode("DELIMART")
                .externalUserId("CUST_12345")
                .username("nguyenvana")
                .permissions(List.of("VIEW_PROFILE", "PLAY_GAME"))
                .build();

        SsoTicketResponse ticketResponse = ssoTicketService.generateTicket("TENANT_DELIMART", request);
        assertNotNull(ticketResponse.getSessionTicket());
        assertEquals(60, ticketResponse.getExpiresInSeconds());

        String ticket = ticketResponse.getSessionTicket();
        String jsonPayload = "{\"tenantId\":\"TENANT_DELIMART\",\"partnerCode\":\"DELIMART\",\"externalUserId\":\"CUST_12345\",\"username\":\"nguyenvana\",\"createdAt\":1724400000000}";

        when(redisService.getAndDelete("sso:ticket:" + ticket)).thenReturn(jsonPayload);

        SsoExchangeResponse exchangeResponse = ssoTicketService.exchangeToken(new SsoExchangeRequest(ticket));
        assertNotNull(exchangeResponse.getAccessToken());
        assertEquals("TENANT_DELIMART", exchangeResponse.getTenantId());
        assertEquals("CUST_12345", exchangeResponse.getExternalUserId());
    }
}
