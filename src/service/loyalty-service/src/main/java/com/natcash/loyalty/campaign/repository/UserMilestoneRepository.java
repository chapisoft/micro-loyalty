package com.natcash.loyalty.campaign.repository;

import com.natcash.loyalty.campaign.entity.UserMilestoneEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserMilestoneRepository extends JpaRepository<UserMilestoneEntity, Long> {

    List<UserMilestoneEntity> findByTenantIdAndAccount_ExternalUserId(String tenantId, String externalUserId);

    Optional<UserMilestoneEntity> findByTenantIdAndAccount_ExternalUserIdAndMilestone_Id(
            String tenantId, String externalUserId, Long milestoneId);
}
