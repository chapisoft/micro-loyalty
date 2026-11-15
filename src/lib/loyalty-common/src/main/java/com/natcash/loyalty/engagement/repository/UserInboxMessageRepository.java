package com.natcash.loyalty.engagement.repository;

import com.natcash.loyalty.engagement.entity.UserInboxMessageEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserInboxMessageRepository extends JpaRepository<UserInboxMessageEntity, Long> {

    List<UserInboxMessageEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    List<UserInboxMessageEntity> findByTenantIdAndExternalUserIdOrderByCreatedAtDesc(
            String tenantId, String externalUserId);

    Optional<UserInboxMessageEntity> findByIdAndTenantId(Long id, String tenantId);
}
