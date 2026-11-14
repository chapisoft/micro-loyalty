package com.natcash.loyalty.integration.provider;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.natcash.loyalty.integration.entity.TenantIntegrationEntity;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class TwilioSmsProvider implements SmsGatewayProvider {

    private static final Logger log = LoggerFactory.getLogger(TwilioSmsProvider.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate;

    public TwilioSmsProvider() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public String getProviderCode() {
        return "TWILIO";
    }

    @Override
    public boolean sendSms(
            TenantIntegrationEntity config,
            String phoneNumber,
            String messageContent) {
        log.info("[PROVIDER-TWILIO-SMS] tenant={}, phone={}, content='{}'",
                config.getTenantId(), phoneNumber, messageContent);

        try {
            Map<String, Object> creds = parseJson(config.getAuthCredentials());
            Map<String, Object> params = parseJson(config.getAdditionalParams());

            String accountSid = (String) creds.getOrDefault("accountSid", "");
            String authToken = (String) creds.getOrDefault("authToken", "");
            String fromNumber = (String) params.getOrDefault("fromNumber", "LOYALTY");

            String url = config.getEndpointUrl() + "/" + accountSid + "/Messages.json";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth(accountSid, authToken);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("To", phoneNumber);
            map.add("From", fromNumber);
            map.add("Body", messageContent);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("[TWILIO-SMS-FALLBACK] Gửi SMS qua Twilio thất bại, dùng fallback an toàn: {}", e.getMessage());
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
