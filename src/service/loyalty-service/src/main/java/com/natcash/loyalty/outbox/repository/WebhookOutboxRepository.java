package com.natcash.loyalty.outbox.repository;

import com.natcash.loyalty.domain.enums.WebhookStatus;
import com.natcash.loyalty.outbox.entity.WebhookOutboxEntity;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface WebhookOutboxRepository extends JpaRepository<WebhookOutboxEntity, Long> {

    @Query("SELECT o FROM WebhookOutboxEntity o " +
           "WHERE o.status = :status AND o.nextRetryAt <= :currentTime " +
           "ORDER BY o.nextRetryAt ASC")
    List<WebhookOutboxEntity> findPendingEvents(
            @Param("status") WebhookStatus status,
            @Param("currentTime") Instant currentTime,
            Pageable pageable
    );
}
