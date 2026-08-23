package com.natcash.loyalty.sso;

import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.sso.dto.SsoDto.SsoExchangeRequest;
import com.natcash.loyalty.sso.dto.SsoDto.SsoExchangeResponse;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketPayload;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketRequest;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketResponse;
import com.natcash.loyalty.sso.service.SsoTicketService;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lib.ims.redis.service.RedisService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SsoTicketServiceTest {

    @Mock
    private RedisService redisService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private SsoTicketService ssoTicketService;

    @BeforeEach
    void setUp() {
        ssoTicketService = new SsoTicketService(redisService, objectMapper);
    }

    @Test
    @DisplayName("BE-08-UT-01: Sinh vé phiên SSO Ticket thành công có thời hạn 60 giây")
    void testGenerateTicketSuccess() {
        SsoTicketRequest request = SsoTicketRequest.builder()
                .partnerCode("DELIMART")
                .externalUserId("USER_555")
                .username("John Doe")
                .permissions(List.of("READ_PROFILE", "BURN_POINTS"))
                .build();

        SsoTicketResponse response = ssoTicketService.generateTicket("TENANT_DELIMART", request);

        assertNotNull(response);
        assertNotNull(response.getSessionTicket());
        assertEquals(60L, response.getExpiresInSeconds());
        verify(redisService, times(1)).set(anyString(), anyString(), eq(Duration.ofSeconds(60L)));
    }

    @Test
    @DisplayName("BE-08-UT-02: Đổi vé SSO Ticket lấy JWT thành công và xóa vé nguyên tử")
    void testExchangeTokenSuccess() throws JsonProcessingException {
        String ticket = "test_ticket_123456";
        SsoTicketPayload payload = SsoTicketPayload.builder()
                .tenantId("TENANT_DELIMART")
                .partnerCode("DELIMART")
                .externalUserId("USER_555")
                .username("John Doe")
                .build();

        when(redisService.getAndDelete("sso:ticket:" + ticket)).thenReturn(objectMapper.writeValueAsString(payload));

        SsoExchangeRequest request = SsoExchangeRequest.builder()
                .sessionTicket(ticket)
                .build();

        SsoExchangeResponse response = ssoTicketService.exchangeToken(request);

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(900L, response.getExpiresInSeconds());
        assertEquals("TENANT_DELIMART", response.getTenantId());
        assertEquals("USER_555", response.getExternalUserId());
    }

    @Test
    @DisplayName("BE-08-UT-03: Đổi vé SSO thất bại khi vé không tồn tại hoặc đã bị dùng (Replay)")
    void testExchangeTokenInvalidOrReplayed() {
        String ticket = "used_or_expired_ticket";
        when(redisService.getAndDelete("sso:ticket:" + ticket)).thenReturn(null);

        SsoExchangeRequest request = SsoExchangeRequest.builder()
                .sessionTicket(ticket)
                .build();

        LoyaltyException ex = assertThrows(LoyaltyException.class, () ->
                ssoTicketService.exchangeToken(request)
        );

        assertEquals(ErrorCode.API_KEY_INVALID, ex.getErrorCode());
    }
}
