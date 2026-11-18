package com.natcash.loyalty.engagement.repository;

import com.natcash.loyalty.engagement.entity.TargetedOfferEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TargetedOfferRepository extends JpaRepository<TargetedOfferEntity, Long> {

    List<TargetedOfferEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId);
}
