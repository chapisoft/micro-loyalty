package com.natcash.loyalty.partner.service;

import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.ApiKeyStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.partner.entity.PartnerApiKeyEntity;
import com.natcash.loyalty.partner.repository.PartnerApiKeyRepository;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
public class PartnerApiKeyService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final PartnerApiKeyRepository apiKeyRepository;

    @Autowired(required = false)
    private RedissonClient redissonClient;

    public PartnerApiKeyService(PartnerApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    @Transactional(readOnly = true)
    public List<PartnerApiKeyDto> listApiKeys(String tenantId, Long partnerId) {
        return apiKeyRepository.findByTenantIdAndPartnerIdOrderByCreatedAtDesc(tenantId, partnerId)
                .stream()
                .map(k -> toDto(k, null))
                .toList();
    }

    @Transactional
    public PartnerApiKeyDto rotateKey(String tenantId, Long partnerId, String keyName, String scopes, String createdBy) {
        Instant now = Instant.now();
        int graceDays = SystemParameterService.get().getInt(tenantId, SystemParamSpec.PARTNER_API_KEY_GRACE_PERIOD_DAYS);
        Instant graceExpiresAt = now.plus(graceDays, ChronoUnit.DAYS);

        List<PartnerApiKeyEntity> activeKeys = apiKeyRepository.findByTenantIdAndPartnerIdAndStatus(
                tenantId, partnerId, ApiKeyStatus.ACTIVE);
        for (PartnerApiKeyEntity existing : activeKeys) {
            existing.setStatus(ApiKeyStatus.GRACE_PERIOD);
            existing.setGraceExpiresAt(graceExpiresAt);
            apiKeyRepository.save(existing);

            if (redissonClient != null) {
                RBucket<String> bucket = redissonClient.getBucket(
                        RedisKeys.getPartnerApiKeyGraceKey(tenantId, partnerId, existing.getId()));
                bucket.set(existing.getKeyPrefix(), Duration.ofDays(graceDays));
            }
        }

        String rawSecret = generateSecret();
        String prefix = rawSecret.substring(0, Math.min(16, rawSecret.length()));
        PartnerApiKeyEntity newKey = PartnerApiKeyEntity.builder()
                .tenantId(tenantId)
                .partnerId(partnerId)
                .keyName(keyName != null && !keyName.isBlank() ? keyName.trim() : "Rotated Key")
                .keyPrefix(prefix)
                .keyHash(sha256(rawSecret))
                .scopes(scopes != null && !scopes.isBlank() ? scopes.trim()
                        : SystemParameterService.get().getString(tenantId, SystemParamSpec.PARTNER_DEFAULT_API_KEY_SCOPES))
                .status(ApiKeyStatus.ACTIVE)
                .createdBy(createdBy)
                .build();

        PartnerApiKeyEntity saved = apiKeyRepository.save(newKey);
        return toDto(saved, rawSecret);
    }

    @Transactional
    public PartnerApiKeyDto revokeKey(String tenantId, Long partnerId, Long keyId) {
        PartnerApiKeyEntity entity = apiKeyRepository.findByIdAndTenantIdAndPartnerId(keyId, tenantId, partnerId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.IDOR_FORBIDDEN));
        entity.setStatus(ApiKeyStatus.REVOKED);
        entity.setRevokedAt(Instant.now());
        PartnerApiKeyEntity saved = apiKeyRepository.save(entity);
        return toDto(saved, null);
    }

    private String generateSecret() {
        byte[] bytes = new byte[24];
        SECURE_RANDOM.nextBytes(bytes);
        return "nk_live_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new LoyaltyException(ErrorCode.SYSTEM_ERROR, ex);
        }
    }

    private PartnerApiKeyDto toDto(PartnerApiKeyEntity entity, String plainSecretKeyOnce) {
        return PartnerApiKeyDto.builder()
                .id(entity.getId())
                .partnerId(entity.getPartnerId())
                .keyName(entity.getKeyName())
                .keyPrefix(entity.getKeyPrefix())
                .scopes(entity.getScopes())
                .status(entity.getStatus())
                .expiresAt(entity.getExpiresAt())
                .graceExpiresAt(entity.getGraceExpiresAt())
                .revokedAt(entity.getRevokedAt())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .plainSecretKeyOnce(plainSecretKeyOnce)
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerApiKeyDto {
        private Long id;
        private Long partnerId;
        private String keyName;
        private String keyPrefix;
        private String scopes;
        private ApiKeyStatus status;
        private Instant expiresAt;
        private Instant graceExpiresAt;
        private Instant revokedAt;
        private String createdBy;
        private Instant createdAt;
        private String plainSecretKeyOnce;
    }
}
