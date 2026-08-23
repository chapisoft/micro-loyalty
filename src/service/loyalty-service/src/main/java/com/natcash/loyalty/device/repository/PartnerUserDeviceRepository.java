package com.natcash.loyalty.device.repository;

import com.natcash.loyalty.device.entity.PartnerUserDeviceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartnerUserDeviceRepository extends JpaRepository<PartnerUserDeviceEntity, Long> {

    Optional<PartnerUserDeviceEntity> findByTenantIdAndPartnerCodeAndExternalUserIdAndDeviceId(
            String tenantId, String partnerCode, String externalUserId, String deviceId);

    List<PartnerUserDeviceEntity> findByTenantIdAndPartnerCodeAndExternalUserIdAndIsActiveTrue(
            String tenantId, String partnerCode, String externalUserId);

    List<PartnerUserDeviceEntity> findByTenantIdAndExternalUserIdAndIsActiveTrue(
            String tenantId, String externalUserId);
}
