package com.natcash.loyalty.partner.repository;

import com.natcash.loyalty.partner.entity.PartnerStaffAccountEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartnerStaffAccountRepository extends JpaRepository<PartnerStaffAccountEntity, Long> {

    List<PartnerStaffAccountEntity> findByTenantIdAndPartnerIdOrderByIdDesc(String tenantId, Long partnerId);

    Optional<PartnerStaffAccountEntity> findByTenantIdAndUsername(String tenantId, String username);

    List<PartnerStaffAccountEntity> findByUsernameOrderByIdAsc(String username);

    List<PartnerStaffAccountEntity> findByUsernameIgnoreCaseOrderByIdDesc(String username);

    Optional<PartnerStaffAccountEntity> findByEmailIgnoreCase(String email);

    Optional<PartnerStaffAccountEntity> findByIdAndTenantIdAndPartnerId(Long id, String tenantId, Long partnerId);
}
