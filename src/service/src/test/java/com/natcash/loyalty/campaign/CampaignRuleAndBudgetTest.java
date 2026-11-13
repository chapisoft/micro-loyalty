package com.natcash.loyalty.campaign;

import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.campaign.entity.CampaignControlGroupEntity;
import com.natcash.loyalty.campaign.entity.CampaignRuleConditionEntity;
import com.natcash.loyalty.campaign.entity.LoyaltyMonthlyBudgetEntity;
import com.natcash.loyalty.campaign.repository.CampaignControlGroupRepository;
import com.natcash.loyalty.campaign.repository.CampaignRuleConditionRepository;
import com.natcash.loyalty.campaign.repository.LoyaltyMonthlyBudgetRepository;
import com.natcash.loyalty.campaign.service.CampaignConflictDetector;
import com.natcash.loyalty.campaign.service.ControlGroupService;
import com.natcash.loyalty.campaign.service.MonthlyBudgetGuardService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.CampaignMissionCategory;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.ControlBucketGroup;
import com.natcash.loyalty.domain.enums.SponsorType;
import com.natcash.loyalty.engagement.repository.SystemAlertRepository;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.partner.entity.PartnerStaffAccountEntity;
import com.natcash.loyalty.partner.repository.PartnerStaffAccountRepository;
import com.natcash.loyalty.partner.service.PartnerOwnershipGuard;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CampaignRuleAndBudgetTest {

    private static final String TENANT_ID = "TENANT_NATCASH";

    @Mock
    private CampaignControlGroupRepository controlGroupRepository;
    @Mock
    private LoyaltyMonthlyBudgetRepository budgetRepository;
    @Mock
    private SystemAlertRepository alertRepository;
    @Mock
    private CampaignRuleConditionRepository ruleRepository;
    @Mock
    private LoyaltyPartnerRepository partnerRepository;
    @Mock
    private PartnerStaffAccountRepository staffRepository;

    @Test
    void controlGroup_shouldDeterministicallyAssignAroundFivePercentControl() {
        ControlGroupService service = new ControlGroupService(controlGroupRepository);
        when(controlGroupRepository.findByTenantIdAndCampaignCodeAndExternalUserId(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(controlGroupRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        int controlCount = 0;
        for (int i = 0; i < 200; i++) {
            ControlBucketGroup group = service.resolveBucket(TENANT_ID, "RULE_FIRST_QR", "50937000" + i, 5);
            if (group == ControlBucketGroup.CONTROL) {
                controlCount++;
            }
        }
        assertTrue(controlCount > 0 && controlCount < 30, "Control count expected near 5% (~10), got " + controlCount);
    }

    @Test
    void budgetGuard_shouldEmit80AlertAndHardStopAt100Percent() {
        MonthlyBudgetGuardService budgetService = new MonthlyBudgetGuardService(budgetRepository);
        ReflectionTestUtils.setField(budgetService, "alertRepository", alertRepository);

        String month = DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneOffset.UTC).format(Instant.now());
        LoyaltyMonthlyBudgetEntity budget = LoyaltyMonthlyBudgetEntity.builder()
                .id(1L)
                .tenantId(TENANT_ID)
                .budgetMonth(month)
                .sponsorType(SponsorType.NATCASH)
                .budgetName("Monthly Natcash Pool")
                .budgetCap(new BigDecimal("1000.00"))
                .consumedAmount(new BigDecimal("750.00"))
                .alert80Sent(false)
                .hardStopTriggered(false)
                .status(CommonStatus.ACTIVE)
                .build();

        when(budgetRepository.findByTenantIdAndBudgetMonthAndSponsorType(TENANT_ID, month, SponsorType.NATCASH))
                .thenReturn(Optional.of(budget));

        budgetService.checkAndConsume(TENANT_ID, SponsorType.NATCASH, new BigDecimal("100.00"));
        assertTrue(budget.getAlert80Sent());
        verify(alertRepository).save(any());

        LoyaltyException ex = assertThrows(LoyaltyException.class,
                () -> budgetService.checkAndConsume(TENANT_ID, SponsorType.NATCASH, new BigDecimal("200.00")));
        assertEquals(ErrorCode.BUDGET_EXCEEDED, ex.getErrorCode());
        assertTrue(budget.getHardStopTriggered());
        assertEquals(CommonStatus.PAUSED_BUDGET_EXCEEDED, budget.getStatus());
    }

    @Test
    void conflictDetector_shouldDetectOverlappingRule() {
        CampaignConflictDetector detector = new CampaignConflictDetector(ruleRepository);
        Instant now = Instant.now();
        CampaignRuleConditionEntity existing = CampaignRuleConditionEntity.builder()
                .campaignCode("EXISTING_RULE")
                .missionCategory(CampaignMissionCategory.CROSS_SELL)
                .partnerId(5L)
                .startDate(now.minus(2, ChronoUnit.DAYS))
                .endDate(now.plus(10, ChronoUnit.DAYS))
                .build();
        when(ruleRepository.findByTenantIdAndStatus(TENANT_ID, CommonStatus.ACTIVE))
                .thenReturn(List.of(existing));

        List<String> conflicts = detector.detectConflicts(
                TENANT_ID, "NEW_RULE", CampaignMissionCategory.CROSS_SELL, 5L,
                now, now.plus(5, ChronoUnit.DAYS));
        assertFalse(conflicts.isEmpty());
    }

    @Test
    void partnerOwnershipGuard_shouldDenyIdorCrossPartnerAccess() {
        PartnerOwnershipGuard guard = new PartnerOwnershipGuard(partnerRepository, staffRepository);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("cashier_delimart", "N/A", List.of()));
        try {
            when(partnerRepository.findByIdAndTenantId(99L, TENANT_ID))
                    .thenReturn(Optional.of(com.natcash.loyalty.account.entity.LoyaltyPartnerEntity.builder()
                            .id(99L)
                            .tenantId(TENANT_ID)
                            .build()));
            when(staffRepository.findByTenantIdAndUsername(TENANT_ID, "cashier_delimart"))
                    .thenReturn(Optional.of(PartnerStaffAccountEntity.builder()
                            .id(1L)
                            .tenantId(TENANT_ID)
                            .partnerId(10L)
                            .username("cashier_delimart")
                            .build()));

            LoyaltyException ex = assertThrows(LoyaltyException.class,
                    () -> guard.verifyPartnerAccess(TENANT_ID, 99L));
            assertEquals(ErrorCode.IDOR_FORBIDDEN, ex.getErrorCode());
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
