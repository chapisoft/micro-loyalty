package com.natcash.loyalty.partner.repository;

import com.natcash.loyalty.partner.entity.PartnerProductEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartnerProductRepository extends JpaRepository<PartnerProductEntity, Long> {

    List<PartnerProductEntity> findByTenantIdAndPartnerIdOrderByIdDesc(String tenantId, Long partnerId);

    Optional<PartnerProductEntity> findByIdAndTenantIdAndPartnerId(Long id, String tenantId, Long partnerId);
}
