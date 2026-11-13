package com.natcash.loyalty.campaign.repository;

import com.natcash.loyalty.campaign.entity.LoyaltyMonthlyBudgetEntity;
import com.natcash.loyalty.domain.enums.SponsorType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyMonthlyBudgetRepository extends JpaRepository<LoyaltyMonthlyBudgetEntity, Long> {

    List<LoyaltyMonthlyBudgetEntity> findByTenantIdOrderByBudgetMonthDescIdDesc(String tenantId);

    List<LoyaltyMonthlyBudgetEntity> findByTenantIdAndBudgetMonthOrderByIdAsc(String tenantId, String budgetMonth);

    Optional<LoyaltyMonthlyBudgetEntity> findByTenantIdAndBudgetMonthAndSponsorType(
            String tenantId, String budgetMonth, SponsorType sponsorType);
}
