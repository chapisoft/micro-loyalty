package com.natcash.loyalty.campaign.service;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ActiveCampaignsResponse;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ClaimRewardRequest;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ClaimRewardResponse;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.MilestoneItemDto;
import com.natcash.loyalty.campaign.entity.CampaignMilestoneEntity;
import com.natcash.loyalty.campaign.entity.UserMilestoneEntity;
import com.natcash.loyalty.campaign.repository.CampaignMilestoneRepository;
import com.natcash.loyalty.campaign.repository.UserMilestoneRepository;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.MilestoneStatus;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MilestoneService {

    private static final Logger log = LoggerFactory.getLogger(MilestoneService.class);

    private final CampaignMilestoneRepository campaignRepository;
    private final UserMilestoneRepository userMilestoneRepository;
    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final AccountService accountService;

    public MilestoneService(CampaignMilestoneRepository campaignRepository,
                            UserMilestoneRepository userMilestoneRepository,
                            LoyaltyAccountRepository accountRepository,
                            LoyaltyPointLedgerRepository ledgerRepository,
                            AccountService accountService) {
        this.campaignRepository = campaignRepository;
        this.userMilestoneRepository = userMilestoneRepository;
        this.accountRepository = accountRepository;
        this.ledgerRepository = ledgerRepository;
        this.accountService = accountService;
    }

    @Transactional(readOnly = true)
    public ActiveCampaignsResponse getActiveCampaigns(String tenantId, String externalUserId) {
        Instant now = Instant.now();
        List<CampaignMilestoneEntity> activeMilestones = campaignRepository
                .findByTenantIdAndStatusAndStartDateBeforeAndEndDateAfterOrderByCampaignCodeAscMilestoneStepAsc(
                        tenantId, "ACTIVE", now, now);

        List<UserMilestoneEntity> userProgressList = userMilestoneRepository
                .findByTenantIdAndAccount_ExternalUserId(tenantId, externalUserId);

        Map<Long, UserMilestoneEntity> userProgressMap = userProgressList.stream()
                .collect(Collectors.toMap(u -> u.getMilestone().getId(), u -> u, (a, b) -> a));

        List<MilestoneItemDto> dtoList = new ArrayList<>();
        for (CampaignMilestoneEntity m : activeMilestones) {
            UserMilestoneEntity userProgress = userProgressMap.get(m.getId());
            BigDecimal currentVal = userProgress != null && userProgress.getCurrentProgress() != null
                    ? userProgress.getCurrentProgress()
                    : BigDecimal.ZERO;

            String status = userProgress != null && userProgress.getStatus() != null
                    ? userProgress.getStatus().name()
                    : MilestoneStatus.IN_PROGRESS.name();

            double percentage = 0.0;
            if (m.getTargetValue() != null && m.getTargetValue().compareTo(BigDecimal.ZERO) > 0) {
                percentage = currentVal.divide(m.getTargetValue(), 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
                if (percentage > 100.0) {
                    percentage = 100.0;
                }
            }

            dtoList.add(MilestoneItemDto.builder()
                    .milestoneId(m.getId())
                    .campaignCode(m.getCampaignCode())
                    .campaignName(m.getCampaignName())
                    .milestoneStep(m.getMilestoneStep())
                    .targetMetric(m.getTargetMetric())
                    .targetValue(m.getTargetValue())
                    .currentProgress(currentVal)
                    .progressPercentage(Math.round(percentage * 10.0) / 10.0)
                    .rewardPoints(m.getRewardPoints())
                    .rewardVoucherId(m.getRewardVoucherId())
                    .rewardGameTurns(m.getRewardGameTurns())
                    .status(status)
                    .startDate(m.getStartDate())
                    .endDate(m.getEndDate())
                    .build());
        }

        return ActiveCampaignsResponse.builder()
                .milestones(dtoList)
                .totalActive(dtoList.size())
                .build();
    }

    @Transactional
    public ClaimRewardResponse claimReward(String tenantId, ClaimRewardRequest request) {
        String userId = request.getExternalUserId();
        Long milestoneId = request.getMilestoneId();

        CampaignMilestoneEntity milestone = campaignRepository.findById(milestoneId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND, "Không tìm thấy cột mốc chiến dịch"));

        UserMilestoneEntity userMilestone = userMilestoneRepository
                .findByTenantIdAndAccount_ExternalUserIdAndMilestone_Id(tenantId, userId, milestoneId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Chưa ghi nhận tiến độ tham gia cột mốc"));

        if (MilestoneStatus.CLAIMED.equals(userMilestone.getStatus())) {
            log.warn("[MILESTONE-CLAIMED-ALREADY] tenantId={}, user={}, milestoneId={}",
                    tenantId, userId, milestoneId);
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE, "Phần thưởng của cột mốc này đã được nhận trước đó");
        }

        if (userMilestone.getCurrentProgress().compareTo(milestone.getTargetValue()) < 0) {
            log.warn("[MILESTONE-NOT-COMPLETED] user={}, progress={}, target={}",
                    userId, userMilestone.getCurrentProgress(), milestone.getTargetValue());
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Bạn chưa hoàn thành đủ điều kiện của cột mốc này");
        }

        LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, userId);
        BigDecimal rewardPoints = milestone.getRewardPoints() != null ? milestone.getRewardPoints() : BigDecimal.ZERO;
        BigDecimal newTotalPoints = account.getCurrentPoints();

        // 1. Nếu có thưởng điểm -> cộng điểm và ghi sổ cái bất biến
        if (rewardPoints.compareTo(BigDecimal.ZERO) > 0) {
            newTotalPoints = account.getCurrentPoints().add(rewardPoints);
            account.setCurrentPoints(newTotalPoints);
            accountRepository.save(account);

            String refCode = "CLAIM_MS_" + milestone.getCampaignCode() + "_" + milestone.getMilestoneStep() + "_" + UUID.randomUUID().toString().substring(0, 8);
            LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                    .tenantId(tenantId)
                    .account(account)
                    .pointChange(rewardPoints)
                    .balanceAfter(newTotalPoints)
                    .changeType(PointActionType.EARN)
                    .referenceCode(refCode)
                    .description("Nhận thưởng cột mốc chiến dịch: " + milestone.getCampaignName())
                    .createdAt(Instant.now())
                    .build();
            ledgerRepository.save(ledger);
        }

        // 2. Cập nhật trạng thái chặng mốc sang CLAIMED
        userMilestone.setStatus(MilestoneStatus.CLAIMED);
        userMilestone.setClaimedAt(Instant.now());
        userMilestoneRepository.save(userMilestone);

        log.info("[MILESTONE-CLAIM-SUCCESS] tenantId={}, user={}, campaign={}, step={}, rewardPoints={}",
                tenantId, userId, milestone.getCampaignCode(), milestone.getMilestoneStep(), rewardPoints);

        return ClaimRewardResponse.builder()
                .milestoneId(milestoneId)
                .campaignCode(milestone.getCampaignCode())
                .milestoneStep(milestone.getMilestoneStep())
                .rewardPoints(rewardPoints)
                .rewardVoucherId(milestone.getRewardVoucherId())
                .rewardGameTurns(milestone.getRewardGameTurns())
                .newTotalPoints(newTotalPoints)
                .message("Nhận thưởng cột mốc thành công")
                .claimedAt(Instant.now())
                .build();
    }
}
