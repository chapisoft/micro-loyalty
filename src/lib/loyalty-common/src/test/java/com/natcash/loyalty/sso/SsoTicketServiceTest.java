package com.natcash.loyalty.sso;

import com.natcash.loyalty.account.dto.ProfileDto.ProfileRequest;
import com.natcash.loyalty.account.dto.ProfileDto.ProfileResponse;
import com.natcash.loyalty.account.dto.ProfileDto.TierInfo;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.entity.LoyaltyTierEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.agent.entity.AgentLoyaltyProgramEntity;
import com.natcash.loyalty.agent.repository.AgentLoyaltyProgramRepository;
import com.natcash.loyalty.campaign.entity.CampaignMilestoneEntity;
import com.natcash.loyalty.campaign.repository.CampaignMilestoneRepository;
import com.natcash.loyalty.campaign.repository.UserMilestoneRepository;
import com.natcash.loyalty.config.LoyaltyProperties;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.SecurityConstants;
import com.natcash.loyalty.domain.enums.AgentRoleType;
import com.natcash.loyalty.domain.enums.BucketStatus;
import com.natcash.loyalty.domain.enums.CampaignMetric;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.CustomerSegmentCode;
import com.natcash.loyalty.domain.enums.DiscountType;
import com.natcash.loyalty.domain.enums.PartnerType;
import com.natcash.loyalty.domain.enums.TierLevel;
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
import com.natcash.loyalty.security.SecurityContextUtils;
import com.natcash.loyalty.security.SignatureUtils;
import com.natcash.loyalty.sso.dto.SsoDto.SsoExchangeRequest;
import com.natcash.loyalty.sso.dto.SsoDto.SsoExchangeResponse;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketPayload;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketRequest;
import com.natcash.loyalty.sso.dto.SsoDto.SsoTicketResponse;
import com.natcash.loyalty.sso.dto.SsoDto.TenantAccountSummary;
import com.natcash.loyalty.sso.dto.SsoDto.TenantUserAuthRequest;
import com.natcash.loyalty.sso.dto.SsoDto.TenantUserContextResponse;
import com.natcash.loyalty.sso.service.SsoTicketService;
import com.natcash.loyalty.wallet.entity.LoyaltyAcceptancePolicyEntity;
import com.natcash.loyalty.wallet.entity.LoyaltyVoucherEntity;
import com.natcash.loyalty.wallet.repository.LoyaltyAcceptancePolicyRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRepository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lib.ims.redis.service.RedisService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SsoTicketServiceTest {

    @Mock
    private RedisService redisService;
    @Mock
    private AccountService accountService;
    @Mock
    private LoyaltyAccountRepository accountRepository;
    @Mock
    private AgentLoyaltyProgramRepository agentRepository;
    @Mock
    private PointExpirationBucketRepository bucketRepository;
    @Mock
    private CustomerSegmentRepository segmentRepository;
    @Mock
    private CustomerSegmentMemberRepository segmentMemberRepository;
    @Mock
    private LoyaltyAcceptancePolicyRepository policyRepository;
    @Mock
    private LoyaltyVoucherRepository voucherRepository;
    @Mock
    private LoyaltyPartnerRepository partnerRepository;
    @Mock
    private CampaignMilestoneRepository milestoneRepository;
    @Mock
    private UserMilestoneRepository userMilestoneRepository;
    @Mock
    private TenantIntegrationService tenantIntegrationService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private SsoTicketService ssoTicketService;

    @BeforeEach
    void setUp() {
        ssoTicketService = new SsoTicketService(redisService, objectMapper);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("BE-08-UT-01: Sinh vé phiên SSO Ticket thành công có thời hạn 60 giây")
    void testGenerateTicketSuccess() {
        SsoTicketRequest request = SsoTicketRequest.builder()
                .partnerCode("DELIMART")
                .externalUserId("USER_555")
                .username("John Doe")
                .permissions(List.of("READ_PROFILE", "BURN_POINTS"))
                .build();

        SsoTicketResponse response = ssoTicketService.generateTicket("TENANT_DELIMART", request);

        assertNotNull(response);
        assertNotNull(response.getSessionTicket());
        assertEquals(60L, response.getExpiresInSeconds());
        verify(redisService, times(1)).set(anyString(), anyString(), eq(Duration.ofSeconds(60L)));
    }

    @Test
    @DisplayName("BE-08-UT-02: Đổi vé SSO Ticket lấy JWT ký thật thành công và xóa vé nguyên tử")
    void testExchangeTokenSuccess() throws JsonProcessingException {
        String ticket = "test_ticket_123456";
        SsoTicketPayload payload = SsoTicketPayload.builder()
                .tenantId("TENANT_DELIMART")
                .partnerCode("DELIMART")
                .externalUserId("USER_555")
                .username("John Doe")
                .accountRole("CUSTOMER")
                .build();

        when(redisService.getAndDelete("sso:ticket:" + ticket)).thenReturn(objectMapper.writeValueAsString(payload));

        SsoExchangeRequest request = SsoExchangeRequest.builder()
                .sessionTicket(ticket)
                .build();

        SsoExchangeResponse response = ssoTicketService.exchangeToken(request);

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(900L, response.getExpiresInSeconds());
        assertEquals("TENANT_DELIMART", response.getTenantId());
        assertEquals("USER_555", response.getExternalUserId());

        Optional<Map<String, Object>> claimsOpt = JwtTokenUtils.verifyAndExtractClaims(
                response.getAccessToken(), LoyaltyProperties.get().getSecurity().getMasterKey());
        assertTrue(claimsOpt.isPresent());
        assertEquals("USER_555", claimsOpt.get().get(SecurityConstants.CLAIM_SUB));
        assertEquals("TENANT_DELIMART", claimsOpt.get().get(SecurityConstants.CLAIM_TENANT_ID_CAMEL));
        assertEquals("CUSTOMER", claimsOpt.get().get(SecurityConstants.CLAIM_ACCOUNT_ROLE));
    }

    @Test
    @DisplayName("BE-08-UT-03: Đổi vé SSO thất bại khi vé không tồn tại hoặc đã bị dùng (Replay)")
    void testExchangeTokenInvalidOrReplayed() {
        String ticket = "used_or_expired_ticket";
        when(redisService.getAndDelete("sso:ticket:" + ticket)).thenReturn(null);

        SsoExchangeRequest request = SsoExchangeRequest.builder()
                .sessionTicket(ticket)
                .build();

        LoyaltyException ex = assertThrows(LoyaltyException.class, () ->
                ssoTicketService.exchangeToken(request)
        );

        assertEquals(ErrorCode.API_KEY_INVALID, ex.getErrorCode());
    }

    @Test
    @DisplayName("BE-08-UT-04: Xác thực user Natcash trả về đúng JWT, điểm/coin, chính sách và đề xuất phù hợp")
    void testAuthenticateTenantUserNatcashContext() {
        SsoTicketService fullService = new SsoTicketService(
                redisService, objectMapper, accountService, accountRepository, agentRepository,
                bucketRepository, segmentRepository, segmentMemberRepository, policyRepository,
                voucherRepository, partnerRepository, milestoneRepository, userMilestoneRepository);

        String tenantId = "TENANT_NATCASH";
        String userId = "50937123456";

        LoyaltyTierEntity goldTier = LoyaltyTierEntity.builder()
                .id(2L)
                .tenantId(tenantId)
                .code(TierLevel.GOLD)
                .name("Hạng Vàng Thân Thiết")
                .tierLevel(2)
                .minPoints(new BigDecimal("1000"))
                .pointMultiplier(new BigDecimal("1.25"))
                .freeDailyTurns(2)
                .build();

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .id(101L)
                .tenantId(tenantId)
                .externalUserId(userId)
                .phoneNumber(userId)
                .fullName("Jean-Baptiste Natcash VIP")
                .tier(goldTier)
                .currentPoints(new BigDecimal("2500.00"))
                .tierPoints(new BigDecimal("4200.00"))
                .status(CommonStatus.ACTIVE)
                .build();

        ProfileResponse profile = ProfileResponse.builder()
                .accountId(101L)
                .tenantId(tenantId)
                .externalUserId(userId)
                .phoneNumber(userId)
                .fullName("Jean-Baptiste Natcash VIP")
                .currentPoints(new BigDecimal("2500.00"))
                .tierPoints(new BigDecimal("4200.00"))
                .tier(TierInfo.builder()
                        .id(2L)
                        .code(TierLevel.GOLD)
                        .name("Hạng Vàng Thân Thiết")
                        .tierLevel(2)
                        .pointMultiplier(new BigDecimal("1.25"))
                        .freeDailyTurns(2)
                        .build())
                .status(CommonStatus.ACTIVE)
                .build();

        when(accountRepository.findByTenantIdAndExternalUserId(tenantId, userId)).thenReturn(Optional.of(account));
        when(accountService.getOrCreateProfile(eq(tenantId), any(ProfileRequest.class))).thenReturn(profile);
        when(agentRepository.findByTenantIdAndExternalUserId(tenantId, userId)).thenReturn(Optional.empty());
        when(bucketRepository.findByTenantIdAndAccountIdAndStatusOrderByExpiredAtAsc(tenantId, 101L, BucketStatus.ACTIVE))
                .thenReturn(List.of(PointExpirationBucketEntity.builder()
                        .remainingPoints(new BigDecimal("350.00"))
                        .expiredAt(Instant.now().plus(15, ChronoUnit.DAYS))
                        .build()));

        CustomerSegmentMemberEntity member = CustomerSegmentMemberEntity.builder()
                .tenantId(tenantId)
                .segmentCode(CustomerSegmentCode.HIGH_VALUE)
                .externalUserId(userId)
                .build();
        CustomerSegmentEntity segment = CustomerSegmentEntity.builder()
                .tenantId(tenantId)
                .segmentCode(CustomerSegmentCode.HIGH_VALUE)
                .segmentName("Hội Viên Giá Trị Cao (VIP)")
                .description("Đặc quyền VIP Natcash")
                .bannerConfig("{\"cta\":\"Đặc quyền hoàn tiền VIP\",\"highlightModule\":\"TIERS\"}")
                .build();
        when(segmentMemberRepository.findByTenantIdAndExternalUserId(tenantId, userId)).thenReturn(List.of(member));
        when(segmentRepository.findByTenantIdAndSegmentCode(tenantId, CustomerSegmentCode.HIGH_VALUE))
                .thenReturn(Optional.of(segment));

        LoyaltyPartnerEntity natcashPartner = LoyaltyPartnerEntity.builder()
                .id(11L)
                .tenantId(tenantId)
                .partnerCode("NATCASH_WALLET")
                .partnerName("Ví Điện Tử Natcash")
                .partnerType(PartnerType.BANKING)
                .build();
        when(partnerRepository.findByTenantId(tenantId)).thenReturn(List.of(natcashPartner));
        when(policyRepository.findByTenantIdAndStatus(tenantId, CommonStatus.ACTIVE))
                .thenReturn(List.of(LoyaltyAcceptancePolicyEntity.builder()
                        .id(1L)
                        .tenantId(tenantId)
                        .partner(natcashPartner)
                        .pointExchangeRate(BigDecimal.ONE)
                        .maxBurnPercentage(new BigDecimal("100.00"))
                        .minBurnPoints(BigDecimal.TEN)
                        .maxBurnPointsPerTx(new BigDecimal("5000"))
                        .maxBurnPointsPerDay(new BigDecimal("20000"))
                        .status(CommonStatus.ACTIVE)
                        .build()));

        LoyaltyVoucherEntity goldVoucher = LoyaltyVoucherEntity.builder()
                .id(201L)
                .tenantId(tenantId)
                .partnerId(11L)
                .voucherCode("NC-CASHBACK-100")
                .title("Hoàn 100 HTG")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("100"))
                .pointCost(new BigDecimal("80"))
                .availableQuantity(100)
                .acquireType("COINS")
                .audienceRole("CUSTOMER")
                .eligibleTiers("GOLD,PLATINUM")
                .status(VoucherStatus.ACTIVE)
                .endDate(Instant.now().plus(30, ChronoUnit.DAYS))
                .build();
        LoyaltyVoucherEntity agentOnlyVoucher = LoyaltyVoucherEntity.builder()
                .id(202L)
                .tenantId(tenantId)
                .partnerId(11L)
                .voucherCode("AG-BONUS-500")
                .title("Thưởng riêng Đại lý")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("500"))
                .pointCost(new BigDecimal("50"))
                .availableQuantity(50)
                .acquireType("COINS")
                .audienceRole("AGENT")
                .status(VoucherStatus.ACTIVE)
                .endDate(Instant.now().plus(30, ChronoUnit.DAYS))
                .build();
        when(voucherRepository.findByTenantId(tenantId)).thenReturn(List.of(goldVoucher, agentOnlyVoucher));

        CampaignMilestoneEntity customerMission = CampaignMilestoneEntity.builder()
                .id(301L)
                .tenantId(tenantId)
                .campaignCode("NATCASH_MISSION_2026")
                .campaignName("Thử Thách Giao Dịch Số")
                .milestoneStep(1)
                .targetMetric(CampaignMetric.TRANSACTION_COUNT)
                .targetValue(BigDecimal.ONE)
                .rewardPoints(new BigDecimal("30"))
                .audienceRole("CUSTOMER")
                .status(CommonStatus.ACTIVE)
                .startDate(Instant.now().minus(1, ChronoUnit.DAYS))
                .endDate(Instant.now().plus(30, ChronoUnit.DAYS))
                .build();
        when(milestoneRepository.findByTenantIdAndStatusAndStartDateBeforeAndEndDateAfterOrderByCampaignCodeAscMilestoneStepAsc(
                eq(tenantId), eq(CommonStatus.ACTIVE), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(customerMission));
        when(userMilestoneRepository.findByTenantIdAndAccount_ExternalUserId(tenantId, userId))
                .thenReturn(List.of());

        TenantUserContextResponse ctx = fullService.authenticateTenantUser(tenantId, TenantUserAuthRequest.builder()
                .tenantId(tenantId)
                .externalUserId(userId)
                .verifyCode("123456")
                .authMethod("OTP_PIN")
                .build());

        assertNotNull(ctx.getAccessToken());
        assertEquals(tenantId, ctx.getTenantId());
        assertEquals(userId, ctx.getExternalUserId());
        assertEquals("CUSTOMER", ctx.getAccountRole());
        assertEquals(new BigDecimal("350.00"), ctx.getExpiringPoints());
        assertEquals("HIGH_VALUE", ctx.getSegmentCode());
        assertEquals("/tiers", ctx.getSegmentCtaTarget());
        assertEquals(1, ctx.getApplicablePolicies().size());
        assertEquals(new BigDecimal("1.25"), ctx.getApplicablePolicies().get(0).getTierPointMultiplier());
        assertEquals(1, ctx.getRecommendedVouchers().size());
        assertEquals("NC-CASHBACK-100", ctx.getRecommendedVouchers().get(0).getVoucherCode());
        assertTrue(ctx.getRecommendedVouchers().get(0).isAffordable());
        assertEquals(1, ctx.getRecommendedMissions().size());
        assertEquals("NATCASH_MISSION_2026", ctx.getRecommendedMissions().get(0).getCampaignCode());
    }

    @Test
    @DisplayName("BE-08-UT-05: Liệt kê tài khoản Tenant hợp nhất cả hội viên và đại lý Natcash")
    void testListTenantAccountsIncludesMembersAndAgents() {
        SsoTicketService fullService = new SsoTicketService(
                redisService, objectMapper, accountService, accountRepository, agentRepository,
                bucketRepository, segmentRepository, segmentMemberRepository, policyRepository,
                voucherRepository, partnerRepository, milestoneRepository, userMilestoneRepository);

        String tenantId = "TENANT_NATCASH";
        LoyaltyAccountEntity customerAcc = LoyaltyAccountEntity.builder()
                .tenantId(tenantId)
                .externalUserId("50937123456")
                .phoneNumber("50937123456")
                .fullName("Jean-Baptiste Natcash VIP")
                .currentPoints(new BigDecimal("2500"))
                .tierPoints(new BigDecimal("4200"))
                .status(CommonStatus.ACTIVE)
                .build();
        AgentLoyaltyProgramEntity superAgent = AgentLoyaltyProgramEntity.builder()
                .tenantId(tenantId)
                .agentCode("SA_PAP_001")
                .externalUserId("50937000001")
                .fullName("Jean-Claude Super Agent")
                .phoneNumber("+50937000001")
                .agentRole(AgentRoleType.SUPER_AGENT)
                .status(CommonStatus.ACTIVE)
                .build();

        when(accountRepository.findByTenantId(tenantId)).thenReturn(List.of(customerAcc));
        when(agentRepository.findByTenantIdOrderByIdDesc(tenantId)).thenReturn(List.of(superAgent));
        when(segmentRepository.findByTenantIdOrderByIdAsc(tenantId)).thenReturn(List.of());
        when(segmentMemberRepository.findByTenantId(tenantId)).thenReturn(List.of());

        List<TenantAccountSummary> accounts = fullService.listTenantAccounts(tenantId);

        assertEquals(2, accounts.size());
        assertEquals("CUSTOMER", accounts.get(0).getAccountRole());
        assertEquals("SUPER_AGENT", accounts.get(1).getAccountRole());
        assertFalse(accounts.get(0).getExternalUserId().isBlank());
    }

    @Test
    @DisplayName("BE-08-UT-06: SecurityContextUtils chặn truy cập chéo tài khoản (IDOR) và yêu cầu xác thực")
    void testSecurityContextUtilsEnforcesIdentityAndIdor() {
        // 1. Không có phiên đăng nhập và không có userId -> UNAUTHORIZED
        SecurityContextHolder.clearContext();
        LoyaltyException unauthEx = assertThrows(LoyaltyException.class, () ->
                SecurityContextUtils.resolveUserId(null));
        assertEquals(ErrorCode.UNAUTHORIZED, unauthEx.getErrorCode());

        // 2. Đã xác thực là user 50937123456 -> resolveUserId(null) trả về đúng 50937123456
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "50937123456",
                null,
                List.of(new SimpleGrantedAuthority(SecurityConstants.ROLE_USER)));
        auth.setDetails(Map.of(
                SecurityConstants.CLAIM_SUB, "50937123456",
                SecurityConstants.CLAIM_EXTERNAL_USER_ID, "50937123456",
                SecurityConstants.CLAIM_TENANT_ID_CAMEL, "TENANT_NATCASH",
                SecurityConstants.CLAIM_ACCOUNT_ROLE, "CUSTOMER"));
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertEquals("50937123456", SecurityContextUtils.resolveUserId(null));
        assertEquals("50937123456", SecurityContextUtils.resolveAuthenticatedUserId("50937123456"));

        // 3. User 50937123456 cố tình truyền externalUserId=84988888888 -> IDOR_FORBIDDEN
        LoyaltyException idorEx = assertThrows(LoyaltyException.class, () ->
                SecurityContextUtils.resolveUserId("84988888888"));
        assertEquals(ErrorCode.IDOR_FORBIDDEN, idorEx.getErrorCode());
    }

    @Test
    @DisplayName("BE-08-UT-07: Cấp vé SSO với chữ ký HMAC-SHA256 hợp lệ và trả về webviewLaunchUrl")
    void testGenerateTicketWithValidHmacSignature() {
        SsoTicketService fullService = new SsoTicketService(
                redisService, objectMapper, accountService, accountRepository, agentRepository,
                bucketRepository, segmentRepository, segmentMemberRepository, policyRepository,
                voucherRepository, partnerRepository, milestoneRepository, userMilestoneRepository);

        String tenantId = "TENANT_NATCASH";
        String partnerCode = "NATCASH_WALLET";
        String userId = "50937123456";
        String apiKey = "nk_live_natcash_2026";
        String secretKey = "nc_b2b_secret_key_2026";
        long timestamp = Instant.now().getEpochSecond();

        LoyaltyPartnerEntity partner = LoyaltyPartnerEntity.builder()
                .id(11L)
                .tenantId(tenantId)
                .partnerCode(partnerCode)
                .partnerName("Natcash Core eWallet")
                .apiKey(apiKey)
                .secretKey(secretKey)
                .status(CommonStatus.ACTIVE)
                .build();
        when(partnerRepository.findByTenantIdAndPartnerCode(tenantId, partnerCode)).thenReturn(Optional.of(partner));

        String canonical = SsoTicketService.buildTicketSignatureData(tenantId, partnerCode, userId, timestamp);
        String signature = SignatureUtils.calculateHmacSha256(canonical, secretKey);

        SsoTicketRequest request = SsoTicketRequest.builder()
                .partnerCode(partnerCode)
                .externalUserId(userId)
                .phoneNumber(userId)
                .fullName("Jean-Baptiste Natcash VIP")
                .accountRole("CUSTOMER")
                .build();

        SsoTicketResponse response = fullService.generateTicket(
                tenantId, request, apiKey, String.valueOf(timestamp), signature);

        assertNotNull(response.getSessionTicket());
        assertEquals(60L, response.getExpiresInSeconds());
        assertEquals("/?ticket=" + response.getSessionTicket() + "&tenantId=" + tenantId,
                response.getWebviewLaunchUrl());
        verify(redisService, times(1)).set(anyString(), anyString(), eq(Duration.ofSeconds(60L)));
    }

    @Test
    @DisplayName("BE-08-UT-08: Từ chối cấp vé SSO khi chữ ký HMAC sai, API Key sai hoặc Timestamp hết hạn")
    void testGenerateTicketRejectsInvalidSignatureAndExpiredTimestamp() {
        SsoTicketService fullService = new SsoTicketService(
                redisService, objectMapper, accountService, accountRepository, agentRepository,
                bucketRepository, segmentRepository, segmentMemberRepository, policyRepository,
                voucherRepository, partnerRepository, milestoneRepository, userMilestoneRepository);

        String tenantId = "TENANT_NATCASH";
        String partnerCode = "NATCASH_WALLET";
        String userId = "50937123456";
        String apiKey = "nk_live_natcash_2026";
        String secretKey = "nc_b2b_secret_key_2026";
        long validTs = Instant.now().getEpochSecond();

        LoyaltyPartnerEntity partner = LoyaltyPartnerEntity.builder()
                .id(11L)
                .tenantId(tenantId)
                .partnerCode(partnerCode)
                .partnerName("Natcash Core eWallet")
                .apiKey(apiKey)
                .secretKey(secretKey)
                .status(CommonStatus.ACTIVE)
                .build();
        when(partnerRepository.findByTenantIdAndPartnerCode(tenantId, partnerCode)).thenReturn(Optional.of(partner));

        SsoTicketRequest request = SsoTicketRequest.builder()
                .partnerCode(partnerCode)
                .externalUserId(userId)
                .build();

        // 1. Timestamp lệch quá dung sai 300s
        long expiredTs = validTs - 400;
        String expiredSig = SignatureUtils.calculateHmacSha256(
                SsoTicketService.buildTicketSignatureData(tenantId, partnerCode, userId, expiredTs), secretKey);
        LoyaltyException tsEx = assertThrows(LoyaltyException.class, () ->
                fullService.generateTicket(tenantId, request, apiKey, String.valueOf(expiredTs), expiredSig));
        assertEquals(ErrorCode.TIMESTAMP_DRIFT_EXCEEDED, tsEx.getErrorCode());

        // 2. API Key sai
        String validSig = SignatureUtils.calculateHmacSha256(
                SsoTicketService.buildTicketSignatureData(tenantId, partnerCode, userId, validTs), secretKey);
        LoyaltyException keyEx = assertThrows(LoyaltyException.class, () ->
                fullService.generateTicket(tenantId, request, "wrong_api_key", String.valueOf(validTs), validSig));
        assertEquals(ErrorCode.API_KEY_INVALID, keyEx.getErrorCode());

        // 3. Chữ ký HMAC bị giả mạo
        LoyaltyException sigEx = assertThrows(LoyaltyException.class, () ->
                fullService.generateTicket(tenantId, request, apiKey, String.valueOf(validTs), "deadbeef_invalid_sig"));
        assertEquals(ErrorCode.SIGNATURE_INVALID, sigEx.getErrorCode());
    }

    @Test
    @DisplayName("BE-08-UT-09: Xác thực tài khoản Tenant bằng HMAC_ASSERTION và Identity Provider")
    void testAuthenticateTenantUserWithHmacAssertion() {
        SsoTicketService fullService = new SsoTicketService(
                redisService, objectMapper, accountService, accountRepository, agentRepository,
                bucketRepository, segmentRepository, segmentMemberRepository, policyRepository,
                voucherRepository, partnerRepository, milestoneRepository, userMilestoneRepository,
                tenantIntegrationService);

        String tenantId = "TENANT_NATCASH";
        String partnerCode = "NATCASH_WALLET";
        String userId = "50937123456";
        String secretKey = "nc_b2b_secret_key_2026";
        long timestamp = Instant.now().getEpochSecond();

        LoyaltyPartnerEntity partner = LoyaltyPartnerEntity.builder()
                .id(11L)
                .tenantId(tenantId)
                .partnerCode(partnerCode)
                .partnerName("Natcash Core eWallet")
                .apiKey("nk_live_natcash_2026")
                .secretKey(secretKey)
                .status(CommonStatus.ACTIVE)
                .build();
        when(partnerRepository.findByTenantIdAndPartnerCode(tenantId, partnerCode)).thenReturn(Optional.of(partner));

        ProfileResponse profile = ProfileResponse.builder()
                .accountId(101L)
                .tenantId(tenantId)
                .externalUserId(userId)
                .phoneNumber(userId)
                .fullName("Jean-Baptiste Natcash VIP")
                .currentPoints(new BigDecimal("2500.00"))
                .tierPoints(new BigDecimal("4200.00"))
                .status(CommonStatus.ACTIVE)
                .build();
        when(accountRepository.findByTenantIdAndExternalUserId(tenantId, userId)).thenReturn(Optional.empty());
        when(accountRepository.findByTenantIdAndPhoneNumber(tenantId, userId)).thenReturn(Optional.empty());
        when(agentRepository.findByTenantIdAndExternalUserId(tenantId, userId)).thenReturn(Optional.empty());
        when(accountService.getOrCreateProfile(eq(tenantId), any(ProfileRequest.class))).thenReturn(profile);

        String assertionCanonical = SsoTicketService.buildUserAssertionSignatureData(tenantId, userId, timestamp);
        String validSignature = SignatureUtils.calculateHmacSha256(assertionCanonical, secretKey);

        TenantUserContextResponse ctx = fullService.authenticateTenantUser(tenantId, TenantUserAuthRequest.builder()
                .tenantId(tenantId)
                .partnerCode(partnerCode)
                .externalUserId(userId)
                .phoneNumber(userId)
                .fullName("Jean-Baptiste Natcash VIP")
                .authMethod(SsoTicketService.AUTH_METHOD_HMAC_ASSERTION)
                .timestamp(timestamp)
                .signature(validSignature)
                .build());

        assertNotNull(ctx.getAccessToken());
        assertEquals(tenantId, ctx.getTenantId());
        assertEquals(userId, ctx.getExternalUserId());

        // Chữ ký bị giả mạo -> SIGNATURE_INVALID
        LoyaltyException invalidSigEx = assertThrows(LoyaltyException.class, () ->
                fullService.authenticateTenantUser(tenantId, TenantUserAuthRequest.builder()
                        .tenantId(tenantId)
                        .partnerCode(partnerCode)
                        .externalUserId(userId)
                        .authMethod(SsoTicketService.AUTH_METHOD_HMAC_ASSERTION)
                        .timestamp(timestamp)
                        .signature("tampered_signature")
                        .build()));
        assertEquals(ErrorCode.SIGNATURE_INVALID, invalidSigEx.getErrorCode());

        // TENANT_TOKEN bị Identity Provider từ chối -> UNAUTHORIZED
        when(tenantIntegrationService.verifyTenantUserIdentity(eq(tenantId), eq(userId), eq("bad_idp_token"), any(), any()))
                .thenReturn(false);
        LoyaltyException idpRejectEx = assertThrows(LoyaltyException.class, () ->
                fullService.authenticateTenantUser(tenantId, TenantUserAuthRequest.builder()
                        .tenantId(tenantId)
                        .externalUserId(userId)
                        .verifyCode("bad_idp_token")
                        .authMethod("TENANT_TOKEN")
                        .build()));
        assertEquals(ErrorCode.UNAUTHORIZED, idpRejectEx.getErrorCode());
    }

    @Test
    @DisplayName("BE-08-UT-10: Tài khoản khách hàng VIP trùng externalUserId với đại lý khác tên vẫn giữ đúng vai trò CUSTOMER")
    void testResolveCustomerRoleWhenAccountNameDiffersFromSeededAgent() {
        SsoTicketService fullService = new SsoTicketService(
                redisService, objectMapper, accountService, accountRepository, agentRepository,
                bucketRepository, segmentRepository, segmentMemberRepository, policyRepository,
                voucherRepository, partnerRepository, milestoneRepository, userMilestoneRepository);

        String tenantId = "TENANT_NATCASH";
        String userId = "50937123456";

        LoyaltyAccountEntity vipAccount = LoyaltyAccountEntity.builder()
                .tenantId(tenantId)
                .externalUserId(userId)
                .phoneNumber(userId)
                .fullName("Jean-Baptiste Natcash VIP")
                .currentPoints(new BigDecimal("5040"))
                .tierPoints(new BigDecimal("4200"))
                .status(CommonStatus.ACTIVE)
                .build();
        AgentLoyaltyProgramEntity seededAgent = AgentLoyaltyProgramEntity.builder()
                .tenantId(tenantId)
                .agentCode("AG_DEL_001")
                .externalUserId(userId)
                .fullName("Agent Delmas 32 - Marc Antoine")
                .phoneNumber("+50937123456")
                .agentRole(AgentRoleType.AGENT)
                .status(CommonStatus.ACTIVE)
                .build();
        ProfileResponse profile = ProfileResponse.builder()
                .accountId(1L)
                .tenantId(tenantId)
                .externalUserId(userId)
                .phoneNumber(userId)
                .fullName("Jean-Baptiste Natcash VIP")
                .currentPoints(new BigDecimal("5040"))
                .tierPoints(new BigDecimal("4200"))
                .status(CommonStatus.ACTIVE)
                .build();

        when(accountRepository.findByTenantIdAndExternalUserId(tenantId, userId)).thenReturn(Optional.of(vipAccount));
        when(agentRepository.findByTenantIdAndExternalUserId(tenantId, userId)).thenReturn(Optional.of(seededAgent));
        when(accountService.getOrCreateProfile(eq(tenantId), any(ProfileRequest.class))).thenReturn(profile);

        TenantUserContextResponse ctx = fullService.authenticateTenantUser(tenantId, TenantUserAuthRequest.builder()
                .tenantId(tenantId)
                .externalUserId(userId)
                .authMethod("SSO_SWITCH")
                .build());

        assertEquals("CUSTOMER", ctx.getAccountRole());
        assertEquals(userId, ctx.getExternalUserId());
        assertNotNull(ctx.getAccessToken());
    }
}
