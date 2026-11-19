package com.natcash.loyalty.campaign.service;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ActiveCampaignsResponse;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ClaimRewardRequest;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.ClaimRewardResponse;
import com.natcash.loyalty.campaign.dto.CampaignMilestoneDto.MilestoneItemDto;
import com.natcash.loyalty.campaign.entity.CampaignMilestoneEntity;
import com.natcash.loyalty.campaign.entity.UserMilestoneEntity;
import com.natcash.loyalty.campaign.repository.CampaignMilestoneRepository;
import com.natcash.loyalty.campaign.repository.UserMilestoneRepository;
import com.natcash.loyalty.codegeneration.domain.CodeType;
import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.CampaignMetric;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.MilestoneStatus;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.util.MessageUtils;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherRedemptionEntity;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRedemptionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MilestoneService {

    private static final Logger log = LoggerFactory.getLogger(MilestoneService.class);

    private final CampaignMilestoneRepository campaignRepository;
    private final UserMilestoneRepository userMilestoneRepository;
    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final LoyaltyPartnerRepository partnerRepository;
    private final LoyaltyVoucherRepository voucherRepository;
    private final LoyaltyVoucherRedemptionRepository redemptionRepository;
    private final AccountService accountService;

    public MilestoneService(CampaignMilestoneRepository campaignRepository,
                            UserMilestoneRepository userMilestoneRepository,
                            LoyaltyAccountRepository accountRepository,
                            LoyaltyPartnerRepository partnerRepository,
                            LoyaltyPointLedgerRepository ledgerRepository,
                            LoyaltyVoucherRepository voucherRepository,
                            LoyaltyVoucherRedemptionRepository redemptionRepository,
                            AccountService accountService) {
        this.campaignRepository = campaignRepository;
        this.userMilestoneRepository = userMilestoneRepository;
        this.accountRepository = accountRepository;
        this.partnerRepository = partnerRepository;
        this.ledgerRepository = ledgerRepository;
        this.voucherRepository = voucherRepository;
        this.redemptionRepository = redemptionRepository;
        this.accountService = accountService;
    }

    @Transactional
    public void recordProgress(String tenantId, String externalUserId, Long partnerId, CampaignMetric metric, BigDecimal delta) {
        if (delta == null || delta.compareTo(BigDecimal.ZERO) <= 0 || externalUserId == null || externalUserId.trim().isEmpty()) {
            return;
        }
        Instant now = Instant.now();
        List<CampaignMilestoneEntity> activeMilestones = campaignRepository.findActiveMilestonesForTracking(
                tenantId, CommonStatus.ACTIVE, now, metric, partnerId);

        if (activeMilestones.isEmpty()) {
            return;
        }

        LoyaltyAccountEntity account = accountRepository.findByTenantIdAndExternalUserId(tenantId, externalUserId)
                .orElse(null);
        if (account == null) {
            return;
        }

        for (CampaignMilestoneEntity milestone : activeMilestones) {
            UserMilestoneEntity userMilestone = userMilestoneRepository
                    .findByTenantIdAndAccount_ExternalUserIdAndMilestone_Id(tenantId, externalUserId, milestone.getId())
                    .orElseGet(() -> UserMilestoneEntity.builder()
                            .tenantId(tenantId)
                            .account(account)
                            .milestone(milestone)
                            .currentProgress(BigDecimal.ZERO)
                            .status(MilestoneStatus.IN_PROGRESS)
                            .build());

            if (MilestoneStatus.CLAIMED.equals(userMilestone.getStatus())) {
                continue;
            }

            BigDecimal current = userMilestone.getCurrentProgress() != null ? userMilestone.getCurrentProgress() : BigDecimal.ZERO;
            BigDecimal newProgress = current.add(delta);
            userMilestone.setCurrentProgress(newProgress);

            if (newProgress.compareTo(milestone.getTargetValue()) >= 0 && MilestoneStatus.IN_PROGRESS.equals(userMilestone.getStatus())) {
                userMilestone.setStatus(MilestoneStatus.COMPLETED);
                userMilestone.setCompletedAt(now);
                log.info("[MILESTONE-COMPLETED] tenantId={}, user={}, campaign={}, step={}, progress={}, target={}",
                        tenantId, externalUserId, milestone.getCampaignCode(), milestone.getMilestoneStep(), newProgress, milestone.getTargetValue());
            }

            userMilestoneRepository.save(userMilestone);
        }
    }

    @Transactional(readOnly = true)
    public ActiveCampaignsResponse getActiveCampaigns(String tenantId, String externalUserId) {
        return getActiveCampaigns(tenantId, externalUserId, "CUSTOMER");
    }

    /** Missions for one audience (NV-05 "Who can join"): customers never see agent missions and vice versa. */
    @Transactional(readOnly = true)
    public ActiveCampaignsResponse getActiveCampaigns(String tenantId, String externalUserId, String role) {
        String audience = role == null || role.isBlank() ? "CUSTOMER" : role.trim().toUpperCase();
        Instant now = Instant.now();
        List<CampaignMilestoneEntity> activeMilestones = campaignRepository
                .findByTenantIdAndStatusAndStartDateBeforeAndEndDateAfterOrderByCampaignCodeAscMilestoneStepAsc(
                        tenantId, CommonStatus.ACTIVE, now, now);

        List<UserMilestoneEntity> userProgressList = (externalUserId != null && !externalUserId.isBlank())
                ? userMilestoneRepository.findByTenantIdAndAccount_ExternalUserId(tenantId, externalUserId)
                : Collections.emptyList();

        Map<Long, UserMilestoneEntity> userProgressMap = userProgressList.stream()
                .collect(Collectors.toMap(u -> u.getMilestone().getId(), u -> u, (a, b) -> a));

        Map<Long, LoyaltyPartnerEntity> partnerMap = new HashMap<>();
        List<LoyaltyPartnerEntity> partners = partnerRepository.findByTenantId(tenantId);
        for (LoyaltyPartnerEntity p : partners) {
            partnerMap.put(p.getId(), p);
        }

        List<MilestoneItemDto> dtoList = new ArrayList<>();
        for (CampaignMilestoneEntity m : activeMilestones) {
            if (!audience.equals(m.getAudienceRole() == null ? "CUSTOMER" : m.getAudienceRole())) {
                continue;
            }
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

            LoyaltyPartnerEntity p = m.getPartnerId() != null ? partnerMap.get(m.getPartnerId()) : null;

            dtoList.add(MilestoneItemDto.builder()
                    .milestoneId(m.getId())
                    .partnerId(m.getPartnerId())
                    .partnerCode(p != null ? p.getPartnerCode() : null)
                    .partnerName(p != null ? p.getPartnerName() : null)
                    .campaignCode(m.getCampaignCode())
                    .campaignName(m.getCampaignName())
                    .description(m.getDescription())
                    .imageUrl(m.getImageUrl())
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
                    .audienceRole(m.getAudienceRole())
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
                .orElseThrow(() -> new LoyaltyException(ErrorCode.VOUCHER_NOT_FOUND, MessageUtils.getMessage("milestone.not_found")));

        UserMilestoneEntity userMilestone = userMilestoneRepository
                .findByTenantIdAndAccount_ExternalUserIdAndMilestone_Id(tenantId, userId, milestoneId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.POLICY_VIOLATION, MessageUtils.getMessage("milestone.progress_not_found")));

        if (MilestoneStatus.CLAIMED.equals(userMilestone.getStatus())) {
            log.warn("[MILESTONE-CLAIMED-ALREADY] tenantId={}, user={}, milestoneId={}",
                    tenantId, userId, milestoneId);
            throw new LoyaltyException(ErrorCode.TRANSACTION_DUPLICATE, MessageUtils.getMessage("milestone.already_claimed"));
        }

        if (userMilestone.getCurrentProgress().compareTo(milestone.getTargetValue()) < 0) {
            log.warn("[MILESTONE-NOT-COMPLETED] user={}, progress={}, target={}",
                    userId, userMilestone.getCurrentProgress(), milestone.getTargetValue());
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, MessageUtils.getMessage("milestone.not_completed"));
        }

        LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, userId);
        BigDecimal rewardPoints = milestone.getRewardPoints() != null ? milestone.getRewardPoints() : BigDecimal.ZERO;
        BigDecimal newTotalPoints = account.getCurrentPoints();

        Long effectivePartnerId = milestone.getPartnerId();

        // 1. Nếu có thưởng điểm -> cộng điểm và ghi sổ cái bất biến
        if (rewardPoints.compareTo(BigDecimal.ZERO) > 0) {
            newTotalPoints = account.getCurrentPoints().add(rewardPoints);
            account.setCurrentPoints(newTotalPoints);
            accountRepository.save(account);

            String refCode = CentralizedCodeGeneratorService.get().generateCode(
                    CodeType.MILESTONE_CLAIM,
                    Map.of("scope", milestone.getCampaignCode() + "_" + milestone.getMilestoneStep()));
            LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                    .tenantId(tenantId)
                    .account(account)
                    .pointChange(rewardPoints)
                    .balanceAfter(newTotalPoints)
                    .changeType(PointActionType.REWARD)
                    .referenceCode(refCode)
                    .partnerId(effectivePartnerId)
                    .description(MessageUtils.getMessage("milestone.reward.ledger_desc", milestone.getCampaignName()))
                    .createdAt(Instant.now())
                    .build();
            ledgerRepository.save(ledger);
        }

        // 2. Nếu có thưởng voucher -> cấp mã voucher vào ví của hội viên
        if (milestone.getRewardVoucherId() != null) {
            int validityDays = SystemParameterService.get().getInt(tenantId, SystemParamSpec.VOUCHER_DEFAULT_VALIDITY_DAYS);
            voucherRepository.findById(milestone.getRewardVoucherId()).ifPresent(voucher -> {
                String redemptionCode = CentralizedCodeGeneratorService.get().generateCode(
                        CodeType.VOUCHER_REDEMPTION_CODE,
                        Map.of("scope", "VCHR-MS"));
                LoyaltyVoucherRedemptionEntity redemption = LoyaltyVoucherRedemptionEntity.builder()
                        .tenantId(tenantId)
                        .account(account)
                        .voucher(voucher)
                        .redemptionCode(redemptionCode)
                        .pointsUsed(BigDecimal.ZERO)
                        .status(VoucherStatus.ACTIVE)
                        .expiresAt(Instant.now().plusSeconds((long) validityDays * 86400L))
                        .build();
                redemptionRepository.save(redemption);
                log.info("[MILESTONE-VOUCHER-GRANTED] tenantId={}, user={}, voucherId={}, code={}",
                        tenantId, userId, voucher.getId(), redemptionCode);
            });
        }

        // 3. Nếu có thưởng lượt quay game -> ghi nhận cấp lượt quay
        if (milestone.getRewardGameTurns() != null && milestone.getRewardGameTurns() > 0) {
            log.info("[MILESTONE-GAME-TURNS-GRANTED] tenantId={}, user={}, turns={}",
                    tenantId, userId, milestone.getRewardGameTurns());
        }

        // 4. Cập nhật trạng thái chặng mốc sang CLAIMED
        userMilestone.setStatus(MilestoneStatus.CLAIMED);
        userMilestone.setClaimedAt(Instant.now());
        userMilestoneRepository.save(userMilestone);

        log.info("[MILESTONE-CLAIM-SUCCESS] tenantId={}, user={}, campaign={}, step={}, rewardPoints={}, voucherId={}, gameTurns={}",
                tenantId, userId, milestone.getCampaignCode(), milestone.getMilestoneStep(), rewardPoints,
                milestone.getRewardVoucherId(), milestone.getRewardGameTurns());

        return ClaimRewardResponse.builder()
                .milestoneId(milestoneId)
                .campaignCode(milestone.getCampaignCode())
                .milestoneStep(milestone.getMilestoneStep())
                .rewardPoints(rewardPoints)
                .rewardVoucherId(milestone.getRewardVoucherId())
                .rewardGameTurns(milestone.getRewardGameTurns())
                .newTotalPoints(newTotalPoints)
                .message(MessageUtils.getMessage("milestone.reward.claim_success"))
                .claimedAt(Instant.now())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CampaignMilestoneEntity> getAllMilestones(String tenantId) {
        return campaignRepository.findByTenantIdOrderByCampaignCodeAscMilestoneStepAsc(tenantId);
    }

    @Transactional
    public CampaignMilestoneEntity createMilestone(String tenantId, CampaignMilestoneEntity request) {
        request.setTenantId(tenantId);
        if (request.getCampaignCode() == null || request.getCampaignCode().trim().isEmpty()) {
            request.setCampaignCode(CentralizedCodeGeneratorService.get().generateCode(CodeType.CAMPAIGN));
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
                    MessageUtils.getMessage("milestone.step_duplicate", request.getMilestoneStep(), request.getCampaignCode()));
        }

        if (request.getStartDate() == null) request.setStartDate(Instant.now());
        if (request.getEndDate() == null) request.setEndDate(Instant.now().plusSeconds(90L * 86400L));
        if (request.getStatus() == null) request.setStatus(CommonStatus.ACTIVE);
        if (request.getAudienceRole() == null || request.getAudienceRole().isBlank()) request.setAudienceRole("CUSTOMER");
        if (request.getRewardPoints() == null) request.setRewardPoints(BigDecimal.ZERO);
        if (request.getRewardGameTurns() == null) request.setRewardGameTurns(0);
        if (request.getImageUrl() != null) {
            request.setImageUrl(normalizeOptionalUrl(request.getImageUrl()));
        }

        return campaignRepository.save(request);
    }

    @Transactional
    public CampaignMilestoneEntity updateMilestone(String tenantId, Long id, CampaignMilestoneEntity request) {
        CampaignMilestoneEntity entity = campaignRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, MessageUtils.getMessage("milestone.not_found_id", id)));

        if (request.getCampaignName() != null) entity.setCampaignName(request.getCampaignName());
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getImageUrl() != null) entity.setImageUrl(normalizeOptionalUrl(request.getImageUrl()));
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
        if (request.getAudienceRole() != null && !request.getAudienceRole().isBlank()) entity.setAudienceRole(request.getAudienceRole().trim().toUpperCase());
        entity.setPartnerId(request.getPartnerId());
        entity.setUpdatedAt(Instant.now());     

        return campaignRepository.save(entity);
    }

    @Transactional
    public void deleteMilestone(String tenantId, Long id) {
        campaignRepository.findByIdAndTenantId(id, tenantId).ifPresent(campaignRepository::delete);
    }

    private String normalizeOptionalUrl(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim();
    }
}
