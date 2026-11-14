package com.natcash.loyalty.outbox.repository;

import com.natcash.loyalty.outbox.entity.WebhookDeadLetterEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WebhookDeadLetterRepository extends JpaRepository<WebhookDeadLetterEntity, Long> {

    List<WebhookDeadLetterEntity> findByTenantId(String tenantId);
}
