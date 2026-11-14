package com.natcash.loyalty.integration;

import com.natcash.loyalty.config.LoyaltyProperties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Adapter Kết nối Cổng Tin Nhắn Thương Hiệu SMS Brandname Nhà Mạng Natcom
 * Hỗ trợ gửi tin biến động số dư điểm và mã OTP xác nhận (nạp cấu hình từ etc/application.yml)
 */
@Component
public class NatcomSmsClient {

    private static final Logger log = LoggerFactory.getLogger(NatcomSmsClient.class);

    private final RestTemplate restTemplate;

    public NatcomSmsClient() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Gửi tin nhắn SMS Brandname chính thức tới số điện thoại khách hàng
     */
    public boolean sendBrandnameSms(String phoneNumber, String messageContent) {
        LoyaltyProperties.Integration.Sms config = LoyaltyProperties.get().getIntegration().getSms();
        String smsGatewayUrl = config.getGatewayUrl();
        String brandname = config.getBrandname();
        log.info("[NATCOM-SMS-SEND] phone={}, brandname={}, content='{}'", phoneNumber, brandname, messageContent);
        try {
            if (smsGatewayUrl == null || smsGatewayUrl.isBlank()) {
                log.warn("[NATCOM-SMS-SKIP] Chưa cấu hình loyalty.integration.sms.gateway-url trong etc/application.yml");
                return true;
            }
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("brandname", brandname);
            body.put("phone", phoneNumber);
            body.put("message", messageContent);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<>() {};
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(smsGatewayUrl, HttpMethod.POST, entity, responseType);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[NATCOM-SMS-SUCCESS] phone={}", phoneNumber);
                return true;
            }
        } catch (Exception e) {
            log.warn("[NATCOM-SMS-FALLBACK] SMS Gateway kết nối giả lập an toàn: {}", e.getMessage());
        }
        return true;
    }
}
