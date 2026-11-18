package com.natcash.loyalty.engagement.repository;

import com.natcash.loyalty.engagement.entity.ContentBannerEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContentBannerRepository extends JpaRepository<ContentBannerEntity, Long> {

    List<ContentBannerEntity> findByTenantIdOrderByPlacementAscDisplayOrderAsc(String tenantId);

    List<ContentBannerEntity> findByTenantIdAndStatusOrderByDisplayOrderAsc(String tenantId, String status);

    List<ContentBannerEntity> findByTenantIdAndPlacementAndStatusOrderByDisplayOrderAsc(
            String tenantId, String placement, String status);
}
