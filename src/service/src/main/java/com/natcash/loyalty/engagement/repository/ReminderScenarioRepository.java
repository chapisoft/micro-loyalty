package com.natcash.loyalty.engagement.repository;

import com.natcash.loyalty.engagement.entity.ReminderScenarioEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReminderScenarioRepository extends JpaRepository<ReminderScenarioEntity, Long> {

    List<ReminderScenarioEntity> findByTenantIdOrderByIdDesc(String tenantId);

    Optional<ReminderScenarioEntity> findByTenantIdAndScenarioCode(String tenantId, String scenarioCode);
}
