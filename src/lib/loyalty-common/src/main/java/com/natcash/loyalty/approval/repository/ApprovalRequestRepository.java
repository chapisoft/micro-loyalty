package com.natcash.loyalty.approval.repository;

import com.natcash.loyalty.approval.entity.ApprovalRequestEntity;
import com.natcash.loyalty.domain.enums.ApprovalStatus;
import com.natcash.loyalty.domain.enums.ApprovalTargetType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequestEntity, Long> {

    Optional<ApprovalRequestEntity> findByIdAndTenantId(Long id, String tenantId);

    Optional<ApprovalRequestEntity> findByRequestCode(String requestCode);

    Page<ApprovalRequestEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId, Pageable pageable);

    List<ApprovalRequestEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    Page<ApprovalRequestEntity> findByTenantIdAndStatusOrderByCreatedAtDesc(
            String tenantId, ApprovalStatus status, Pageable pageable);

    List<ApprovalRequestEntity> findByTenantIdAndTargetTypeOrderByCreatedAtDesc(
            String tenantId, ApprovalTargetType targetType);

    long countByTenantIdAndStatus(String tenantId, ApprovalStatus status);
}
