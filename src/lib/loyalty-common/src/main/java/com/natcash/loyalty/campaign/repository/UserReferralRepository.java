package com.natcash.loyalty.campaign.repository;

import com.natcash.loyalty.campaign.entity.UserReferralEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserReferralRepository extends JpaRepository<UserReferralEntity, Long> {

    List<UserReferralEntity> findByTenantIdAndReferrerUserIdOrderByCreatedAtDesc(String tenantId, String referrerUserId);

    long countByTenantIdAndReferrerUserIdAndEkycVerifiedTrue(String tenantId, String referrerUserId);
}
