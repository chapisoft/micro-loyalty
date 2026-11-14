package com.natcash.loyalty.campaign;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ActiveCampaignsResponse;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ClaimRewardRequest;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ClaimRewardResponse;
import com.natcash.loyalty.campaign.entity.CampaignMilestoneEntity;
import com.natcash.loyalty.campaign.entity.UserMilestoneEntity;
import com.natcash.loyalty.campaign.repository.CampaignMilestoneRepository;
import com.natcash.loyalty.campaign.repository.UserMilestoneRepository;
import com.natcash.loyalty.campaign.service.MilestoneService;
import com.natcash.loyalty.domain.enums.CampaignMetric;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.MilestoneStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MilestoneServiceTest {

    @Mock
    private CampaignMilestoneRepository campaignRepository;

    @Mock
    private UserMilestoneRepository userMilestoneRepository;

    @Mock
    private LoyaltyAccountRepository accountRepository;

    @Mock
    private LoyaltyPointLedgerRepository ledgerRepository;

    @Mock
    private AccountService accountService;

    @Mock
    private com.natcash.loyalty.wallet.repository.LoyaltyVoucherRepository voucherRepository;

    @Mock
    private com.natcash.loyalty.wallet.repository.LoyaltyVoucherRedemptionRepository redemptionRepository;

    @Mock
    private com.natcash.loyalty.account.repository.LoyaltyPartnerRepository partnerRepository;

    @InjectMocks
    private MilestoneService milestoneService;

    @Test
    @DisplayName("BE-11.1: Tra cứu danh sách cột mốc chiến dịch đang chạy kèm tiến độ")
    void testGetActiveCampaigns() {
        CampaignMilestoneEntity milestone = CampaignMilestoneEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .partnerId(100L)
                .campaignCode("GOLDEN_WEEK")
                .campaignName("Tuần Lễ Vàng")
                .milestoneStep(1)
                .targetMetric(CampaignMetric.BILL_AMOUNT)
                .targetValue(new BigDecimal("1000.00"))
                .rewardPoints(new BigDecimal("100.00"))
                .status(CommonStatus.ACTIVE)
                .startDate(Instant.now().minusSeconds(86400))
                .endDate(Instant.now().plusSeconds(86400))
                .build();

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .externalUserId("USER_01")
                .build();

        UserMilestoneEntity userMilestone = UserMilestoneEntity.builder()
                .id(10L)
                .milestone(milestone)
                .account(account)
                .currentProgress(new BigDecimal("500.00"))
                .status(MilestoneStatus.IN_PROGRESS)
                .build();

        com.natcash.loyalty.account.entity.LoyaltyPartnerEntity partner = com.natcash.loyalty.account.entity.LoyaltyPartnerEntity.builder()
                .id(100L)
                .partnerCode("DELI_SUPERMARKET")
                .partnerName("DeliMart Supermarket")
                .build();

        when(campaignRepository.findByTenantIdAndStatusAndStartDateBeforeAndEndDateAfterOrderByCampaignCodeAscMilestoneStepAsc(
                eq("TENANT_DELIMART"), eq(CommonStatus.ACTIVE), any(), any()))
                .thenReturn(List.of(milestone));

        when(partnerRepository.findByTenantId("TENANT_DELIMART")).thenReturn(List.of(partner));

        when(userMilestoneRepository.findByTenantIdAndAccount_ExternalUserId("TENANT_DELIMART", "USER_01"))
                .thenReturn(List.of(userMilestone));

        ActiveCampaignsResponse response = milestoneService.getActiveCampaigns("TENANT_DELIMART", "USER_01");

        assertNotNull(response);
        assertEquals(1, response.getTotalActive());
        assertEquals(50.0, response.getMilestones().get(0).getProgressPercentage());
        assertEquals(MilestoneStatus.IN_PROGRESS, response.getMilestones().get(0).getStatus());
        assertEquals(100L, response.getMilestones().get(0).getPartnerId());
        assertEquals("DeliMart Supermarket", response.getMilestones().get(0).getPartnerName());
    }

    @Test
    @DisplayName("BE-11.2: Nhận thưởng cột mốc thành công khi đã hoàn thành đủ điều kiện")
    void testClaimRewardSuccess() {
        CampaignMilestoneEntity milestone = CampaignMilestoneEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .partnerId(100L)
                .campaignCode("GOLDEN_WEEK")
                .campaignName("Tuần Lễ Vàng")
                .milestoneStep(1)
                .targetValue(new BigDecimal("1000.00"))
                .rewardPoints(new BigDecimal("200.00"))
                .rewardVoucherId(50L)
                .rewardGameTurns(2)
                .build();

        UserMilestoneEntity userMilestone = UserMilestoneEntity.builder()
                .id(10L)
                .milestone(milestone)
                .currentProgress(new BigDecimal("1200.00"))
                .status(MilestoneStatus.IN_PROGRESS)
                .build();

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .id(5L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("USER_01")
                .currentPoints(new BigDecimal("300.00"))
                .build();

        com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity voucher = com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity.builder()
                .id(50L)
                .voucherCode("VOUCHER_50")
                .title("Giảm 50K")
                .discountValue(new BigDecimal("50.00"))
                .status(com.natcash.loyalty.domain.enums.VoucherStatus.ACTIVE)
                .build();

        when(campaignRepository.findById(1L)).thenReturn(Optional.of(milestone));
        when(userMilestoneRepository.findByTenantIdAndAccount_ExternalUserIdAndMilestone_Id("TENANT_DELIMART", "USER_01", 1L))
                .thenReturn(Optional.of(userMilestone));
        when(accountService.getAccountForUpdate("TENANT_DELIMART", "USER_01"))
                .thenReturn(account);
        when(voucherRepository.findById(50L)).thenReturn(Optional.of(voucher));

        ClaimRewardRequest request = ClaimRewardRequest.builder()
                .externalUserId("USER_01")
                .milestoneId(1L)
                .build();

        ClaimRewardResponse response = milestoneService.claimReward("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("200.00"), response.getRewardPoints());
        assertEquals(new BigDecimal("500.00"), response.getNewTotalPoints());
        assertEquals(50L, response.getRewardVoucherId());
        assertEquals(2, response.getRewardGameTurns());
        assertEquals(MilestoneStatus.CLAIMED, userMilestone.getStatus());

        verify(ledgerRepository, times(1)).save(any());
        verify(redemptionRepository, times(1)).save(any());
        verify(accountRepository, times(1)).save(account);
        verify(userMilestoneRepository, times(1)).save(userMilestone);
    }

    @Test
    @DisplayName("BE-11.3: Từ chối nhận thưởng nếu phần thưởng đã được nhận trước đó")
    void testRejectAlreadyClaimedReward() {
        CampaignMilestoneEntity milestone = CampaignMilestoneEntity.builder()
                .id(1L)
                .targetValue(new BigDecimal("1000.00"))
                .build();

        UserMilestoneEntity userMilestone = UserMilestoneEntity.builder()
                .status(MilestoneStatus.CLAIMED)
                .build();

        when(campaignRepository.findById(1L)).thenReturn(Optional.of(milestone));
        when(userMilestoneRepository.findByTenantIdAndAccount_ExternalUserIdAndMilestone_Id("TENANT_DELIMART", "USER_01", 1L))
                .thenReturn(Optional.of(userMilestone));

        ClaimRewardRequest request = ClaimRewardRequest.builder()
                .externalUserId("USER_01")
                .milestoneId(1L)
                .build();

        assertThrows(LoyaltyException.class, () ->
                milestoneService.claimReward("TENANT_DELIMART", request));

        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("BE-11.4: Tích lũy tiến độ cột mốc tự động theo giao dịch")
    void testRecordProgressAccumulation() {
        CampaignMilestoneEntity milestoneAlliance = CampaignMilestoneEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .partnerId(null)
                .campaignCode("SPEND_ALLIANCE")
                .targetMetric(CampaignMetric.BILL_AMOUNT)
                .targetValue(new BigDecimal("500.00"))
                .build();

        CampaignMilestoneEntity milestonePartner = CampaignMilestoneEntity.builder()
                .id(2L)
                .tenantId("TENANT_DELIMART")
                .partnerId(10L)
                .campaignCode("SPEND_DELI")
                .targetMetric(CampaignMetric.BILL_AMOUNT)
                .targetValue(new BigDecimal("200.00"))
                .build();

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .id(100L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("USER_01")
                .build();

        when(campaignRepository.findActiveMilestonesForTracking(
                eq("TENANT_DELIMART"), eq(CommonStatus.ACTIVE), any(Instant.class), eq(CampaignMetric.BILL_AMOUNT), eq(10L)))
                .thenReturn(List.of(milestoneAlliance, milestonePartner));

        when(accountRepository.findByTenantIdAndExternalUserId("TENANT_DELIMART", "USER_01"))
                .thenReturn(Optional.of(account));

        when(userMilestoneRepository.findByTenantIdAndAccount_ExternalUserIdAndMilestone_Id("TENANT_DELIMART", "USER_01", 1L))
                .thenReturn(Optional.empty());

        when(userMilestoneRepository.findByTenantIdAndAccount_ExternalUserIdAndMilestone_Id("TENANT_DELIMART", "USER_01", 2L))
                .thenReturn(Optional.empty());

        milestoneService.recordProgress("TENANT_DELIMART", "USER_01", 10L, CampaignMetric.BILL_AMOUNT, new BigDecimal("250.00"));

        verify(userMilestoneRepository, times(2)).save(any(UserMilestoneEntity.class));
    }
}
