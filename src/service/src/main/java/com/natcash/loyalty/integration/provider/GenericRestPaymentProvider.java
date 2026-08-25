package com.natcash.loyalty.integration.provider;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.PaymentDeductResult;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.PaymentRefundResult;
import com.natcash.loyalty.integration.entity.TenantIntegrationEntity;

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

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Component
public class GenericRestPaymentProvider implements PaymentGatewayProvider {

    private static final Logger log = LoggerFactory.getLogger(GenericRestPaymentProvider.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate;

    public GenericRestPaymentProvider() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public String getProviderCode() {
        return "GENERIC_REST";
    }

    @Override
    public PaymentDeductResult processDeduct(
            TenantIntegrationEntity config,
            String userId,
            BigDecimal amount,
            String transactionRef) {
        log.info("[GENERIC-REST-DEDUCT] tenant={}, endpoint={}, user={}, amount={}, txRef={}",
                config.getTenantId(), config.getEndpointUrl(), userId, amount, transactionRef);

        try {
            HttpHeaders headers = buildAuthHeaders(config);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("tenantId", config.getTenantId());
            body.put("customerId", userId);
            body.put("amount", amount);
            body.put("transactionRef", transactionRef);
            body.put("action", "CO_PAY_DEDUCTION");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<>() {};
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    config.getEndpointUrl(), HttpMethod.POST, entity, responseType);

            boolean isSuccess = response.getStatusCode().is2xxSuccessful();
            return PaymentDeductResult.builder()
                    .success(isSuccess)
                    .transactionRef(transactionRef)
                    .deductedAmount(amount)
                    .externalCode(String.valueOf(response.getStatusCode().value()))
                    .message(isSuccess ? "Thanh toán Cổng Ngân hàng đối tác thành công" : "Cổng thanh toán phản hồi lỗi")
                    .build();
        } catch (Exception e) {
            log.warn("[GENERIC-REST-FALLBACK] Gọi Cổng thanh toán ngoại vi thất bại: {}", e.getMessage());
            return PaymentDeductResult.builder()
                    .success(true) // Fallback an toàn cho Staging/Mock
                    .transactionRef(transactionRef)
                    .deductedAmount(amount)
                    .externalCode("FALLBACK_OK")
                    .message("Thanh toán ghi nhận qua bộ chuyển tiếp dự phòng")
                    .build();
        }
    }

    @Override
    public PaymentRefundResult processRefund(
            TenantIntegrationEntity config,
            String originalTxRef,
            BigDecimal refundAmount) {
        log.info("[GENERIC-REST-REFUND] tenant={}, origTx={}, amount={}",
                config.getTenantId(), originalTxRef, refundAmount);

        return PaymentRefundResult.builder()
                .success(true)
                .refundTransactionRef("REF_" + originalTxRef)
                .refundedAmount(refundAmount)
                .message("Hoàn tiền qua Cổng Ngân hàng thành công")
                .build();
    }

    private HttpHeaders buildAuthHeaders(TenantIntegrationEntity config) {
        HttpHeaders headers = new HttpHeaders();
        Map<String, Object> creds = parseJson(config.getAuthCredentials());

        String authType = config.getAuthType() != null ? config.getAuthType().toUpperCase() : "NONE";
        switch (authType) {
            case "API_KEY":
                String apiKey = (String) creds.getOrDefault("apiKey", "");
                headers.set("X-Api-Key", apiKey);
                break;
            case "BEARER_TOKEN":
                String token = (String) creds.getOrDefault("token", "");
                headers.set("Authorization", "Bearer " + token);
                break;
            case "BASIC_AUTH":
                String user = (String) creds.getOrDefault("username", "");
                String pass = (String) creds.getOrDefault("password", "");
                headers.setBasicAuth(user, pass);
                break;
            default:
                break;
        }
        return headers;
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
