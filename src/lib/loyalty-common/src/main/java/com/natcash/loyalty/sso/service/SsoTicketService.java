package com.natcash.loyalty.sso.service;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileRequest;
import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.agent.entity.AgentLoyaltyProgramEntity;
import com.natcash.loyalty.agent.repository.AgentLoyaltyProgramRepository;
import com.natcash.loyalty.campaign.entity.CampaignMilestoneEntity;
import com.natcash.loyalty.campaign.entity.UserMilestoneEntity;
import com.natcash.loyalty.campaign.repository.CampaignMilestoneRepository;
import com.natcash.loyalty.campaign.repository.UserMilestoneRepository;
import com.natcash.loyalty.config.LoyaltyProperties;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.constant.SecurityConstants;
import com.natcash.loyalty.domain.enums.BucketStatus;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.CustomerSegmentCode;
import com.natcash.loyalty.domain.enums.MilestoneStatus;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.engagement.entity.CustomerSegmentEntity;
import com.natcash.loyalty.engagement.entity.CustomerSegmentMemberEntity;
import com.natcash.loyalty.engagement.repository.CustomerSegmentMemberRepository;
import com.natcash.loyalty.engagement.repository.CustomerSegmentRepository;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.integration.service.TenantIntegrationService;
import com.natcash.loyalty.ledger.entity.PointExpirationBucketEntity;
import com.natcash.loyalty.ledger.repository.PointExpirationBucketRepository;
import com.natcash.loyalty.security.JwtTokenUtils;
import com.natcash.loyalty.security.SignatureUtils;
import com.natcash.loyalty.sso.dto.SsoDto.ApplicablePolicyDto;
import com.natcash.loyalty.sso.dto.SsoDto.RecommendedMissionDto;
import com.natcash.loyalty.sso.dto.SsoDto.RecommendedVoucherDto;
import com.natcash.loyalty.sso.dto.SsoDto.SsoExchangeRequest;
import com.natcash.loyalty.sso.dto.SsoDto.SsoExchangeResponse;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketPayload;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketRequest;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketResponse;
import com.natcash.loyalty.sso.dto.SsoDto.TenantAccountSummary;
import com.natcash.loyalty.sso.dto.SsoDto.TenantUserAuthRequest;
import com.natcash.loyalty.sso.dto.SsoDto.TenantUserContextResponse;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.util.MessageUtils;
import com.natcash.loyalty.wallet.entity.LoyaltyAcceptancePolicyEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;
import com.natcash.loyalty.wallet.repository.LoyaltyAcceptancePolicyRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRepository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lib.ims.redis.service.RedisService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SsoTicketService {

    private static final Logger log = LoggerFactory.getLogger(SsoTicketService.class);
    public static final String AUTH_METHOD_HMAC_ASSERTION = "HMAC_ASSERTION";
    private static final String AUTH_METHOD_OTP_PIN = "OTP_PIN";
    private static final String AUTH_METHOD_SSO_SWITCH = "SSO_SWITCH";
    private static final String AUTH_METHOD_TENANT_TOKEN = "TENANT_TOKEN";
    private static final String AUTH_METHOD_NATIVE_BRIDGE = "NATIVE_BRIDGE";
    private static final int MIN_VERIFY_CODE_LENGTH = 4;
    private static final int MAX_RECOMMENDED_VOUCHERS = 8;
    private static final int MAX_RECOMMENDED_MISSIONS = 6;

    private final RedisService redisService;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private AccountService accountService;
    @Autowired(required = false)
    private LoyaltyAccountRepository accountRepository;
    @Autowired(required = false)
    private AgentLoyaltyProgramRepository agentRepository;
    @Autowired(required = false)
    private PointExpirationBucketRepository bucketRepository;
    @Autowired(required = false)
    private CustomerSegmentRepository segmentRepository;
    @Autowired(required = false)
    private CustomerSegmentMemberRepository segmentMemberRepository;
    @Autowired(required = false)
    private LoyaltyAcceptancePolicyRepository policyRepository;
    @Autowired(required = false)
    private LoyaltyVoucherRepository voucherRepository;
    @Autowired(required = false)
    private LoyaltyPartnerRepository partnerRepository;
    @Autowired(required = false)
    private CampaignMilestoneRepository milestoneRepository;
    @Autowired(required = false)
    private UserMilestoneRepository userMilestoneRepository;
    @Autowired(required = false)
    private TenantIntegrationService tenantIntegrationService;

    @Autowired
    public SsoTicketService(RedisService redisService, ObjectMapper objectMapper) {
        this.redisService = redisService;
        this.objectMapper = objectMapper;
    }

    public SsoTicketService(
            RedisService redisService,
            ObjectMapper objectMapper,
            AccountService accountService,
            LoyaltyAccountRepository accountRepository,
            AgentLoyaltyProgramRepository agentRepository,
            PointExpirationBucketRepository bucketRepository,
            CustomerSegmentRepository segmentRepository,
            CustomerSegmentMemberRepository segmentMemberRepository,
            LoyaltyAcceptancePolicyRepository policyRepository,
            LoyaltyVoucherRepository voucherRepository,
            LoyaltyPartnerRepository partnerRepository,
            CampaignMilestoneRepository milestoneRepository,
            UserMilestoneRepository userMilestoneRepository) {
        this(redisService, objectMapper, accountService, accountRepository, agentRepository,
                bucketRepository, segmentRepository, segmentMemberRepository, policyRepository,
                voucherRepository, partnerRepository, milestoneRepository, userMilestoneRepository, null);
    }

    public SsoTicketService(
            RedisService redisService,
            ObjectMapper objectMapper,
            AccountService accountService,
            LoyaltyAccountRepository accountRepository,
            AgentLoyaltyProgramRepository agentRepository,
            PointExpirationBucketRepository bucketRepository,
            CustomerSegmentRepository segmentRepository,
            CustomerSegmentMemberRepository segmentMemberRepository,
            LoyaltyAcceptancePolicyRepository policyRepository,
            LoyaltyVoucherRepository voucherRepository,
            LoyaltyPartnerRepository partnerRepository,
            CampaignMilestoneRepository milestoneRepository,
            UserMilestoneRepository userMilestoneRepository,
            TenantIntegrationService tenantIntegrationService) {
        this.redisService = redisService;
        this.objectMapper = objectMapper;
        this.accountService = accountService;
        this.accountRepository = accountRepository;
        this.agentRepository = agentRepository;
        this.bucketRepository = bucketRepository;
        this.segmentRepository = segmentRepository;
        this.segmentMemberRepository = segmentMemberRepository;
        this.policyRepository = policyRepository;
        this.voucherRepository = voucherRepository;
        this.partnerRepository = partnerRepository;
        this.milestoneRepository = milestoneRepository;
        this.userMilestoneRepository = userMilestoneRepository;
        this.tenantIntegrationService = tenantIntegrationService;
    }

    public SsoTicketResponse generateTicket(String tenantId, SsoTicketRequest request) {
        return generateTicket(tenantId, request, null, null, null);
    }

    public SsoTicketResponse generateTicket(
            String tenantId,
            SsoTicketRequest request,
            String headerApiKey,
            String headerTimestamp,
            String headerSignature) {
        String effectiveTenant = resolveEffectiveTenant(tenantId, null);
        verifyTicketIssuanceSecurity(effectiveTenant, request, headerApiKey, headerTimestamp, headerSignature);

        String ticket = UUID.randomUUID().toString().replace("-", "");
        String redisKey = RedisKeys.SESSION_TICKET_PREFIX + ticket;

        SsoTicketPayload payload = SsoTicketPayload.builder()
                .tenantId(effectiveTenant)
                .partnerCode(request.getPartnerCode())
                .externalUserId(request.getExternalUserId())
                .username(request.getUsername())
                .phoneNumber(request.getPhoneNumber())
                .fullName(request.getFullName())
                .accountRole(request.getAccountRole())
                .ekycVerified(request.getEkycVerified())
                .permissions(request.getPermissions())
                .createdAt(System.currentTimeMillis())
                .build();

        try {
            long ticketTtlSeconds = SystemParameterService.get().getLong(effectiveTenant,
                    SystemParamSpec.SESSION_TICKET_TTL_SECONDS);
            String payloadJson = objectMapper.writeValueAsString(payload);
            redisService.set(redisKey, payloadJson, Duration.ofSeconds(ticketTtlSeconds));
            log.info("[SSO-TICKET-GENERATED] ticket={}, tenantId={}, partner={}, user={}",
                    ticket, effectiveTenant, request.getPartnerCode(), request.getExternalUserId());

            return SsoTicketResponse.builder()
                    .sessionTicket(ticket)
                    .expiresInSeconds(ticketTtlSeconds)
                    .webviewLaunchUrl("/?ticket=" + ticket + "&tenantId=" + effectiveTenant)
                    .build();
        } catch (LoyaltyException e) {
            throw e;
        } catch (Exception e) {
            log.error("[SSO-TICKET-GEN-ERROR] tenantId={}, user={}, error={}",
                    effectiveTenant, request.getExternalUserId(), e.getMessage(), e);
            throw new LoyaltyException(ErrorCode.SYSTEM_ERROR, MessageUtils.getMessage("sso.ticket.gen_failed"));
        }
    }

    @Transactional
    public SsoExchangeResponse exchangeToken(SsoExchangeRequest request) {
        String ticket = request.getSessionTicket();
        String redisKey = RedisKeys.SESSION_TICKET_PREFIX + ticket;

        // Xóa vé nguyên tử ngay khi lấy ra để chống tấn công phát lại (Replay Attack)
        String payloadJson = redisService.getAndDelete(redisKey);
        if (payloadJson == null || payloadJson.isEmpty()) {
            log.warn("[SSO-EXCHANGE-FAILED] ticket={} - Vé không hợp lệ hoặc đã hết hạn", ticket);
            throw new LoyaltyException(ErrorCode.API_KEY_INVALID,
                    MessageUtils.getMessage("sso.ticket.invalid_or_used"));
        }

        try {
            SsoTicketPayload payload = objectMapper.readValue(payloadJson, SsoTicketPayload.class);
            String tenantId = resolveEffectiveTenant(payload.getTenantId(), null);
            String externalUserId = payload.getExternalUserId();
            String fullName = firstNonBlank(payload.getFullName(), payload.getUsername());
            String phoneNumber = firstNonBlank(payload.getPhoneNumber(), externalUserId);

            ProfileResponse profile = null;
            if (accountService != null) {
                profile = syncTenantAccountProfile(tenantId, externalUserId, phoneNumber, fullName);
                fullName = firstNonBlank(profile.getFullName(), fullName);
                phoneNumber = firstNonBlank(profile.getPhoneNumber(), phoneNumber);
            }

            String accountRole = resolveAccountRole(tenantId, externalUserId, payload.getAccountRole());
            long accessTtlSeconds = SystemParameterService.get().getLong(
                    tenantId, SystemParamSpec.SESSION_ACCESS_TOKEN_TTL_SECONDS);
            String jwtToken = signTenantUserJwt(
                    tenantId, externalUserId, fullName, phoneNumber,
                    payload.getPartnerCode(), accountRole, accessTtlSeconds);

            TenantUserContextResponse userContext = (profile != null)
                    ? buildUserContext(tenantId, profile, accountRole, jwtToken, accessTtlSeconds)
                    : null;

            log.info("[SSO-EXCHANGE-SUCCESS] ticket={}, tenantId={}, user={}, role={}",
                    ticket, tenantId, externalUserId, accountRole);

            return SsoExchangeResponse.builder()
                    .accessToken(jwtToken)
                    .tokenType("Bearer")
                    .expiresInSeconds(accessTtlSeconds)
                    .tenantId(tenantId)
                    .externalUserId(externalUserId)
                    .fullName(fullName)
                    .phoneNumber(phoneNumber)
                    .accountRole(accountRole)
                    .userContext(userContext)
                    .build();
        } catch (LoyaltyException e) {
            throw e;
        } catch (Exception e) {
            log.error("[SSO-EXCHANGE-ERROR] ticket={}, error={}", ticket, e.getMessage(), e);
            throw new LoyaltyException(ErrorCode.SYSTEM_ERROR, MessageUtils.getMessage("sso.token.exchange_failed"));
        }
    }

    /**
     * Xác thực trực tiếp tài khoản User của một Tenant (Natcash / Delimart / Micro-CRM),
     * đồng bộ hồ sơ sang loyalty_accounts và trả về JWT kèm ngữ cảnh cá nhân hóa 360 độ.
     */
    @Transactional
    public TenantUserContextResponse authenticateTenantUser(String headerTenantId, TenantUserAuthRequest request) {
        if (request == null) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, MessageUtils.getMessage("validation.external_user_id.not_blank"));
        }
        String tenantId = resolveEffectiveTenant(request.getTenantId(), headerTenantId);
        String candidateId = firstNonBlank(request.getExternalUserId(), request.getPhoneNumber());
        if (candidateId == null) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, MessageUtils.getMessage("validation.external_user_id.not_blank"));
        }

        String authMethod = request.getAuthMethod() != null && !request.getAuthMethod().isBlank()
                ? request.getAuthMethod().trim().toUpperCase()
                : AUTH_METHOD_OTP_PIN;

        LoyaltyAccountEntity existingAccount = findAccountByIdentifier(tenantId, candidateId, request.getPhoneNumber());
        AgentLoyaltyProgramEntity existingAgent = agentRepository != null
                ? agentRepository.findByTenantIdAndExternalUserId(tenantId, candidateId).orElse(null)
                : null;

        if (AUTH_METHOD_SSO_SWITCH.equals(authMethod)) {
            if (existingAccount == null && existingAgent == null) {
                throw new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND, MessageUtils.getMessage("account.not_found"));
            }
        } else if (AUTH_METHOD_HMAC_ASSERTION.equals(authMethod)) {
            verifyUserHmacAssertion(
                    tenantId,
                    candidateId,
                    request.getPartnerCode(),
                    request.getTimestamp(),
                    firstNonBlank(request.getSignature(), request.getVerifyCode()));
        } else if (AUTH_METHOD_TENANT_TOKEN.equals(authMethod) || AUTH_METHOD_NATIVE_BRIDGE.equals(authMethod)) {
            boolean hasCryptoAssertion = (request.getSignature() != null && !request.getSignature().isBlank())
                    || request.getTimestamp() != null;
            if (hasCryptoAssertion) {
                verifyUserHmacAssertion(
                        tenantId,
                        candidateId,
                        request.getPartnerCode(),
                        request.getTimestamp(),
                        firstNonBlank(request.getSignature(), request.getVerifyCode()));
            } else if (request.getVerifyCode() == null || request.getVerifyCode().isBlank()) {
                throw new LoyaltyException(ErrorCode.UNAUTHORIZED, MessageUtils.getMessage("sso.auth.verify_code_required"));
            }
            if (tenantIntegrationService != null
                    && !tenantIntegrationService.verifyTenantUserIdentity(
                            tenantId, candidateId, request.getVerifyCode(), request.getTimestamp(), request.getSignature())) {
                throw new LoyaltyException(ErrorCode.UNAUTHORIZED, MessageUtils.getMessage("error.unauthorized"));
            }
        } else {
            String code = request.getVerifyCode() != null ? request.getVerifyCode().trim() : "";
            if (code.length() < MIN_VERIFY_CODE_LENGTH) {
                throw new LoyaltyException(ErrorCode.UNAUTHORIZED, MessageUtils.getMessage("sso.auth.invalid_verify_code"));
            }
        }

        if (existingAccount != null && existingAccount.getStatus() != CommonStatus.ACTIVE) {
            throw new LoyaltyException(ErrorCode.UNAUTHORIZED, MessageUtils.getMessage("auth.error.account_inactive"));
        }
        if (existingAgent != null && existingAgent.getStatus() != CommonStatus.ACTIVE) {
            throw new LoyaltyException(ErrorCode.UNAUTHORIZED, MessageUtils.getMessage("auth.error.account_inactive"));
        }

        String resolvedExternalUserId = existingAccount != null
                ? existingAccount.getExternalUserId()
                : (existingAgent != null ? existingAgent.getExternalUserId() : candidateId);
        String resolvedPhone = firstNonBlank(
                request.getPhoneNumber(),
                existingAccount != null ? existingAccount.getPhoneNumber() : null,
                existingAgent != null ? existingAgent.getPhoneNumber() : null,
                resolvedExternalUserId);
        String resolvedFullName = firstNonBlank(
                request.getFullName(),
                existingAccount != null ? existingAccount.getFullName() : null,
                existingAgent != null ? existingAgent.getFullName() : null);

        ProfileResponse profile = accountService != null
                ? syncTenantAccountProfile(tenantId, resolvedExternalUserId, resolvedPhone, resolvedFullName)
                : ProfileResponse.builder()
                        .tenantId(tenantId)
                        .externalUserId(resolvedExternalUserId)
                        .phoneNumber(resolvedPhone)
                        .fullName(resolvedFullName)
                        .currentPoints(BigDecimal.ZERO)
                        .tierPoints(BigDecimal.ZERO)
                        .status(CommonStatus.ACTIVE)
                        .build();

        String accountRole = resolveAccountRole(tenantId, resolvedExternalUserId, request.getAccountRole());
        long accessTtlSeconds = SystemParameterService.get().getLong(
                tenantId, SystemParamSpec.SESSION_ACCESS_TOKEN_TTL_SECONDS);
        String jwtToken = signTenantUserJwt(
                tenantId,
                resolvedExternalUserId,
                firstNonBlank(profile.getFullName(), resolvedFullName),
                firstNonBlank(profile.getPhoneNumber(), resolvedPhone),
                request.getPartnerCode(),
                accountRole,
                accessTtlSeconds);

        log.info("[SSO-TENANT-AUTH-SUCCESS] tenantId={}, user={}, role={}, method={}",
                tenantId, resolvedExternalUserId, accountRole, authMethod);

        return buildUserContext(tenantId, profile, accountRole, jwtToken, accessTtlSeconds);
    }

    /**
     * Lấy ngữ cảnh cá nhân hóa 360° (Hồ sơ điểm/coin, Hạng, Phân khúc, Chính sách & Đề xuất ưu đãi)
     * cho tài khoản đã định danh của Tenant.
     */
    @Transactional
    public TenantUserContextResponse getUserContext(String tenantId, String externalUserId, String existingToken) {
        String effectiveTenant = resolveEffectiveTenant(tenantId, null);
        if (externalUserId == null || externalUserId.isBlank()) {
            throw new LoyaltyException(ErrorCode.UNAUTHORIZED, MessageUtils.getMessage("auth.error.unauthenticated"));
        }
        String trimmedUserId = externalUserId.trim();

        LoyaltyAccountEntity existingAccount = accountRepository != null
                ? accountRepository.findByTenantIdAndExternalUserId(effectiveTenant, trimmedUserId).orElse(null)
                : null;
        if (existingAccount != null && existingAccount.getStatus() != CommonStatus.ACTIVE) {
            throw new LoyaltyException(ErrorCode.UNAUTHORIZED, MessageUtils.getMessage("auth.error.account_inactive"));
        }

        ProfileResponse profile = accountService != null
                ? accountService.getOrCreateProfile(effectiveTenant, ProfileRequest.builder()
                        .externalUserId(trimmedUserId)
                        .build())
                : ProfileResponse.builder()
                        .tenantId(effectiveTenant)
                        .externalUserId(trimmedUserId)
                        .currentPoints(BigDecimal.ZERO)
                        .tierPoints(BigDecimal.ZERO)
                        .status(CommonStatus.ACTIVE)
                        .build();

        String accountRole = resolveAccountRole(effectiveTenant, trimmedUserId, null);
        long accessTtlSeconds = SystemParameterService.get().getLong(
                effectiveTenant, SystemParamSpec.SESSION_ACCESS_TOKEN_TTL_SECONDS);
        String token = (existingToken != null && !existingToken.isBlank())
                ? existingToken
                : signTenantUserJwt(effectiveTenant, trimmedUserId, profile.getFullName(), profile.getPhoneNumber(),
                        null, accountRole, accessTtlSeconds);

        return buildUserContext(effectiveTenant, profile, accountRole, token, accessTtlSeconds);
    }

    /**
     * Liệt kê danh sách tài khoản hội viên & đại lý hiện có của Tenant để hỗ trợ định danh/chuyển đổi tài khoản trên Webview.
     */
    @Transactional(readOnly = true)
    public List<TenantAccountSummary> listTenantAccounts(String tenantId) {
        String effectiveTenant = resolveEffectiveTenant(tenantId, null);
        Map<String, AgentLoyaltyProgramEntity> agentByUser = new LinkedHashMap<>();
        if (agentRepository != null) {
            for (AgentLoyaltyProgramEntity agent : agentRepository.findByTenantIdOrderByIdDesc(effectiveTenant)) {
                if (agent.getExternalUserId() != null) {
                    agentByUser.putIfAbsent(agent.getExternalUserId(), agent);
                }
            }
        }

        Map<CustomerSegmentCode, CustomerSegmentEntity> segmentDefMap = new HashMap<>();
        if (segmentRepository != null) {
            for (CustomerSegmentEntity seg : segmentRepository.findByTenantIdOrderByIdAsc(effectiveTenant)) {
                if (seg.getSegmentCode() != null) {
                    segmentDefMap.put(seg.getSegmentCode(), seg);
                }
            }
        }

        Map<String, CustomerSegmentCode> userSegmentMap = new HashMap<>();
        if (segmentMemberRepository != null) {
            for (CustomerSegmentMemberEntity member : segmentMemberRepository.findByTenantId(effectiveTenant)) {
                if (member.getExternalUserId() != null && member.getSegmentCode() != null) {
                    userSegmentMap.putIfAbsent(member.getExternalUserId(), member.getSegmentCode());
                }
            }
        }

        Map<String, TenantAccountSummary> summaries = new LinkedHashMap<>();
        if (accountRepository != null) {
            for (LoyaltyAccountEntity acc : accountRepository.findByTenantId(effectiveTenant)) {
                if (acc.getStatus() != CommonStatus.ACTIVE) {
                    continue;
                }
                AgentLoyaltyProgramEntity agent = agentByUser.get(acc.getExternalUserId());
                String role = agent != null && agent.getAgentRole() != null
                        ? agent.getAgentRole().name()
                        : SecurityConstants.ACCOUNT_ROLE_CUSTOMER;
                CustomerSegmentCode segCode = userSegmentMap.getOrDefault(acc.getExternalUserId(), CustomerSegmentCode.GENERAL);
                CustomerSegmentEntity segEntity = segmentDefMap.get(segCode);

                summaries.put(acc.getExternalUserId(), TenantAccountSummary.builder()
                        .tenantId(effectiveTenant)
                        .externalUserId(acc.getExternalUserId())
                        .phoneNumber(acc.getPhoneNumber())
                        .fullName(firstNonBlank(acc.getFullName(), agent != null ? agent.getFullName() : null, acc.getExternalUserId()))
                        .accountRole(role)
                        .tierCode(acc.getTier() != null && acc.getTier().getCode() != null ? acc.getTier().getCode().name() : "SILVER")
                        .tierName(acc.getTier() != null ? acc.getTier().getName() : "Silver")
                        .currentPoints(acc.getCurrentPoints() != null ? acc.getCurrentPoints() : BigDecimal.ZERO)
                        .tierPoints(acc.getTierPoints() != null ? acc.getTierPoints() : BigDecimal.ZERO)
                        .segmentCode(segCode.name())
                        .segmentName(segEntity != null ? segEntity.getSegmentName() : segCode.name())
                        .status(acc.getStatus().name())
                        .build());
            }
        }

        for (AgentLoyaltyProgramEntity agent : agentByUser.values()) {
            if (agent.getStatus() != CommonStatus.ACTIVE || summaries.containsKey(agent.getExternalUserId())) {
                continue;
            }
            String role = agent.getAgentRole() != null ? agent.getAgentRole().name() : SecurityConstants.ACCOUNT_ROLE_AGENT;
            summaries.put(agent.getExternalUserId(), TenantAccountSummary.builder()
                    .tenantId(effectiveTenant)
                    .externalUserId(agent.getExternalUserId())
                    .phoneNumber(agent.getPhoneNumber())
                    .fullName(firstNonBlank(agent.getFullName(), agent.getAgentCode()))
                    .accountRole(role)
                    .tierCode("SILVER")
                    .tierName("Silver")
                    .currentPoints(BigDecimal.ZERO)
                    .tierPoints(BigDecimal.ZERO)
                    .segmentCode(CustomerSegmentCode.GENERAL.name())
                    .segmentName(role)
                    .status(agent.getStatus().name())
                    .build());
        }

        return new ArrayList<>(summaries.values());
    }

    private TenantUserContextResponse buildUserContext(
            String tenantId,
            ProfileResponse profile,
            String accountRole,
            String accessToken,
            long expiresInSeconds) {
        String externalUserId = profile.getExternalUserId();
        BigDecimal expiringPoints = BigDecimal.ZERO;
        Instant nearestExpiryDate = null;

        if (bucketRepository != null && profile.getAccountId() != null) {
            List<PointExpirationBucketEntity> buckets = bucketRepository
                    .findByTenantIdAndAccountIdAndStatusOrderByExpiredAtAsc(
                            tenantId, profile.getAccountId(), BucketStatus.ACTIVE);
            if (buckets != null) {
                for (PointExpirationBucketEntity b : buckets) {
                    if (b.getRemainingPoints() != null && b.getRemainingPoints().compareTo(BigDecimal.ZERO) > 0) {
                        expiringPoints = expiringPoints.add(b.getRemainingPoints());
                        if (nearestExpiryDate == null && b.getExpiredAt() != null) {
                            nearestExpiryDate = b.getExpiredAt();
                        }
                    }
                }
            }
        }

        BigDecimal pinLimit = SystemParameterService.get().getDecimal(tenantId, SystemParamSpec.PAY_AT_COUNTER_PIN_LIMIT_HTG);
        CustomerSegmentEntity segment = resolveCustomerSegment(tenantId, externalUserId);
        Map<String, Object> bannerConfig = parseJsonMap(segment != null ? segment.getBannerConfig() : null);

        List<ApplicablePolicyDto> applicablePolicies = buildApplicablePolicies(tenantId, profile, pinLimit);
        List<RecommendedVoucherDto> recommendedVouchers = buildRecommendedVouchers(tenantId, profile, accountRole);
        List<RecommendedMissionDto> recommendedMissions = buildRecommendedMissions(tenantId, externalUserId, accountRole);

        String ctaModule = bannerConfig.get("highlightModule") != null
                ? String.valueOf(bannerConfig.get("highlightModule")).trim().toUpperCase()
                : "";
        String ctaTarget = mapHighlightModuleToRoute(ctaModule);
        String ctaLabel = bannerConfig.get("cta") != null ? String.valueOf(bannerConfig.get("cta")) : null;

        return TenantUserContextResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresInSeconds(expiresInSeconds)
                .tenantId(tenantId)
                .externalUserId(externalUserId)
                .phoneNumber(profile.getPhoneNumber())
                .fullName(profile.getFullName())
                .accountRole(accountRole)
                .expiringPoints(expiringPoints)
                .nearestExpiryDate(nearestExpiryDate)
                .payAtCounterPinLimitHtg(pinLimit)
                .profile(profile)
                .segmentCode(segment != null && segment.getSegmentCode() != null ? segment.getSegmentCode().name() : CustomerSegmentCode.GENERAL.name())
                .segmentName(segment != null ? segment.getSegmentName() : null)
                .segmentHeadline(segment != null ? segment.getSegmentName() : null)
                .segmentSubheadline(segment != null ? segment.getDescription() : null)
                .segmentCtaLabel(ctaLabel)
                .segmentCtaTarget(ctaTarget)
                .applicablePolicies(applicablePolicies)
                .recommendedVouchers(recommendedVouchers)
                .recommendedMissions(recommendedMissions)
                .build();
    }

    private ProfileResponse syncTenantAccountProfile(
            String tenantId, String externalUserId, String phoneNumber, String fullName) {
        LoyaltyAccountEntity existing = accountRepository != null
                ? accountRepository.findByTenantIdAndExternalUserId(tenantId, externalUserId).orElse(null)
                : null;
        String effectivePhone = existing != null
                ? firstNonBlank(existing.getPhoneNumber(), phoneNumber)
                : phoneNumber;
        String effectiveName = existing != null
                ? firstNonBlank(existing.getFullName(), fullName)
                : fullName;

        return accountService.getOrCreateProfile(tenantId, ProfileRequest.builder()
                .externalUserId(externalUserId)
                .phoneNumber(effectivePhone)
                .fullName(effectiveName)
                .build());
    }

    private LoyaltyAccountEntity findAccountByIdentifier(String tenantId, String candidateId, String phoneNumber) {
        if (accountRepository == null) {
            return null;
        }
        Optional<LoyaltyAccountEntity> byExternalId = accountRepository.findByTenantIdAndExternalUserId(tenantId, candidateId);
        if (byExternalId.isPresent()) {
            return byExternalId.get();
        }
        String phoneLookup = firstNonBlank(phoneNumber, candidateId);
        if (phoneLookup != null) {
            return accountRepository.findByTenantIdAndPhoneNumber(tenantId, phoneLookup).orElse(null);
        }
        return null;
    }

    private String resolveAccountRole(String tenantId, String externalUserId, String requestedRole) {
        if (agentRepository != null && externalUserId != null && !externalUserId.isBlank()) {
            Optional<AgentLoyaltyProgramEntity> agentOpt = agentRepository.findByTenantIdAndExternalUserId(tenantId, externalUserId);
            if (agentOpt.isPresent() && agentOpt.get().getStatus() == CommonStatus.ACTIVE && agentOpt.get().getAgentRole() != null) {
                return agentOpt.get().getAgentRole().name();
            }
        }
        if (requestedRole != null && !requestedRole.isBlank()) {
            String upper = requestedRole.trim().toUpperCase();
            if (SecurityConstants.ACCOUNT_ROLE_AGENT.equals(upper)
                    || SecurityConstants.ACCOUNT_ROLE_SUPER_AGENT.equals(upper)
                    || SecurityConstants.ACCOUNT_ROLE_CUSTOMER.equals(upper)) {
                return upper;
            }
        }
        return SecurityConstants.ACCOUNT_ROLE_CUSTOMER;
    }

    private CustomerSegmentEntity resolveCustomerSegment(String tenantId, String externalUserId) {
        if (segmentRepository == null) {
            return null;
        }
        CustomerSegmentCode targetCode = CustomerSegmentCode.GENERAL;
        if (segmentMemberRepository != null && externalUserId != null && !externalUserId.isBlank()) {
            List<CustomerSegmentMemberEntity> memberships = segmentMemberRepository
                    .findByTenantIdAndExternalUserId(tenantId, externalUserId);
            if (memberships != null && !memberships.isEmpty() && memberships.get(0).getSegmentCode() != null) {
                targetCode = memberships.get(0).getSegmentCode();
            }
        }
        return segmentRepository.findByTenantIdAndSegmentCode(tenantId, targetCode)
                .or(() -> segmentRepository.findByTenantIdAndSegmentCode(tenantId, CustomerSegmentCode.GENERAL))
                .orElse(null);
    }

    private List<ApplicablePolicyDto> buildApplicablePolicies(
            String tenantId, ProfileResponse profile, BigDecimal pinLimit) {
        if (policyRepository == null) {
            return Collections.emptyList();
        }
        BigDecimal multiplier = profile.getTier() != null && profile.getTier().getPointMultiplier() != null
                ? profile.getTier().getPointMultiplier()
                : BigDecimal.ONE;

        List<LoyaltyAcceptancePolicyEntity> policies = policyRepository.findByTenantIdAndStatus(tenantId, CommonStatus.ACTIVE);
        if (policies == null || policies.isEmpty()) {
            return Collections.emptyList();
        }

        List<ApplicablePolicyDto> result = new ArrayList<>();
        for (LoyaltyAcceptancePolicyEntity p : policies) {
            LoyaltyPartnerEntity partner = p.getPartner();
            String partnerCode = partner != null ? partner.getPartnerCode() : null;
            String partnerName = partner != null ? partner.getPartnerName() : MessageUtils.getMessage("voucher.partner.ecosystem");
            String partnerType = partner != null && partner.getPartnerType() != null ? partner.getPartnerType().name() : null;
            String summary = MessageUtils.getMessage("policy.max_burn_desc", p.getMaxBurnPercentage());

            result.add(ApplicablePolicyDto.builder()
                    .partnerCode(partnerCode)
                    .partnerName(partnerName)
                    .partnerType(partnerType)
                    .pointExchangeRate(p.getPointExchangeRate())
                    .tierPointMultiplier(multiplier)
                    .maxBurnPercentage(p.getMaxBurnPercentage())
                    .minBurnPoints(p.getMinBurnPoints())
                    .maxBurnPointsPerTx(p.getMaxBurnPointsPerTx())
                    .maxBurnPointsPerDay(p.getMaxBurnPointsPerDay())
                    .payAtCounterPinLimitHtg(pinLimit)
                    .policySummary(summary)
                    .build());
        }
        return result;
    }

    private List<RecommendedVoucherDto> buildRecommendedVouchers(
            String tenantId, ProfileResponse profile, String accountRole) {
        if (voucherRepository == null) {
            return Collections.emptyList();
        }
        Instant now = Instant.now();
        String userTierCode = profile.getTier() != null && profile.getTier().getCode() != null
                ? profile.getTier().getCode().name()
                : "SILVER";
        BigDecimal userCoins = profile.getCurrentPoints() != null ? profile.getCurrentPoints() : BigDecimal.ZERO;

        Map<Long, String> partnerNames = new HashMap<>();
        if (partnerRepository != null) {
            for (LoyaltyPartnerEntity p : partnerRepository.findByTenantId(tenantId)) {
                partnerNames.put(p.getId(), p.getPartnerName());
            }
        }

        List<LoyaltyVoucherEntity> allVouchers = voucherRepository.findByTenantId(tenantId);
        if (allVouchers == null || allVouchers.isEmpty()) {
            return Collections.emptyList();
        }

        List<RecommendedVoucherDto> items = new ArrayList<>();
        for (LoyaltyVoucherEntity v : allVouchers) {
            if (v.getStatus() != VoucherStatus.ACTIVE) {
                continue;
            }
            if (v.getEndDate() != null && v.getEndDate().isBefore(now)) {
                continue;
            }
            int available = v.getAvailableQuantity() != null ? v.getAvailableQuantity() : 0;
            if (available <= 0 && !"FREE_COLLECT".equalsIgnoreCase(v.getAcquireType())) {
                continue;
            }
            if ("GIVEN".equalsIgnoreCase(v.getAcquireType())) {
                continue;
            }
            String vAudience = v.getAudienceRole() != null && !v.getAudienceRole().isBlank()
                    ? v.getAudienceRole().trim().toUpperCase()
                    : SecurityConstants.ACCOUNT_ROLE_CUSTOMER;
            if (!vAudience.equalsIgnoreCase(accountRole)) {
                continue;
            }
            if (!isTierEligible(v.getEligibleTiers(), userTierCode)) {
                continue;
            }

            BigDecimal cost = v.getPointCost() != null ? v.getPointCost() : BigDecimal.ZERO;
            boolean freeCollect = "FREE_COLLECT".equalsIgnoreCase(v.getAcquireType())
                    || cost.compareTo(BigDecimal.ZERO) == 0;
            boolean affordable = freeCollect || userCoins.compareTo(cost) >= 0;

            String reason;
            if (SecurityConstants.ACCOUNT_ROLE_AGENT.equals(accountRole)
                    || SecurityConstants.ACCOUNT_ROLE_SUPER_AGENT.equals(accountRole)) {
                reason = MessageUtils.getMessage("sso.recommend.agent_exclusive");
            } else if (freeCollect) {
                reason = MessageUtils.getMessage("sso.recommend.free_for_tier", userTierCode);
            } else if (affordable) {
                reason = MessageUtils.getMessage("sso.recommend.ready_with_coins");
            } else {
                reason = MessageUtils.getMessage("sso.recommend.for_tier", userTierCode);
            }

            String partnerName = v.getPartnerId() != null
                    ? partnerNames.getOrDefault(v.getPartnerId(), MessageUtils.getMessage("voucher.partner.ecosystem"))
                    : MessageUtils.getMessage("voucher.partner.ecosystem");

            items.add(RecommendedVoucherDto.builder()
                    .id(v.getId())
                    .voucherCode(v.getVoucherCode())
                    .title(v.getTitle())
                    .description(v.getDescription())
                    .partnerName(partnerName)
                    .discountType(v.getDiscountType() != null ? v.getDiscountType().name() : null)
                    .discountValue(v.getDiscountValue())
                    .minBillAmount(v.getMinBillAmount())
                    .pointCost(cost)
                    .acquireType(v.getAcquireType())
                    .usageType(v.getUsageType())
                    .categoryCode(v.getCategoryCode())
                    .audienceRole(vAudience)
                    .imageUrl(v.getImageUrl())
                    .affordable(affordable)
                    .freeCollect(freeCollect)
                    .matchReason(reason)
                    .build());
        }

        items.sort(Comparator
                .comparing(RecommendedVoucherDto::isFreeCollect).reversed()
                .thenComparing(RecommendedVoucherDto::isAffordable).reversed()
                .thenComparing(v -> v.getPointCost() != null ? v.getPointCost() : BigDecimal.ZERO));

        return items.size() > MAX_RECOMMENDED_VOUCHERS
                ? items.subList(0, MAX_RECOMMENDED_VOUCHERS)
                : items;
    }

    private List<RecommendedMissionDto> buildRecommendedMissions(
            String tenantId, String externalUserId, String accountRole) {
        if (milestoneRepository == null) {
            return Collections.emptyList();
        }
        Instant now = Instant.now();
        List<CampaignMilestoneEntity> milestones = milestoneRepository
                .findByTenantIdAndStatusAndStartDateBeforeAndEndDateAfterOrderByCampaignCodeAscMilestoneStepAsc(
                        tenantId, CommonStatus.ACTIVE, now, now);
        if (milestones == null || milestones.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, UserMilestoneEntity> progressMap = new HashMap<>();
        if (userMilestoneRepository != null && externalUserId != null) {
            List<UserMilestoneEntity> userProgress = userMilestoneRepository
                    .findByTenantIdAndAccount_ExternalUserId(tenantId, externalUserId);
            if (userProgress != null) {
                for (UserMilestoneEntity up : userProgress) {
                    if (up.getMilestone() != null && up.getMilestone().getId() != null) {
                        progressMap.putIfAbsent(up.getMilestone().getId(), up);
                    }
                }
            }
        }

        List<RecommendedMissionDto> items = new ArrayList<>();
        for (CampaignMilestoneEntity m : milestones) {
            String mAudience = m.getAudienceRole() != null && !m.getAudienceRole().isBlank()
                    ? m.getAudienceRole().trim().toUpperCase()
                    : SecurityConstants.ACCOUNT_ROLE_CUSTOMER;
            if (!mAudience.equalsIgnoreCase(accountRole)) {
                continue;
            }
            UserMilestoneEntity up = progressMap.get(m.getId());
            MilestoneStatus status = up != null && up.getStatus() != null ? up.getStatus() : MilestoneStatus.IN_PROGRESS;
            if (status == MilestoneStatus.CLAIMED) {
                continue;
            }
            BigDecimal currentProgress = up != null && up.getCurrentProgress() != null ? up.getCurrentProgress() : BigDecimal.ZERO;
            String reason;
            if (status == MilestoneStatus.COMPLETED) {
                reason = MessageUtils.getMessage("sso.recommend.mission_claimable");
            } else if (currentProgress.compareTo(BigDecimal.ZERO) > 0) {
                reason = MessageUtils.getMessage("sso.recommend.mission_in_progress");
            } else {
                reason = MessageUtils.getMessage("sso.recommend.mission_role", accountRole);
            }

            items.add(RecommendedMissionDto.builder()
                    .milestoneId(m.getId())
                    .campaignCode(m.getCampaignCode())
                    .campaignName(m.getCampaignName())
                    .milestoneStep(m.getMilestoneStep())
                    .targetMetric(m.getTargetMetric() != null ? m.getTargetMetric().name() : null)
                    .targetValue(m.getTargetValue())
                    .currentProgress(currentProgress)
                    .rewardPoints(m.getRewardPoints())
                    .status(status.name())
                    .audienceRole(mAudience)
                    .matchReason(reason)
                    .build());
        }

        items.sort((a, b) -> {
            int scoreA = MilestoneStatus.COMPLETED.name().equals(a.getStatus()) ? 0 : (a.getCurrentProgress().compareTo(BigDecimal.ZERO) > 0 ? 1 : 2);
            int scoreB = MilestoneStatus.COMPLETED.name().equals(b.getStatus()) ? 0 : (b.getCurrentProgress().compareTo(BigDecimal.ZERO) > 0 ? 1 : 2);
            if (scoreA != scoreB) {
                return Integer.compare(scoreA, scoreB);
            }
            return Integer.compare(
                    a.getMilestoneStep() != null ? a.getMilestoneStep() : 1,
                    b.getMilestoneStep() != null ? b.getMilestoneStep() : 1);
        });

        return items.size() > MAX_RECOMMENDED_MISSIONS
                ? items.subList(0, MAX_RECOMMENDED_MISSIONS)
                : items;
    }

    private String signTenantUserJwt(
            String tenantId,
            String externalUserId,
            String fullName,
            String phoneNumber,
            String partnerCode,
            String accountRole,
            long ttlSeconds) {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put(SecurityConstants.CLAIM_SUB, externalUserId);
        claims.put(SecurityConstants.CLAIM_USER_ID_CAMEL, externalUserId);
        claims.put(SecurityConstants.CLAIM_EXTERNAL_USER_ID, externalUserId);
        claims.put(SecurityConstants.CLAIM_TENANT_ID_CAMEL, tenantId);
        claims.put(SecurityConstants.CLAIM_TENANT_ID, tenantId);
        claims.put(SecurityConstants.CLAIM_ACCOUNT_ROLE, accountRole);
        claims.put(SecurityConstants.CLAIM_ROLES, List.of(SecurityConstants.ROLE_USER, accountRole));
        if (fullName != null && !fullName.isBlank()) {
            claims.put(SecurityConstants.CLAIM_FULL_NAME, fullName);
        }
        if (phoneNumber != null && !phoneNumber.isBlank()) {
            claims.put(SecurityConstants.CLAIM_PHONE_NUMBER, phoneNumber);
        }
        if (partnerCode != null && !partnerCode.isBlank()) {
            claims.put(SecurityConstants.CLAIM_PARTNER_CODE, partnerCode);
        }
        return JwtTokenUtils.signClaims(claims, ttlSeconds, LoyaltyProperties.get().getSecurity().getMasterKey());
    }

    private boolean isTierEligible(String eligibleTiersCsv, String userTierCode) {
        if (eligibleTiersCsv == null || eligibleTiersCsv.isBlank()) {
            return true;
        }
        List<String> tiers = Arrays.stream(eligibleTiersCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toUpperCase)
                .collect(Collectors.toList());
        return tiers.isEmpty() || tiers.contains(userTierCode.toUpperCase());
    }

    private String mapHighlightModuleToRoute(String module) {
        return switch (module) {
            case "GAMES" -> "/games";
            case "TIERS" -> "/tiers";
            case "VOUCHERS", "CROSS_SELL" -> "/rewards";
            case "PARTNERS" -> "/pay-at-counter";
            case "HOME" -> "/";
            default -> "/missions";
        };
    }

    private Map<String, Object> parseJsonMap(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private String resolveEffectiveTenant(String primaryTenant, String fallbackTenant) {
        if (primaryTenant != null && !primaryTenant.isBlank() && !"DEFAULT".equalsIgnoreCase(primaryTenant.trim())) {
            return primaryTenant.trim();
        }
        if (fallbackTenant != null && !fallbackTenant.isBlank() && !"DEFAULT".equalsIgnoreCase(fallbackTenant.trim())) {
            return fallbackTenant.trim();
        }
        String ctx = TenantContext.getTenantId();
        if (ctx != null && !ctx.isBlank() && !"DEFAULT".equalsIgnoreCase(ctx.trim())) {
            return ctx.trim();
        }
        if (primaryTenant != null && !primaryTenant.isBlank()) {
            return primaryTenant.trim();
        }
        if (fallbackTenant != null && !fallbackTenant.isBlank()) {
            return fallbackTenant.trim();
        }
        return (ctx != null && !ctx.isBlank()) ? ctx.trim() : "DEFAULT";
    }

    public static String buildTicketSignatureData(
            String tenantId, String partnerCode, String externalUserId, long timestamp) {
        return (tenantId != null ? tenantId : "") + "|"
                + (partnerCode != null ? partnerCode : "") + "|"
                + (externalUserId != null ? externalUserId : "") + "|"
                + timestamp;
    }

    public static String buildUserAssertionSignatureData(
            String tenantId, String externalUserId, long timestamp) {
        return (tenantId != null ? tenantId : "") + "|"
                + (externalUserId != null ? externalUserId : "") + "|"
                + timestamp;
    }

    private void verifyTicketIssuanceSecurity(
            String tenantId,
            SsoTicketRequest request,
            String headerApiKey,
            String headerTimestamp,
            String headerSignature) {
        boolean hasApiKey = headerApiKey != null && !headerApiKey.isBlank();
        boolean hasTimestampHeader = headerTimestamp != null && !headerTimestamp.isBlank();
        boolean hasTimestampField = request.getTimestamp() != null;
        String effectiveSignature = firstNonBlank(headerSignature, request.getSignature());
        boolean hasSignature = effectiveSignature != null;

        if (!hasApiKey && !hasTimestampHeader && !hasTimestampField && !hasSignature) {
            return;
        }

        Long effectiveTimestamp = parseTimestamp(headerTimestamp, request.getTimestamp());
        if (effectiveTimestamp == null) {
            throw new LoyaltyException(ErrorCode.TIMESTAMP_DRIFT_EXCEEDED);
        }
        long driftTolerance = SystemParameterService.get().getLong(
                tenantId, SystemParamSpec.HMAC_DRIFT_TOLERANCE_SECONDS);
        if (!SignatureUtils.isTimestampValid(effectiveTimestamp, driftTolerance)) {
            throw new LoyaltyException(ErrorCode.TIMESTAMP_DRIFT_EXCEEDED);
        }

        LoyaltyPartnerEntity partner = resolvePartnerForAuth(tenantId, request.getPartnerCode(), headerApiKey);
        if (hasApiKey) {
            if (partner == null
                    || partner.getStatus() != CommonStatus.ACTIVE
                    || partner.getApiKey() == null
                    || !partner.getApiKey().equals(headerApiKey.trim())) {
                throw new LoyaltyException(ErrorCode.API_KEY_INVALID);
            }
        } else if (partner != null && partner.getStatus() != CommonStatus.ACTIVE) {
            throw new LoyaltyException(ErrorCode.PARTNER_UNAUTHORIZED);
        }

        if (hasSignature) {
            String signingKey = resolveSigningKey(partner);
            if (signingKey == null || signingKey.isBlank()) {
                throw new LoyaltyException(ErrorCode.SIGNATURE_INVALID);
            }
            String canonicalData = buildTicketSignatureData(
                    tenantId, request.getPartnerCode(), request.getExternalUserId(), effectiveTimestamp);
            if (!SignatureUtils.verifySignature(canonicalData, effectiveSignature, signingKey)) {
                throw new LoyaltyException(ErrorCode.SIGNATURE_INVALID);
            }
        }
    }

    private void verifyUserHmacAssertion(
            String tenantId,
            String externalUserId,
            String partnerCode,
            Long timestamp,
            String signature) {
        if (timestamp == null) {
            throw new LoyaltyException(ErrorCode.TIMESTAMP_DRIFT_EXCEEDED);
        }
        long driftTolerance = SystemParameterService.get().getLong(
                tenantId, SystemParamSpec.HMAC_DRIFT_TOLERANCE_SECONDS);
        if (!SignatureUtils.isTimestampValid(timestamp, driftTolerance)) {
            throw new LoyaltyException(ErrorCode.TIMESTAMP_DRIFT_EXCEEDED);
        }
        if (signature == null || signature.isBlank()) {
            throw new LoyaltyException(ErrorCode.SIGNATURE_INVALID);
        }

        LoyaltyPartnerEntity partner = resolvePartnerForAuth(tenantId, partnerCode, null);
        if (partner == null && partnerRepository != null) {
            List<LoyaltyPartnerEntity> activePartners = partnerRepository.findByTenantIdAndStatus(
                    tenantId, CommonStatus.ACTIVE);
            if (activePartners != null && !activePartners.isEmpty()) {
                partner = activePartners.get(0);
            }
        }
        if (partner != null && partner.getStatus() != CommonStatus.ACTIVE) {
            throw new LoyaltyException(ErrorCode.PARTNER_UNAUTHORIZED);
        }

        String signingKey = resolveSigningKey(partner);
        if (signingKey == null || signingKey.isBlank()) {
            throw new LoyaltyException(ErrorCode.SIGNATURE_INVALID);
        }
        String canonicalData = buildUserAssertionSignatureData(tenantId, externalUserId, timestamp);
        if (!SignatureUtils.verifySignature(canonicalData, signature, signingKey)) {
            throw new LoyaltyException(ErrorCode.SIGNATURE_INVALID);
        }
    }

    private Long parseTimestamp(String headerTimestamp, Long bodyTimestamp) {
        if (headerTimestamp != null && !headerTimestamp.isBlank()) {
            try {
                return Long.parseLong(headerTimestamp.trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return bodyTimestamp;
    }

    private LoyaltyPartnerEntity resolvePartnerForAuth(String tenantId, String partnerCode, String apiKey) {
        if (partnerRepository == null) {
            return null;
        }
        if (partnerCode != null && !partnerCode.isBlank()) {
            Optional<LoyaltyPartnerEntity> byCode = partnerRepository.findByTenantIdAndPartnerCode(
                    tenantId, partnerCode.trim());
            if (byCode.isPresent()) {
                return byCode.get();
            }
        }
        if (apiKey != null && !apiKey.isBlank()) {
            Optional<LoyaltyPartnerEntity> byKey = partnerRepository.findByTenantIdAndApiKey(tenantId, apiKey.trim());
            if (byKey.isPresent()) {
                return byKey.get();
            }
        }
        return null;
    }

    private String resolveSigningKey(LoyaltyPartnerEntity partner) {
        if (partner != null && partner.getSecretKey() != null && !partner.getSecretKey().isBlank()) {
            return partner.getSecretKey().trim();
        }
        String masterKey = LoyaltyProperties.get().getSecurity().getMasterKey();
        if (masterKey != null && !masterKey.isBlank()) {
            return masterKey.trim();
        }
        String envKey = System.getenv("LOYALTY_MASTER_KEY");
        return (envKey != null && !envKey.isBlank()) ? envKey.trim() : null;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return null;
    }
}
