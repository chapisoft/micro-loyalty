package com.lib.ims.kafka.repository;

import com.lib.ims.kafka.entity.OutboxEvent;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, String> {
   @Query("SELECT e FROM OutboxEvent e WHERE e.status = :status ORDER BY e.createdAt ASC")
   List<OutboxEvent> findPendingEvents(@Param("status") OutboxEvent.EventStatus var1, Pageable var2);

   Optional<OutboxEvent> findTopByIdAndStatusOrderByCreatedAtDesc(String var1, OutboxEvent.EventStatus var2);
}
