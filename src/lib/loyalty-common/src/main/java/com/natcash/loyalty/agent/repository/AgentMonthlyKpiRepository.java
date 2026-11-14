package com.natcash.loyalty.agent.repository;

import com.natcash.loyalty.agent.entity.AgentMonthlyKpiEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentMonthlyKpiRepository extends JpaRepository<AgentMonthlyKpiEntity, Long> {

    List<AgentMonthlyKpiEntity> findByTenantIdAndKpiMonthOrderByQualifiedCustomersDesc(String tenantId, String kpiMonth);

    Optional<AgentMonthlyKpiEntity> findByTenantIdAndAgentIdAndKpiMonth(String tenantId, Long agentId, String kpiMonth);
}
