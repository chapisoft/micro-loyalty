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
import com.natcash.loyalty.domain.enums.CampaignMetric;
import com.natcash.loyalty.domain.enums.CommonStatus;
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
import java.util.*;
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
                        tenantId, CommonStatus.ACTIVE, now, now);

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

            MilestoneStatus status = userProgress != null && userProgress.getStatus() != null
                    ? userProgress.getStatus()
                    : MilestoneStatus.IN_PROGRESS;

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

    @Transactional
    public List<CampaignMilestoneEntity> getAllMilestones(String tenantId) {
        List<CampaignMilestoneEntity> list = campaignRepository.findByTenantIdOrderByCampaignCodeAscMilestoneStepAsc(tenantId);
        if (list.isEmpty()) {
            list = seedDefaultMilestones(tenantId);
        }
        return list;
    }

    @Transactional
    public CampaignMilestoneEntity createMilestone(String tenantId, CampaignMilestoneEntity request) {
        request.setTenantId(tenantId);
        if (request.getCampaignCode() == null || request.getCampaignCode().trim().isEmpty()) {
            request.setCampaignCode("CAMP_" + System.currentTimeMillis());
        } else {
            request.setCampaignCode(request.getCampaignCode().trim().toUpperCase());
        }
        if (request.getMilestoneStep() == null || request.getMilestoneStep() < 1) {
            request.setMilestoneStep(1);
        }

        // Kiểm tra trùng chặng cột mốc trong cùng chiến dịch
        Optional<CampaignMilestoneEntity> duplicate = campaignRepository
                .findByTenantIdAndCampaignCodeAndMilestoneStep(tenantId, request.getCampaignCode(), request.getMilestoneStep());
        if (duplicate.isPresent()) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION,
                    "Chặng " + request.getMilestoneStep() + " của chiến dịch " + request.getCampaignCode() + " đã tồn tại!");
        }

        if (request.getStartDate() == null) request.setStartDate(Instant.now());
        if (request.getEndDate() == null) request.setEndDate(Instant.now().plusSeconds(90L * 86400L));
        if (request.getStatus() == null) request.setStatus(CommonStatus.ACTIVE);
        if (request.getRewardPoints() == null) request.setRewardPoints(BigDecimal.ZERO);
        if (request.getRewardGameTurns() == null) request.setRewardGameTurns(0);

        return campaignRepository.save(request);
    }

    @Transactional
    public CampaignMilestoneEntity updateMilestone(String tenantId, Long id, CampaignMilestoneEntity request) {
        CampaignMilestoneEntity entity = campaignRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, "Không tìm thấy cột mốc #" + id));

        if (request.getCampaignName() != null) entity.setCampaignName(request.getCampaignName());
        if (request.getCampaignCode() != null) entity.setCampaignCode(request.getCampaignCode().trim().toUpperCase());
        if (request.getMilestoneStep() != null) entity.setMilestoneStep(request.getMilestoneStep());
        if (request.getTargetMetric() != null) entity.setTargetMetric(request.getTargetMetric());
        if (request.getTargetValue() != null) entity.setTargetValue(request.getTargetValue());
        if (request.getRewardPoints() != null) entity.setRewardPoints(request.getRewardPoints());
        if (request.getRewardVoucherId() != null) entity.setRewardVoucherId(request.getRewardVoucherId());
        if (request.getRewardGameTurns() != null) entity.setRewardGameTurns(request.getRewardGameTurns());
        if (request.getStartDate() != null) entity.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) entity.setEndDate(request.getEndDate());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());
        entity.setUpdatedAt(Instant.now());

        return campaignRepository.save(entity);
    }

    @Transactional
    public void deleteMilestone(String tenantId, Long id) {
        campaignRepository.findByIdAndTenantId(id, tenantId).ifPresent(campaignRepository::delete);
    }

    private List<CampaignMilestoneEntity> seedDefaultMilestones(String tenantId) {
        List<CampaignMilestoneEntity> defaults = new ArrayList<>();
        Instant now = Instant.now();
        Instant end = now.plusSeconds(180L * 86400L);

        defaults.add(CampaignMilestoneEntity.builder()
                .tenantId(tenantId)
                .campaignCode("TOPUP_FESTIVAL_2026")
                .campaignName("Tuần Lễ Vàng Nạp Cước Viễn Thông")
                .milestoneStep(1)
                .targetMetric(CampaignMetric.BILL_AMOUNT)
                .targetValue(new BigDecimal("500.00"))
                .rewardPoints(new BigDecimal("50.00"))
                .rewardGameTurns(1)
                .startDate(now)
                .endDate(end)
                .status(CommonStatus.ACTIVE)
                .build());

        defaults.add(CampaignMilestoneEntity.builder()
                .tenantId(tenantId)
                .campaignCode("TOPUP_FESTIVAL_2026")
                .campaignName("Tuần Lễ Vàng Nạp Cước Viễn Thông")
                .milestoneStep(2)
                .targetMetric(CampaignMetric.BILL_AMOUNT)
                .targetValue(new BigDecimal("1500.00"))
                .rewardPoints(new BigDecimal("200.00"))
                .rewardGameTurns(3)
                .startDate(now)
                .endDate(end)
                .status(CommonStatus.ACTIVE)
                .build());

        defaults.add(CampaignMilestoneEntity.builder()
                .tenantId(tenantId)
                .campaignCode("RETAIL_SHOPPING_SPREE")
                .campaignName("Hành Trình Mua Sắm Siêu Thị Không Tiền Mặt")
                .milestoneStep(1)
                .targetMetric(CampaignMetric.TRANSACTION_COUNT)
                .targetValue(new BigDecimal("3.00"))
                .rewardPoints(new BigDecimal("100.00"))
                .rewardGameTurns(2)
                .startDate(now)
                .endDate(end)
                .status(CommonStatus.ACTIVE)
                .build());

        defaults.add(CampaignMilestoneEntity.builder()
                .tenantId(tenantId)
                .campaignCode("RETAIL_SHOPPING_SPREE")
                .campaignName("Hành Trình Mua Sắm Siêu Thị Không Tiền Mặt")
                .milestoneStep(2)
                .targetMetric(CampaignMetric.TRANSACTION_COUNT)
                .targetValue(new BigDecimal("8.00"))
                .rewardPoints(new BigDecimal("300.00"))
                .rewardGameTurns(5)
                .startDate(now)
                .endDate(end)
                .status(CommonStatus.ACTIVE)
                .build());

        return campaignRepository.saveAll(defaults);
    }
}
