package com.natcash.loyalty.engagement.repository;

import com.natcash.loyalty.domain.enums.CustomerSegmentCode;
import com.natcash.loyalty.engagement.entity.CustomerSegmentMemberEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerSegmentMemberRepository extends JpaRepository<CustomerSegmentMemberEntity, Long> {

    List<CustomerSegmentMemberEntity> findByTenantIdAndSegmentCodeOrderByScoreDesc(
            String tenantId, CustomerSegmentCode segmentCode);

    List<CustomerSegmentMemberEntity> findByTenantIdAndExternalUserId(String tenantId, String externalUserId);

    Optional<CustomerSegmentMemberEntity> findByTenantIdAndSegmentCodeAndExternalUserId(
            String tenantId, CustomerSegmentCode segmentCode, String externalUserId);

    long countByTenantIdAndSegmentCode(String tenantId, CustomerSegmentCode segmentCode);
}
