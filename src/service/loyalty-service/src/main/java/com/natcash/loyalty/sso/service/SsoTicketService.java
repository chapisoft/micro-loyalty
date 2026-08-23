package com.natcash.loyalty.sso.service;

import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.sso.dto.SsoDto.SsoExchangeRequest;
import com.natcash.loyalty.sso.dto.SsoDto.SsoExchangeResponse;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketPayload;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketRequest;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketResponse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lib.ims.redis.service.RedisService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
public class SsoTicketService {

    private static final Logger log = LoggerFactory.getLogger(SsoTicketService.class);
    private static final long TICKET_TTL_SECONDS = 60L;
    private static final long ACCESS_TOKEN_TTL_SECONDS = 900L; // 15 phút

    private final RedisService redisService;
    private final ObjectMapper objectMapper;

    public SsoTicketService(RedisService redisService, ObjectMapper objectMapper) {
        this.redisService = redisService;
        this.objectMapper = objectMapper;
    }

    public SsoTicketResponse generateTicket(String tenantId, SsoTicketRequest request) {
        String ticket = UUID.randomUUID().toString().replace("-", "");
        String redisKey = RedisKeys.SESSION_TICKET_PREFIX + ticket;

        SsoTicketPayload payload = SsoTicketPayload.builder()
                .tenantId(tenantId)
                .partnerCode(request.getPartnerCode())
                .externalUserId(request.getExternalUserId())
                .username(request.getUsername())
                .permissions(request.getPermissions())
                .createdAt(System.currentTimeMillis())
                .build();

        try {
            String payloadJson = objectMapper.writeValueAsString(payload);
            redisService.set(redisKey, payloadJson, Duration.ofSeconds(TICKET_TTL_SECONDS));
            log.info("[SSO-TICKET-GENERATED] ticket={}, tenantId={}, partner={}, user={}",
                    ticket, tenantId, request.getPartnerCode(), request.getExternalUserId());

            return SsoTicketResponse.builder()
                    .sessionTicket(ticket)
                    .expiresInSeconds(TICKET_TTL_SECONDS)
                    .build();
        } catch (Exception e) {
            log.error("[SSO-TICKET-GEN-ERROR] tenantId={}, user={}, error={}",
                    tenantId, request.getExternalUserId(), e.getMessage(), e);
            throw new LoyaltyException(ErrorCode.SYSTEM_ERROR, "Không thể sinh vé phiên SSO");
        }
    }

    public SsoExchangeResponse exchangeToken(SsoExchangeRequest request) {
        String ticket = request.getSessionTicket();
        String redisKey = RedisKeys.SESSION_TICKET_PREFIX + ticket;

        // Xóa vé nguyên tử ngay khi lấy ra để chống tấn công phát lại (Replay Attack)
        String payloadJson = redisService.getAndDelete(redisKey);
        if (payloadJson == null || payloadJson.isEmpty()) {
            log.warn("[SSO-EXCHANGE-FAILED] ticket={} - Vé không hợp lệ hoặc đã hết hạn", ticket);
            throw new LoyaltyException(ErrorCode.API_KEY_INVALID, "Vé phiên không hợp lệ hoặc đã được sử dụng");
        }

        try {
            SsoTicketPayload payload = objectMapper.readValue(payloadJson, SsoTicketPayload.class);
            String mockJwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
                    UUID.randomUUID().toString().replace("-", "") + "." +
                    UUID.randomUUID().toString().replace("-", "");

            log.info("[SSO-EXCHANGE-SUCCESS] ticket={}, tenantId={}, user={}",
                    ticket, payload.getTenantId(), payload.getExternalUserId());

            return SsoExchangeResponse.builder()
                    .accessToken(mockJwtToken)
                    .tokenType("Bearer")
                    .expiresInSeconds(ACCESS_TOKEN_TTL_SECONDS)
                    .tenantId(payload.getTenantId())
                    .externalUserId(payload.getExternalUserId())
                    .build();
        } catch (Exception e) {
            log.error("[SSO-EXCHANGE-ERROR] ticket={}, error={}", ticket, e.getMessage(), e);
            throw new LoyaltyException(ErrorCode.SYSTEM_ERROR, "Lỗi khi xử lý đổi token JWT");
        }
    }
}
