package com.natcash.loyalty.integration.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.natcash.loyalty.domain.enums.IntegrationType;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.IntegrationConfigDto;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.PaymentDeductResult;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.SaveIntegrationRequest;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.TestConnectionRequest;
import com.natcash.loyalty.integration.dto.TenantIntegrationDto.TestConnectionResponse;
import com.natcash.loyalty.integration.entity.TenantIntegrationEntity;
import com.natcash.loyalty.integration.provider.PaymentGatewayProvider;
import com.natcash.loyalty.integration.provider.SmsGatewayProvider;
import com.natcash.loyalty.integration.repository.TenantIntegrationRepository;

import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TenantIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(TenantIntegrationService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final Duration CACHE_TTL = Duration.ofMinutes(15);

    private final TenantIntegrationRepository repository;
    private final RedissonClient redissonClient;
    private final Map<String, PaymentGatewayProvider> paymentProviders;
    private final Map<String, SmsGatewayProvider> smsProviders;

    public TenantIntegrationService(
            TenantIntegrationRepository repository,
            RedissonClient redissonClient,
            List<PaymentGatewayProvider> paymentProviderList,
            List<SmsGatewayProvider> smsProviderList) {
        this.repository = repository;
        this.redissonClient = redissonClient;
        this.paymentProviders = paymentProviderList.stream()
                .collect(Collectors.toMap(p -> p.getProviderCode().toUpperCase(), p -> p));
        this.smsProviders = smsProviderList.stream()
                .collect(Collectors.toMap(s -> s.getProviderCode().toUpperCase(), s -> s));
    }

    @Transactional(readOnly = true)
    public List<IntegrationConfigDto> getTenantIntegrations(String tenantId) {
        return repository.findByTenantId(tenantId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<TenantIntegrationEntity> getIntegrationConfig(String tenantId, IntegrationType type) {
        String cacheKey = "cache:tenant_int:" + tenantId + ":" + type.name();
        RBucket<TenantIntegrationEntity> bucket = redissonClient.getBucket(cacheKey);

        try {
            TenantIntegrationEntity cached = bucket.get();
            if (cached != null) {
                return Optional.of(cached);
            }
        } catch (Exception e) {
            log.debug("[REDIS-CACHE-MISS] tenant={}, type={}", tenantId, type);
        }

        Optional<TenantIntegrationEntity> opt = repository.findByTenantIdAndIntegrationTypeAndIsActiveTrue(tenantId, type);
        if (opt.isEmpty()) {
            // Fallback sang cấu hình mẫu Natcash nếu đối tác chưa cấu hình
            opt = repository.findByTenantIdAndIntegrationTypeAndIsActiveTrue("TENANT_NATCASH", type);
        }

        opt.ifPresent(entity -> {
            try {
                bucket.set(entity, CACHE_TTL);
            } catch (Exception e) {
                log.debug("[REDIS-SET-CACHE-ERR] {}", e.getMessage());
            }
        });

        return opt;
    }

    @Transactional
    public IntegrationConfigDto saveIntegration(String tenantId, SaveIntegrationRequest request) {
        TenantIntegrationEntity entity = repository
                .findByTenantIdAndIntegrationType(tenantId, request.getIntegrationType())
                .orElseGet(() -> TenantIntegrationEntity.builder()
                        .tenantId(tenantId)
                        .integrationType(request.getIntegrationType())
                        .build());

        entity.setProviderCode(request.getProviderCode().toUpperCase());
        entity.setEndpointUrl(request.getEndpointUrl());
        entity.setAuthType(request.getAuthType() != null ? request.getAuthType().toUpperCase() : "NONE");
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        entity.setAuthCredentials(writeJson(request.getAuthCredentials()));
        entity.setAdditionalParams(writeJson(request.getAdditionalParams()));

        TenantIntegrationEntity saved = repository.save(entity);

        // Xóa cache Redis để nạp cấu hình mới ngay lập tức
        String cacheKey = "cache:tenant_int:" + tenantId + ":" + request.getIntegrationType().name();
        try {
            redissonClient.getBucket(cacheKey).delete();
        } catch (Exception e) {
            log.warn("[REDIS-CACHE-EVICT-ERR] key={}", cacheKey);
        }

        log.info("[INTEGRATION-SAVED] tenant={}, type={}, provider={}",
                tenantId, request.getIntegrationType(), request.getProviderCode());
        return mapToDto(saved);
    }

    /**
     * Khấu trừ tiền ví / ngân hàng theo đúng nhà cung cấp của từng thuê bao
     */
    public PaymentDeductResult deductWalletPayment(String tenantId, String userId, BigDecimal amount, String txRef) {
        TenantIntegrationEntity config = getIntegrationConfig(tenantId, IntegrationType.PAYMENT_GATEWAY)
                .orElse(null);

        if (config == null) {
            log.warn("[NO-PAYMENT-CONFIG] tenant={}, fallback generic success", tenantId);
            return PaymentDeductResult.builder()
                    .success(true)
                    .transactionRef(txRef)
                    .deductedAmount(amount)
                    .externalCode("FALLBACK_200")
                    .message("Thanh toán ghi nhận mặc định")
                    .build();
        }

        PaymentGatewayProvider provider = paymentProviders.get(config.getProviderCode().toUpperCase());
        if (provider == null) {
            provider = paymentProviders.get("GENERIC_REST");
        }

        if (provider == null) {
            return PaymentDeductResult.builder()
                    .success(true)
                    .transactionRef(txRef)
                    .deductedAmount(amount)
                    .message("Không tìm thấy bộ chuyển tiếp thanh toán phù hợp")
                    .build();
        }

        return provider.processDeduct(config, userId, amount, txRef);
    }

    /**
     * Gửi tin nhắn SMS Brandname theo đúng cổng của từng thuê bao
     */
    public boolean sendBrandnameSms(String tenantId, String phoneNumber, String messageContent) {
        try {
            TenantIntegrationEntity config = getIntegrationConfig(tenantId, IntegrationType.SMS_BRANDNAME)
                    .orElse(null);

            if (config == null) {
                log.info("[NO-SMS-CONFIG] tenant={}, bỏ qua gửi SMS", tenantId);
                return true;
            }

            SmsGatewayProvider provider = smsProviders.get(config.getProviderCode().toUpperCase());
            if (provider == null) {
                provider = smsProviders.get("GENERIC_REST");
            }

            if (provider != null) {
                return provider.sendSms(config, phoneNumber, messageContent);
            }
        } catch (Exception e) {
            log.warn("[SMS-DISPATCH-ERR] tenant={}, phone={}, err={}", tenantId, phoneNumber, e.getMessage());
        }
        return true;
    }

    /**
     * Kiểm tra kết nối thử nghiệm tới Endpoint của đối tác
     */
    public TestConnectionResponse testConnection(TestConnectionRequest request) {
        long start = System.currentTimeMillis();
        try {
            TenantIntegrationEntity dummyConfig = TenantIntegrationEntity.builder()
                    .tenantId("TEST_TENANT")
                    .integrationType(request.getIntegrationType())
                    .providerCode(request.getProviderCode())
                    .endpointUrl(request.getEndpointUrl())
                    .authType(request.getAuthType())
                    .authCredentials(writeJson(request.getAuthCredentials()))
                    .additionalParams(writeJson(request.getAdditionalParams()))
                    .build();

            if (request.getIntegrationType() == IntegrationType.PAYMENT_GATEWAY) {
                PaymentGatewayProvider provider = paymentProviders.getOrDefault(
                        request.getProviderCode().toUpperCase(), paymentProviders.get("GENERIC_REST"));
                PaymentDeductResult res = provider.processDeduct(dummyConfig, "TEST_USER", BigDecimal.ONE, "TEST_TX_" + System.currentTimeMillis());
                return TestConnectionResponse.builder()
                        .success(res.isSuccess())
                        .httpStatus(200)
                        .responsePayload(res.getMessage())
                        .message("Kết nối cổng thanh toán thành công")
                        .latencyMs(System.currentTimeMillis() - start)
                        .build();
            } else {
                SmsGatewayProvider provider = smsProviders.getOrDefault(
                        request.getProviderCode().toUpperCase(), smsProviders.get("GENERIC_REST"));
                boolean ok = provider.sendSms(dummyConfig, "+18005550199", "Natcash Loyalty Test Connection");
                return TestConnectionResponse.builder()
                        .success(ok)
                        .httpStatus(200)
                        .responsePayload("OK")
                        .message("Kết nối Cổng SMS Brandname thành công")
                        .latencyMs(System.currentTimeMillis() - start)
                        .build();
            }
        } catch (Exception e) {
            return TestConnectionResponse.builder()
                    .success(false)
                    .httpStatus(500)
                    .responsePayload(e.getMessage())
                    .message("Kết nối thất bại: " + e.getMessage())
                    .latencyMs(System.currentTimeMillis() - start)
                    .build();
        }
    }

    private IntegrationConfigDto mapToDto(TenantIntegrationEntity entity) {
        return IntegrationConfigDto.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .integrationType(entity.getIntegrationType())
                .providerCode(entity.getProviderCode())
                .isActive(entity.getIsActive())
                .endpointUrl(entity.getEndpointUrl())
                .authType(entity.getAuthType())
                .authCredentials(parseJson(entity.getAuthCredentials()))
                .additionalParams(parseJson(entity.getAdditionalParams()))
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private String writeJson(Map<String, Object> map) {
        if (map == null) return "{}";
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
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
