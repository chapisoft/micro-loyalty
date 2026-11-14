package com.natcash.loyalty.agent.repository;

import com.natcash.loyalty.agent.entity.SuperAgentNetworkKpiEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SuperAgentNetworkKpiRepository extends JpaRepository<SuperAgentNetworkKpiEntity, Long> {

    List<SuperAgentNetworkKpiEntity> findByTenantIdAndKpiMonth(String tenantId, String kpiMonth);

    Optional<SuperAgentNetworkKpiEntity> findByTenantIdAndSuperAgentIdAndKpiMonth(
            String tenantId, Long superAgentId, String kpiMonth);
}
