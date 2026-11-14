package com.natcash.loyalty.campaign.service;

import com.natcash.loyalty.campaign.entity.CampaignControlGroupEntity;
import com.natcash.loyalty.campaign.repository.CampaignControlGroupRepository;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.domain.enums.ControlBucketGroup;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ControlGroupService {

    private final CampaignControlGroupRepository controlGroupRepository;

    @Transactional
    public ControlBucketGroup resolveBucket(
            String tenantId, String campaignCode, String externalUserId, Integer controlPercent) {
        Optional<CampaignControlGroupEntity> existing = controlGroupRepository
                .findByTenantIdAndCampaignCodeAndExternalUserId(tenantId, campaignCode, externalUserId);
        if (existing.isPresent()) {
            return existing.get().getBucketGroup();
        }

        int pct = controlPercent != null && controlPercent >= 0 && controlPercent <= 50
                ? controlPercent
                : SystemParameterService.get().getInt(tenantId, SystemParamSpec.CAMPAIGN_DEFAULT_CONTROL_GROUP_PERCENT);

        int bucket = computeHashBucket(tenantId + ":" + campaignCode + ":" + externalUserId);
        ControlBucketGroup group = bucket < pct ? ControlBucketGroup.CONTROL : ControlBucketGroup.TEST;

        controlGroupRepository.save(CampaignControlGroupEntity.builder()
                .tenantId(tenantId)
                .campaignCode(campaignCode)
                .externalUserId(externalUserId)
                .bucketGroup(group)
                .hashBucket(bucket)
                .build());
        return group;
    }

    public int computeHashBucket(String seed) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(seed.getBytes(StandardCharsets.UTF_8));
            int raw = ((digest[0] & 0x7F) << 8) | (digest[1] & 0xFF);
            return raw % 100;
        } catch (NoSuchAlgorithmException ex) {
            return Math.abs(seed.hashCode()) % 100;
        }
    }
}
