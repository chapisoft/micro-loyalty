package com.natcash.loyalty.partner.repository;

import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.partner.entity.PartnerBranchEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartnerBranchRepository extends JpaRepository<PartnerBranchEntity, Long> {

    List<PartnerBranchEntity> findByTenantIdOrderByIdDesc(String tenantId);

    List<PartnerBranchEntity> findByTenantIdAndPartnerIdOrderByIdDesc(String tenantId, Long partnerId);

    List<PartnerBranchEntity> findByTenantIdAndIsNatcashOwnOrderByIdDesc(String tenantId, Boolean isNatcashOwn);

    List<PartnerBranchEntity> findByTenantIdAndStatus(String tenantId, CommonStatus status);

    Optional<PartnerBranchEntity> findByIdAndTenantId(Long id, String tenantId);

    Optional<PartnerBranchEntity> findByIdAndTenantIdAndPartnerId(Long id, String tenantId, Long partnerId);

    Optional<PartnerBranchEntity> findByTenantIdAndBranchCode(String tenantId, String branchCode);
}
