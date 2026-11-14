package com.natcash.loyalty.engagement.repository;

import com.natcash.loyalty.domain.enums.CustomerSegmentCode;
import com.natcash.loyalty.engagement.entity.CustomerSegmentEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerSegmentRepository extends JpaRepository<CustomerSegmentEntity, Long> {

    List<CustomerSegmentEntity> findByTenantIdOrderByIdAsc(String tenantId);

    Optional<CustomerSegmentEntity> findByTenantIdAndSegmentCode(String tenantId, CustomerSegmentCode segmentCode);
}
