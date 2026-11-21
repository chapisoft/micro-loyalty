package com.natcash.loyalty.integration;

import com.natcash.loyalty.config.LoyaltyProperties;
import com.natcash.loyalty.constant.LoyaltyConstants;
import com.natcash.loyalty.domain.enums.CurrencyCode;

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

/**
 * Adapter Kết nối Cổng API Core Ví Natcash Thật
 * Hỗ trợ nạp động endpoint sản xuất qua biến môi trường NATCASH_WALLET_BASE_URL và etc/application.yml
 */
@Component
public class NatcashWalletClient {

    private static final Logger log = LoggerFactory.getLogger(NatcashWalletClient.class);

    private final RestTemplate restTemplate;

    public NatcashWalletClient() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Xác nhận giao dịch thanh toán trừ tiền ví tại quầy siêu thị POS.
     * Bỏ fallback trả true giả lập khi thiếu cấu hình hoặc mất kết nối Core để tránh sai lệch đối soát tài chính.
     */
    public boolean verifyAndDeductWalletBalance(String externalUserId, BigDecimal fiatAmount, String transactionRef) {
        log.info("[NATCASH-WALLET-CALL] user={}, amount={} HTG, txRef={}", externalUserId, fiatAmount, transactionRef);
        try {
            LoyaltyProperties.Integration.Natcash config = LoyaltyProperties.get().getIntegration().getNatcash();
            String baseUrl = config.getBaseUrl();
            String apiKey = config.getApiKey();
            if (baseUrl == null || baseUrl.isBlank()) {
                log.error("[NATCASH-WALLET-MISCONFIGURED] Chưa cấu hình loyalty.integration.natcash.base-url trong application.yml");
                return false;
            }
            String url = baseUrl + "/wallet/deduct";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set(LoyaltyConstants.API_KEY_HEADER, apiKey);
            headers.set("X-Transaction-Ref", transactionRef);

            Map<String, Object> body = new HashMap<>();
            body.put("userId", externalUserId);
            body.put("amount", fiatAmount);
            body.put("currency", CurrencyCode.HTG.getCode());
            body.put("note", "Loyalty Point Co-Pay Deduction");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<>() {};
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, entity, responseType);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[NATCASH-WALLET-SUCCESS] txRef={}, status={}", transactionRef, response.getStatusCode());
                return true;
            }
            log.warn("[NATCASH-WALLET-REJECTED] txRef={}, status={}", transactionRef, response.getStatusCode());
            return false;
        } catch (Exception e) {
            log.error("[NATCASH-WALLET-ERROR] Lỗi kết nối Core ví Natcash txRef={}: {}", transactionRef, e.getMessage());
            return false;
        }
    }

    /**
     * Gọi hoàn tiền giao dịch ví sang Core Natcash khi giao dịch bị hủy / Revert.
     */
    public boolean refundWalletTransaction(String originalTxRef, BigDecimal refundAmount, String refundTxRef) {
        log.info("[NATCASH-WALLET-REFUND-CALL] origTx={}, amount={} HTG, refundTx={}", originalTxRef, refundAmount, refundTxRef);
        try {
            LoyaltyProperties.Integration.Natcash config = LoyaltyProperties.get().getIntegration().getNatcash();
            String baseUrl = config.getBaseUrl();
            String apiKey = config.getApiKey();
            if (baseUrl == null || baseUrl.isBlank()) {
                log.error("[NATCASH-WALLET-MISCONFIGURED] Chưa cấu hình loyalty.integration.natcash.base-url cho lệnh hoàn tiền");
                return false;
            }
            String url = baseUrl + "/wallet/refund";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set(LoyaltyConstants.API_KEY_HEADER, apiKey);
            headers.set("X-Transaction-Ref", refundTxRef);

            Map<String, Object> body = new HashMap<>();
            body.put("originalTransactionRef", originalTxRef);
            body.put("refundTransactionRef", refundTxRef);
            body.put("amount", refundAmount);
            body.put("currency", CurrencyCode.HTG.getCode());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<>() {};
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, entity, responseType);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.error("[NATCASH-WALLET-REFUND-ERROR] Lỗi hoàn tiền Core ví Natcash origTx={}: {}", originalTxRef, e.getMessage());
            return false;
        }
    }
}
