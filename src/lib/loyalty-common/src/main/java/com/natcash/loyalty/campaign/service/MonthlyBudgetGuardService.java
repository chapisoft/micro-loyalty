package com.natcash.loyalty.campaign.service;

import com.natcash.loyalty.campaign.entity.LoyaltyMonthlyBudgetEntity;
import com.natcash.loyalty.campaign.repository.LoyaltyMonthlyBudgetRepository;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.AlertSeverity;
import com.natcash.loyalty.domain.enums.AlertType;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.SponsorType;
import com.natcash.loyalty.engagement.entity.SystemAlertEntity;
import com.natcash.loyalty.engagement.repository.SystemAlertRepository;
import com.natcash.loyalty.exception.LoyaltyException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class MonthlyBudgetGuardService {

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneOffset.UTC);

    private final LoyaltyMonthlyBudgetRepository budgetRepository;

    @Autowired(required = false)
    private SystemAlertRepository alertRepository;

    public MonthlyBudgetGuardService(LoyaltyMonthlyBudgetRepository budgetRepository) {
        this.budgetRepository = budgetRepository;
    }

    @Transactional(readOnly = true)
    public List<LoyaltyMonthlyBudgetEntity> listBudgets(String tenantId, String budgetMonth) {
        if (budgetMonth != null && !budgetMonth.isBlank()) {
            return budgetRepository.findByTenantIdAndBudgetMonthOrderByIdAsc(tenantId, budgetMonth.trim());
        }
        return budgetRepository.findByTenantIdOrderByBudgetMonthDescIdDesc(tenantId);
    }

    @Transactional
    public LoyaltyMonthlyBudgetEntity saveBudget(String tenantId, LoyaltyMonthlyBudgetEntity request) {
        String month = request.getBudgetMonth() != null && !request.getBudgetMonth().isBlank()
                ? request.getBudgetMonth().trim()
                : MONTH_FMT.format(Instant.now());
        SponsorType sponsor = request.getSponsorType() != null ? request.getSponsorType() : SponsorType.PLATFORM;

        Optional<LoyaltyMonthlyBudgetEntity> existing = budgetRepository
                .findByTenantIdAndBudgetMonthAndSponsorType(tenantId, month, sponsor);
        LoyaltyMonthlyBudgetEntity entity = existing.orElseGet(() -> LoyaltyMonthlyBudgetEntity.builder()
                .tenantId(tenantId)
                .budgetMonth(month)
                .sponsorType(sponsor)
                .consumedAmount(BigDecimal.ZERO)
                .build());

        entity.setBudgetName(request.getBudgetName());
        entity.setPartnerId(request.getPartnerId());
        entity.setBudgetCap(request.getBudgetCap() != null ? request.getBudgetCap() : BigDecimal.ZERO);
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }
        return budgetRepository.save(entity);
    }

    @Transactional
    public void checkAndConsume(String tenantId, SponsorType sponsorType, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        String month = MONTH_FMT.format(Instant.now());
        SponsorType effectiveSponsor = sponsorType != null ? sponsorType : SponsorType.PLATFORM;
        Optional<LoyaltyMonthlyBudgetEntity> opt = budgetRepository
                .findByTenantIdAndBudgetMonthAndSponsorType(tenantId, month, effectiveSponsor);
        if (opt.isEmpty()) {
            return;
        }

        LoyaltyMonthlyBudgetEntity budget = opt.get();
        if (Boolean.TRUE.equals(budget.getHardStopTriggered())
                || budget.getStatus() == CommonStatus.PAUSED_BUDGET_EXCEEDED) {
            throw new LoyaltyException(ErrorCode.BUDGET_EXCEEDED);
        }

        BigDecimal cap = budget.getBudgetCap() != null ? budget.getBudgetCap() : BigDecimal.ZERO;
        BigDecimal consumed = budget.getConsumedAmount() != null ? budget.getConsumedAmount() : BigDecimal.ZERO;
        BigDecimal projected = consumed.add(amount);

        if (cap.compareTo(BigDecimal.ZERO) > 0 && projected.compareTo(cap) > 0) {
            budget.setHardStopTriggered(Boolean.TRUE);
            budget.setStatus(CommonStatus.PAUSED_BUDGET_EXCEEDED);
            budgetRepository.save(budget);
            emitBudgetAlert(tenantId, budget, AlertType.BUDGET_100, AlertSeverity.CRITICAL,
                    "Budget 100% Hard Stop: " + budget.getBudgetName());
            throw new LoyaltyException(ErrorCode.BUDGET_EXCEEDED);
        }

        budget.setConsumedAmount(projected);
        if (cap.compareTo(BigDecimal.ZERO) > 0) {
            SystemParameterService paramService = SystemParameterService.get();
            BigDecimal pct = projected.multiply(paramService.getDecimal(tenantId, SystemParamSpec.PERCENT_DIVISOR))
                    .divide(cap, 2, RoundingMode.HALF_UP);
            if (!Boolean.TRUE.equals(budget.getAlert80Sent())
                    && pct.compareTo(new BigDecimal(paramService.getInt(
                            tenantId, SystemParamSpec.BUDGET_ALERT_THRESHOLD_PERCENT))) >= 0) {
                budget.setAlert80Sent(Boolean.TRUE);
                emitBudgetAlert(tenantId, budget, AlertType.BUDGET_80, AlertSeverity.WARNING,
                        "Budget reached " + pct + "%: " + budget.getBudgetName());
            }
        }
        budgetRepository.save(budget);
    }

    private void emitBudgetAlert(String tenantId,
                                 LoyaltyMonthlyBudgetEntity budget,
                                 AlertType alertType,
                                 AlertSeverity severity,
                                 String title) {
        if (alertRepository == null) {
            return;
        }
        alertRepository.save(SystemAlertEntity.builder()
                .tenantId(tenantId)
                .alertCode(alertType.name() + "_" + budget.getSponsorType().name() + "_" + budget.getBudgetMonth())
                .alertType(alertType)
                .severity(severity)
                .title(title)
                .message("Consumed " + budget.getConsumedAmount() + " / Cap " + budget.getBudgetCap())
                .sourceRef(budget.getBudgetMonth() + ":" + budget.getSponsorType().name())
                .acknowledged(Boolean.FALSE)
                .build());
    }
}
