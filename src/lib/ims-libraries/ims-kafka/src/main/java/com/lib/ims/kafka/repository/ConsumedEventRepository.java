package com.lib.ims.kafka.repository;

import com.lib.ims.kafka.entity.ConsumedEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsumedEventRepository extends JpaRepository<ConsumedEvent, String> {
}
