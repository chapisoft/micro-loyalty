package com.natcash.loyalty.engagement.repository;

import com.natcash.loyalty.engagement.entity.PartnerNotificationEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartnerNotificationRepository extends JpaRepository<PartnerNotificationEntity, Long> {

    List<PartnerNotificationEntity> findByTenantIdAndPartnerIdOrderByCreatedAtDesc(String tenantId, Long partnerId);

    Optional<PartnerNotificationEntity> findByIdAndTenantIdAndPartnerId(Long id, String tenantId, Long partnerId);

    long countByTenantIdAndPartnerIdAndIsReadFalse(String tenantId, Long partnerId);
}
