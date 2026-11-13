package com.natcash.loyalty.agent.repository;

import com.natcash.loyalty.agent.entity.SupportPlaybookEntity;
import com.natcash.loyalty.domain.enums.CommonStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupportPlaybookRepository extends JpaRepository<SupportPlaybookEntity, Long> {

    List<SupportPlaybookEntity> findByTenantIdAndStatusOrderByIdAsc(String tenantId, CommonStatus status);

    Optional<SupportPlaybookEntity> findByTenantIdAndPlaybookCode(String tenantId, String playbookCode);
}
