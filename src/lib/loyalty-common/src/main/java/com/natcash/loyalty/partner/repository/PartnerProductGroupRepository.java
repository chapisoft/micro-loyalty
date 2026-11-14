package com.natcash.loyalty.partner.repository;

import com.natcash.loyalty.partner.entity.PartnerProductGroupEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartnerProductGroupRepository extends JpaRepository<PartnerProductGroupEntity, Long> {

    List<PartnerProductGroupEntity> findByTenantIdAndPartnerIdOrderByIdDesc(String tenantId, Long partnerId);

    Optional<PartnerProductGroupEntity> findByIdAndTenantIdAndPartnerId(Long id, String tenantId, Long partnerId);
}
