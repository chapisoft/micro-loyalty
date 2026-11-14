package com.natcash.loyalty.engagement.repository;

import com.natcash.loyalty.engagement.entity.UserNotificationPreferenceEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserNotificationPreferenceRepository extends JpaRepository<UserNotificationPreferenceEntity, Long> {

    Optional<UserNotificationPreferenceEntity> findByTenantIdAndExternalUserId(String tenantId, String externalUserId);
}
