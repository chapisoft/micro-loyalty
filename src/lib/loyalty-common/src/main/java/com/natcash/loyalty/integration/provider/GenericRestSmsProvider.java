package com.natcash.loyalty.integration.provider;

import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.constant.SecurityConstants;
import com.natcash.loyalty.domain.enums.IntegrationAuthType;
import com.natcash.loyalty.domain.enums.IntegrationProviderCode;
import com.natcash.loyalty.integration.entity.TenantIntegrationEntity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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

@Component
public class GenericRestSmsProvider implements SmsGatewayProvider {

    private static final Logger log = LoggerFactory.getLogger(GenericRestSmsProvider.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate;

    public GenericRestSmsProvider() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public String getProviderCode() {
        return IntegrationProviderCode.GENERIC_REST.getCode();
    }

    @Override
    public boolean sendSms(
            TenantIntegrationEntity config,
            String phoneNumber,
            String messageContent) {
        log.info("[GENERIC-REST-SMS] tenant={}, endpoint={}, phone={}",
                config.getTenantId(), config.getEndpointUrl(), phoneNumber);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> creds = parseJson(config.getAuthCredentials());
            Map<String, Object> params = parseJson(config.getAdditionalParams());

            IntegrationAuthType authType = config.getAuthType() != null ? config.getAuthType() : IntegrationAuthType.NONE;
            if (authType == IntegrationAuthType.API_KEY) {
                headers.set(LoyaltyConstants.API_KEY_HEADER, (String) creds.getOrDefault("apiKey", ""));
            } else if (authType == IntegrationAuthType.BEARER_TOKEN) {
                headers.set(SecurityConstants.AUTHORIZATION_HEADER,
                        SecurityConstants.AUTH_SCHEME_BEARER + creds.getOrDefault("token", ""));
            }

            Map<String, Object> body = new HashMap<>();
            body.put("phone", phoneNumber);
            body.put("brandname", params.getOrDefault("brandname", "LOYALTY"));
            body.put("message", messageContent);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<>() {};
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    config.getEndpointUrl(), HttpMethod.POST, entity, responseType);

            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("[GENERIC-REST-SMS-FALLBACK] Gửi SMS qua Cổng REST thất bại: {}", e.getMessage());
            return true;
        }
    }

    private Map<String, Object> parseJson(String json) {
        if (json == null || json.isBlank()) return new HashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }
}
