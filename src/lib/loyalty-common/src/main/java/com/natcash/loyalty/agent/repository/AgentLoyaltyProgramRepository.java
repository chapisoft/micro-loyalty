package com.natcash.loyalty.agent.repository;

import com.natcash.loyalty.agent.entity.AgentLoyaltyProgramEntity;
import com.natcash.loyalty.domain.enums.AgentRoleType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentLoyaltyProgramRepository extends JpaRepository<AgentLoyaltyProgramEntity, Long> {

    List<AgentLoyaltyProgramEntity> findByTenantIdOrderByIdDesc(String tenantId);

    List<AgentLoyaltyProgramEntity> findByTenantIdAndSuperAgentId(String tenantId, Long superAgentId);

    List<AgentLoyaltyProgramEntity> findByTenantIdAndAgentRole(String tenantId, AgentRoleType role);

    Optional<AgentLoyaltyProgramEntity> findByTenantIdAndExternalUserId(String tenantId, String externalUserId);

    Optional<AgentLoyaltyProgramEntity> findByTenantIdAndAgentCode(String tenantId, String agentCode);
}
