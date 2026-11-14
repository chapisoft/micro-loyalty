package com.natcash.loyalty.agent.service;

import com.natcash.loyalty.agent.entity.AgentLoyaltyProgramEntity;
import com.natcash.loyalty.agent.entity.AgentMonthlyKpiEntity;
import com.natcash.loyalty.agent.entity.SuperAgentNetworkKpiEntity;
import com.natcash.loyalty.agent.entity.SupportPlaybookEntity;
import com.natcash.loyalty.agent.repository.AgentLoyaltyProgramRepository;
import com.natcash.loyalty.agent.repository.AgentMonthlyKpiRepository;
import com.natcash.loyalty.agent.repository.SuperAgentNetworkKpiRepository;
import com.natcash.loyalty.agent.repository.SupportPlaybookRepository;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.AgentKpiRewardStatus;
import com.natcash.loyalty.domain.enums.AgentRoleType;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.exception.LoyaltyException;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AgentLoyaltyService {

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneOffset.UTC);

    private final AgentLoyaltyProgramRepository agentRepository;
    private final AgentMonthlyKpiRepository kpiRepository;
    private final SuperAgentNetworkKpiRepository superAgentKpiRepository;
    private final SupportPlaybookRepository playbookRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getAgentMe(String tenantId, String externalUserId, String month) {
        String kpiMonth = month != null && !month.isBlank() ? month.trim() : MONTH_FMT.format(Instant.now());
        AgentLoyaltyProgramEntity agent = agentRepository.findByTenantIdAndExternalUserId(tenantId, externalUserId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));

        AgentMonthlyKpiEntity kpi = kpiRepository.findByTenantIdAndAgentIdAndKpiMonth(tenantId, agent.getId(), kpiMonth)
                .orElseGet(() -> evaluateAgentKpi(AgentMonthlyKpiEntity.builder()
                        .tenantId(tenantId)
                        .agentId(agent.getId())
                        .kpiMonth(kpiMonth)
                        .targetCustomers(agent.getMonthlyCustomerTarget())
                        .build(), agent));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("agent", agent);
        result.put("kpiMonth", kpiMonth);
        result.put("monthlyKpi", kpi);
        result.put("playbooks", playbookRepository.findByTenantIdAndStatusOrderByIdAsc(tenantId, CommonStatus.ACTIVE));

        if (agent.getAgentRole() == AgentRoleType.SUPER_AGENT) {
            List<AgentLoyaltyProgramEntity> subAgents = agentRepository.findByTenantIdAndSuperAgentId(tenantId, agent.getId());
            SuperAgentNetworkKpiEntity networkKpi = evaluateSuperAgentNetworkKpi(tenantId, agent, subAgents, kpiMonth);
            result.put("subAgents", subAgents);
            result.put("networkKpi", networkKpi);
        }
        return result;
    }

    public AgentMonthlyKpiEntity evaluateAgentKpi(AgentMonthlyKpiEntity kpi, AgentLoyaltyProgramEntity agent) {
        String tenantId = agent.getTenantId();
        SystemParameterService paramService = SystemParameterService.get();
        int target = kpi.getTargetCustomers() != null && kpi.getTargetCustomers() > 0
                ? kpi.getTargetCustomers()
                : paramService.getInt(tenantId, SystemParamSpec.AGENT_MONTHLY_NEW_CUSTOMER_TARGET);
        int qualified = kpi.getQualifiedCustomers() != null ? kpi.getQualifiedCustomers() : 0;
        boolean eligible = qualified >= target;
        kpi.setTargetCustomers(target);
        kpi.setRewardEligible(eligible);
        if (eligible) {
            kpi.setRewardStatus(AgentKpiRewardStatus.ELIGIBLE);
            kpi.setRewardAmount(agent.getRewardAmountHtg() != null
                    ? agent.getRewardAmountHtg()
                    : paramService.getDecimal(tenantId, SystemParamSpec.AGENT_REWARD_HTG));
        } else {
            kpi.setRewardStatus(AgentKpiRewardStatus.IN_PROGRESS);
            kpi.setRewardAmount(BigDecimal.ZERO);
        }
        return kpi;
    }

    public SuperAgentNetworkKpiEntity evaluateSuperAgentNetworkKpi(
            String tenantId,
            AgentLoyaltyProgramEntity superAgent,
            List<AgentLoyaltyProgramEntity> subAgents,
            String kpiMonth) {
        SystemParameterService paramService = SystemParameterService.get();
        int totalSub = subAgents != null ? subAgents.size() : 0;
        int qualifiedSub = 0;
        if (subAgents != null) {
            for (AgentLoyaltyProgramEntity sub : subAgents) {
                boolean subEligible = kpiRepository
                        .findByTenantIdAndAgentIdAndKpiMonth(tenantId, sub.getId(), kpiMonth)
                        .map(k -> Boolean.TRUE.equals(k.getRewardEligible()))
                        .orElse(false);
                if (subEligible) {
                    qualifiedSub++;
                }
            }
        }

        final int finalQualifiedSub = qualifiedSub;
        BigDecimal ratePct = totalSub > 0
                ? BigDecimal.valueOf(finalQualifiedSub * 100.0 / totalSub).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal minReq = paramService.getDecimal(tenantId, SystemParamSpec.AGENT_SUPER_MIN_ACHIEVEMENT_PCT);
        BigDecimal superReward = paramService.getDecimal(tenantId, SystemParamSpec.AGENT_SUPER_REWARD_HTG);
        boolean eligible = totalSub > 0 && ratePct.compareTo(minReq) >= 0;

        return superAgentKpiRepository
                .findByTenantIdAndSuperAgentIdAndKpiMonth(tenantId, superAgent.getId(), kpiMonth)
                .map(existing -> {
                    existing.setTotalSubAgents(totalSub);
                    existing.setQualifiedSubAgents(finalQualifiedSub);
                    existing.setAchievementRatePct(ratePct);
                    existing.setRewardStatus(eligible ? AgentKpiRewardStatus.ELIGIBLE : AgentKpiRewardStatus.IN_PROGRESS);
                    existing.setRewardAmount(eligible ? superReward : BigDecimal.ZERO);
                    return existing;
                })
                .orElseGet(() -> SuperAgentNetworkKpiEntity.builder()
                        .tenantId(tenantId)
                        .superAgentId(superAgent.getId())
                        .kpiMonth(kpiMonth)
                        .totalSubAgents(totalSub)
                        .qualifiedSubAgents(finalQualifiedSub)
                        .achievementRatePct(ratePct)
                        .minRateRequiredPct(minReq)
                        .rewardAmount(eligible ? superReward : BigDecimal.ZERO)
                        .rewardStatus(eligible ? AgentKpiRewardStatus.ELIGIBLE : AgentKpiRewardStatus.IN_PROGRESS)
                        .build());
    }

    @Transactional(readOnly = true)
    public List<AgentLoyaltyProgramEntity> listAgents(String tenantId) {
        return agentRepository.findByTenantIdOrderByIdDesc(tenantId);
    }

    @Transactional
    public AgentLoyaltyProgramEntity saveAgent(String tenantId, AgentLoyaltyProgramEntity request) {
        SystemParameterService paramService = SystemParameterService.get();
        AgentLoyaltyProgramEntity entity = agentRepository
                .findByTenantIdAndAgentCode(tenantId, request.getAgentCode())
                .orElseGet(() -> AgentLoyaltyProgramEntity.builder()
                        .tenantId(tenantId)
                        .agentCode(request.getAgentCode())
                        .build());
        entity.setExternalUserId(request.getExternalUserId());
        entity.setFullName(request.getFullName());
        entity.setPhoneNumber(request.getPhoneNumber());
        entity.setAgentRole(request.getAgentRole() != null ? request.getAgentRole() : AgentRoleType.AGENT);
        entity.setSuperAgentId(request.getSuperAgentId());
        entity.setProvince(request.getProvince());
        entity.setMonthlyCustomerTarget(request.getMonthlyCustomerTarget() != null
                ? request.getMonthlyCustomerTarget()
                : paramService.getInt(tenantId, SystemParamSpec.AGENT_MONTHLY_NEW_CUSTOMER_TARGET));
        entity.setRewardAmountHtg(request.getRewardAmountHtg() != null
                ? request.getRewardAmountHtg()
                : paramService.getDecimal(tenantId,
                        entity.getAgentRole() == AgentRoleType.SUPER_AGENT
                                ? SystemParamSpec.AGENT_SUPER_REWARD_HTG
                                : SystemParamSpec.AGENT_REWARD_HTG));
        entity.setStatus(request.getStatus() != null ? request.getStatus() : CommonStatus.ACTIVE);
        return agentRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<AgentMonthlyKpiEntity> listMonthlyTargets(String tenantId, String kpiMonth) {
        String month = kpiMonth != null && !kpiMonth.isBlank() ? kpiMonth.trim() : MONTH_FMT.format(Instant.now());
        return kpiRepository.findByTenantIdAndKpiMonthOrderByQualifiedCustomersDesc(tenantId, month);
    }

    @Transactional
    public AgentMonthlyKpiEntity saveMonthlyTarget(String tenantId, AgentMonthlyKpiEntity request) {
        AgentLoyaltyProgramEntity agent = agentRepository.findById(request.getAgentId())
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        String month = request.getKpiMonth() != null && !request.getKpiMonth().isBlank()
                ? request.getKpiMonth().trim()
                : MONTH_FMT.format(Instant.now());
        AgentMonthlyKpiEntity entity = kpiRepository
                .findByTenantIdAndAgentIdAndKpiMonth(tenantId, agent.getId(), month)
                .orElseGet(() -> AgentMonthlyKpiEntity.builder()
                        .tenantId(tenantId)
                        .agentId(agent.getId())
                        .kpiMonth(month)
                        .build());
        entity.setEkycCount(request.getEkycCount() != null ? request.getEkycCount() : 0);
        entity.setFirstTxCount(request.getFirstTxCount() != null ? request.getFirstTxCount() : 0);
        entity.setQualifiedCustomers(request.getQualifiedCustomers() != null ? request.getQualifiedCustomers() : 0);
        entity.setTargetCustomers(request.getTargetCustomers() != null
                ? request.getTargetCustomers()
                : agent.getMonthlyCustomerTarget());
        evaluateAgentKpi(entity, agent);
        return kpiRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<SupportPlaybookEntity> listPlaybooks(String tenantId) {
        return playbookRepository.findByTenantIdAndStatusOrderByIdAsc(tenantId, CommonStatus.ACTIVE);
    }

    @Transactional
    public SupportPlaybookEntity savePlaybook(String tenantId, SupportPlaybookEntity request) {
        SupportPlaybookEntity entity = playbookRepository
                .findByTenantIdAndPlaybookCode(tenantId, request.getPlaybookCode())
                .orElseGet(() -> SupportPlaybookEntity.builder()
                        .tenantId(tenantId)
                        .playbookCode(request.getPlaybookCode())
                        .build());
        entity.setTitle(request.getTitle());
        entity.setCategory(request.getCategory());
        entity.setStepsJson(request.getStepsJson() != null ? request.getStepsJson() : "[]");
        entity.setLocale(request.getLocale());
        entity.setStatus(request.getStatus() != null ? request.getStatus() : CommonStatus.ACTIVE);
        return playbookRepository.save(entity);
    }

    @Transactional
    public AgentMonthlyKpiEntity approveAgentReward(String tenantId, String agentCodeOrId, String month) {
        AgentLoyaltyProgramEntity agent = agentRepository
                .findByTenantIdAndAgentCode(tenantId, agentCodeOrId)
                .orElseGet(() -> {
                    try {
                        Long id = Long.parseLong(agentCodeOrId);
                        return agentRepository.findById(id)
                                .filter(a -> tenantId.equals(a.getTenantId()))
                                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
                    } catch (NumberFormatException ex) {
                        throw new LoyaltyException(ErrorCode.NOT_FOUND);
                    }
                });
        String targetMonth = month != null && !month.isBlank()
                ? month.trim()
                : MONTH_FMT.format(Instant.now());
        AgentMonthlyKpiEntity kpi = kpiRepository
                .findByTenantIdAndAgentIdAndKpiMonth(tenantId, agent.getId(), targetMonth)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        kpi.setRewardEligible(Boolean.TRUE);
        kpi.setRewardStatus(AgentKpiRewardStatus.APPROVED);
        return kpiRepository.save(kpi);
    }
}
