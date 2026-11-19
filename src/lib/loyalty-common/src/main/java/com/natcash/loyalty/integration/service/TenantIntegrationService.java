package com.natcash.loyalty.integration.service;

import com.natcash.loyalty.codegeneration.domain.CodeType;
import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.IntegrationAuthType;
import com.natcash.loyalty.domain.enums.IntegrationProviderCode;
import com.natcash.loyalty.domain.enums.IntegrationProviderCode.ConnectionStatus;
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
import com.natcash.loyalty.security.SignatureUtils;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.util.MessageUtils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TenantIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(TenantIntegrationService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

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
        String cacheKey = RedisKeys.getTenantIntegrationKey(tenantId, type.name());
        RBucket<TenantIntegrationEntity> bucket = redissonClient.getBucket(cacheKey);

        try {
            TenantIntegrationEntity cached = bucket.get();
            if (cached != null) {
                return Optional.of(cached);
            }
        } catch (Exception e) {
            log.debug("[REDIS-CACHE-MISS] tenant={}, type={}", tenantId, type);
        }

        Optional<TenantIntegrationEntity> opt = repository.findByTenantIdAndIntegrationTypeAndIsActiveTrue(tenantId,
                type);

        opt.ifPresent(entity -> {
            try {
                long cacheTtlSeconds = SystemParameterService.get()
                        .getLong(tenantId, SystemParamSpec.SYSTEM_CACHE_TTL_SECONDS);
                bucket.set(entity, Duration.ofSeconds(cacheTtlSeconds));
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
        entity.setAuthType(request.getAuthType() != null ? request.getAuthType() : IntegrationAuthType.NONE);
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        entity.setAuthCredentials(writeJson(request.getAuthCredentials()));
        entity.setAdditionalParams(writeJson(request.getAdditionalParams()));

        TenantIntegrationEntity saved = repository.save(entity);

        // Xóa cache Redis để nạp cấu hình mới ngay lập tức
        String cacheKey = RedisKeys.getTenantIntegrationKey(tenantId, request.getIntegrationType().name());
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
                    .externalCode(String.valueOf(HttpStatus.OK.value()))
                    .message(MessageUtils.getMessage("integration.payment.default_recorded"))
                    .build();
        }

        PaymentGatewayProvider provider = paymentProviders.get(config.getProviderCode().toUpperCase());
        if (provider == null) {
            provider = paymentProviders.get(IntegrationProviderCode.GENERIC_REST.getCode());
        }

        if (provider == null) {
            return PaymentDeductResult.builder()
                    .success(true)
                    .transactionRef(txRef)
                    .deductedAmount(amount)
                    .message(MessageUtils.getMessage("integration.payment.provider_not_found"))
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
                provider = smsProviders.get(IntegrationProviderCode.GENERIC_REST.getCode());
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
     * Xác thực danh tính User từ nhà cung cấp định danh của từng thuê bao (IDENTITY_PROVIDER).
     */
    public boolean verifyTenantUserIdentity(
            String tenantId,
            String externalUserId,
            String verifyCode,
            Long timestamp,
            String signature) {
        Optional<TenantIntegrationEntity> configOpt = getIntegrationConfig(tenantId, IntegrationType.IDENTITY_PROVIDER);
        if (configOpt.isEmpty()) {
            return true;
        }
        TenantIntegrationEntity config = configOpt.get();
        if (!Boolean.TRUE.equals(config.getIsActive())) {
            return true;
        }
        Map<String, Object> creds = parseJson(config.getAuthCredentials());
        IntegrationAuthType authType = config.getAuthType();

        if (authType == IntegrationAuthType.HMAC_SHA256) {
            if (timestamp == null || signature == null || signature.isBlank()) {
                return false;
            }
            long driftTolerance = SystemParameterService.get().getLong(
                    tenantId, SystemParamSpec.HMAC_DRIFT_TOLERANCE_SECONDS);
            if (!SignatureUtils.isTimestampValid(timestamp, driftTolerance)) {
                return false;
            }
            Object rawSecret = creds.get("secretKey");
            String secretKey = rawSecret != null ? String.valueOf(rawSecret).trim() : null;
            if (secretKey == null || secretKey.isBlank()) {
                return false;
            }
            String canonicalData = tenantId + "|" + externalUserId + "|" + timestamp;
            return SignatureUtils.verifySignature(canonicalData, signature, secretKey);
        }

        if (authType == IntegrationAuthType.BEARER_TOKEN || authType == IntegrationAuthType.API_KEY) {
            if (verifyCode == null || verifyCode.isBlank()) {
                return false;
            }
            Object expectedToken = authType == IntegrationAuthType.API_KEY
                    ? creds.get("apiKey")
                    : creds.get("token");
            if (expectedToken != null && !String.valueOf(expectedToken).isBlank()) {
                return verifyCode.trim().equals(String.valueOf(expectedToken).trim());
            }
            Object tokenPrefix = creds.get("tokenPrefix");
            if (tokenPrefix != null && !String.valueOf(tokenPrefix).isBlank()) {
                return verifyCode.trim().startsWith(String.valueOf(tokenPrefix).trim());
            }
        }
        return verifyCode != null && !verifyCode.isBlank();
    }

    /**
     * Kiểm tra kết nối thử nghiệm tới Endpoint của đối tác
     */
    public TestConnectionResponse testConnection(TestConnectionRequest request) {
        long start = System.currentTimeMillis();
        try {
            String effectiveTenantId = (request.getTenantId() != null && !request.getTenantId().isBlank())
                    ? request.getTenantId().trim()
                    : TenantContext.getTenantId();
            TenantIntegrationEntity dummyConfig = TenantIntegrationEntity.builder()
                    .tenantId(effectiveTenantId)
                    .integrationType(request.getIntegrationType())
                    .providerCode(request.getProviderCode())
                    .endpointUrl(request.getEndpointUrl())
                    .authType(request.getAuthType())
                    .authCredentials(writeJson(request.getAuthCredentials()))
                    .additionalParams(writeJson(request.getAdditionalParams()))
                    .build();

            if (request.getIntegrationType() == IntegrationType.PAYMENT_GATEWAY) {
                PaymentGatewayProvider provider = paymentProviders.getOrDefault(
                        request.getProviderCode().toUpperCase(),
                        paymentProviders.get(IntegrationProviderCode.GENERIC_REST.getCode()));
                String probeTxRef = CentralizedCodeGeneratorService.get().generateCode(CodeType.POINT_TX);
                PaymentDeductResult res = provider.processDeduct(
                        dummyConfig, request.getTestUserId(), BigDecimal.ONE, probeTxRef);
                return TestConnectionResponse.builder()
                        .success(res.isSuccess())
                        .httpStatus(res.isSuccess() ? HttpStatus.OK.value() : HttpStatus.BAD_GATEWAY.value())
                        .responsePayload(res.getMessage())
                        .message(MessageUtils.getMessage("integration.test.payment_success"))
                        .latencyMs(System.currentTimeMillis() - start)
                        .build();
            } else if (request.getIntegrationType() == IntegrationType.IDENTITY_PROVIDER) {
                return TestConnectionResponse.builder()
                        .success(true)
                        .httpStatus(HttpStatus.OK.value())
                        .responsePayload(MessageUtils.getMessage("integration.test.idp_success"))
                        .message(MessageUtils.getMessage("integration.test.idp_success"))
                        .latencyMs(System.currentTimeMillis() - start)
                        .build();
            } else {
                SmsGatewayProvider provider = smsProviders.getOrDefault(
                        request.getProviderCode().toUpperCase(),
                        smsProviders.get(IntegrationProviderCode.GENERIC_REST.getCode()));
                String probeMessage = request.getTestMessage() != null && !request.getTestMessage().isBlank()
                        ? request.getTestMessage()
                        : MessageUtils.getMessage("integration.test.sms_success");
                boolean ok = provider.sendSms(dummyConfig, request.getTestPhoneNumber(), probeMessage);
                return TestConnectionResponse.builder()
                        .success(ok)
                        .httpStatus(ok ? HttpStatus.OK.value() : HttpStatus.BAD_GATEWAY.value())
                        .responsePayload(MessageUtils.getMessage("integration.test.sms_success"))
                        .message(MessageUtils.getMessage("integration.test.sms_success"))
                        .latencyMs(System.currentTimeMillis() - start)
                        .build();
            }
        } catch (Exception e) {
            return TestConnectionResponse.builder()
                    .success(false)
                    .httpStatus(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .responsePayload(e.getMessage())
                    .message(MessageUtils.getMessage("integration.test.failed", e.getMessage()))
                    .latencyMs(System.currentTimeMillis() - start)
                    .build();
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getIntegrationsOverview(String tenantId) {
        List<TenantIntegrationEntity> configured = repository.findByTenantId(tenantId);
        Map<String, TenantIntegrationEntity> byProvider = new LinkedHashMap<>();
        if (configured != null) {
            for (TenantIntegrationEntity entity : configured) {
                if (entity.getProviderCode() != null) {
                    byProvider.put(entity.getProviderCode().toUpperCase(), entity);
                }
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (IntegrationProviderCode sys : IntegrationProviderCode.values()) {
            if (!sys.isOverviewSystem()) {
                continue;
            }
            String code = sys.getCode();
            TenantIntegrationEntity match = byProvider.get(code);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("systemCode", code);
            item.put("systemName", sys.getDisplayName());
            item.put("category", sys.getCategory());
            item.put("configured", match != null);
            item.put("active", match != null && Boolean.TRUE.equals(match.getIsActive()));
            item.put("endpointUrl", match != null ? match.getEndpointUrl() : null);
            ConnectionStatus connStatus = (match != null && Boolean.TRUE.equals(match.getIsActive()))
                    ? ConnectionStatus.CONNECTED
                    : ConnectionStatus.STANDBY;
            item.put("status", connStatus.name());
            item.put("lastCheckedAt", Instant.now());
            result.add(item);
        }
        return result;
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
        if (map == null)
            return "{}";
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }

    private Map<String, Object> parseJson(String json) {
        if (json == null || json.isBlank())
            return new HashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception e) {
            return new HashMap<>();
        }
    }
}
