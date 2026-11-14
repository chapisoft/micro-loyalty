package com.natcash.loyalty.game;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.agent.entity.AgentLoyaltyProgramEntity;
import com.natcash.loyalty.agent.entity.AgentMonthlyKpiEntity;
import com.natcash.loyalty.agent.entity.SuperAgentNetworkKpiEntity;
import com.natcash.loyalty.agent.repository.AgentLoyaltyProgramRepository;
import com.natcash.loyalty.agent.repository.AgentMonthlyKpiRepository;
import com.natcash.loyalty.agent.repository.SuperAgentNetworkKpiRepository;
import com.natcash.loyalty.agent.repository.SupportPlaybookRepository;
import com.natcash.loyalty.agent.service.AgentLoyaltyService;
import com.natcash.loyalty.domain.enums.AgentKpiRewardStatus;
import com.natcash.loyalty.domain.enums.AgentRoleType;
import com.natcash.loyalty.domain.enums.ApiKeyStatus;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.game.entity.GameMonthlyLeaderboardEntity;
import com.natcash.loyalty.game.entity.LearningCourseEntity;
import com.natcash.loyalty.game.entity.LearningQuestionEntity;
import com.natcash.loyalty.game.entity.LearningUserProgressEntity;
import com.natcash.loyalty.game.repository.GameMonthlyLeaderboardRepository;
import com.natcash.loyalty.game.repository.LearningCourseRepository;
import com.natcash.loyalty.game.repository.LearningQuestionRepository;
import com.natcash.loyalty.game.repository.LearningUserProgressRepository;
import com.natcash.loyalty.game.service.LearningQuizService;
import com.natcash.loyalty.game.service.LearningQuizService.QuizSubmitResponse;
import com.natcash.loyalty.partner.entity.PartnerApiKeyEntity;
import com.natcash.loyalty.partner.repository.PartnerApiKeyRepository;
import com.natcash.loyalty.partner.service.PartnerApiKeyService;
import com.natcash.loyalty.partner.service.PartnerApiKeyService.PartnerApiKeyDto;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LearningQuizAndAgentTest {

        private static final String TENANT_ID = "TENANT_NATCASH";

        @Mock
        private LearningCourseRepository courseRepository;
        @Mock
        private LearningQuestionRepository questionRepository;
        @Mock
        private LearningUserProgressRepository progressRepository;
        @Mock
        private GameMonthlyLeaderboardRepository leaderboardRepository;
        @Mock
        private LoyaltyAccountRepository accountRepository;
        @Mock
        private AgentLoyaltyProgramRepository agentRepository;
        @Mock
        private AgentMonthlyKpiRepository kpiRepository;
        @Mock
        private SuperAgentNetworkKpiRepository superAgentKpiRepository;
        @Mock
        private SupportPlaybookRepository playbookRepository;
        @Mock
        private PartnerApiKeyRepository apiKeyRepository;

        @Test
        void submitQuiz_shouldGradeServerSideAndAwardTieredPoints() {
                LearningQuizService quizService = new LearningQuizService(
                                courseRepository, questionRepository, progressRepository, leaderboardRepository);
                ReflectionTestUtils.setField(quizService, "accountRepository", accountRepository);

                LearningCourseEntity course = LearningCourseEntity.builder()
                                .id(1L)
                                .tenantId(TENANT_ID)
                                .courseCode("ENGLISH_DAILY")
                                .rewardTier1Points(new BigDecimal("20.00"))
                                .rewardTier2Points(new BigDecimal("50.00"))
                                .rewardTier3Points(new BigDecimal("100.00"))
                                .build();

                List<LearningQuestionEntity> questions = List.of(
                                LearningQuestionEntity.builder().id(101L).correctOptionIndex(0).build(),
                                LearningQuestionEntity.builder().id(102L).correctOptionIndex(1).build(),
                                LearningQuestionEntity.builder().id(103L).correctOptionIndex(2).build(),
                                LearningQuestionEntity.builder().id(104L).correctOptionIndex(3).build(),
                                LearningQuestionEntity.builder().id(105L).correctOptionIndex(0).build());

                Map<Long, Integer> answers = new LinkedHashMap<>();
                answers.put(101L, 0);
                answers.put(102L, 1);
                answers.put(103L, 2);
                answers.put(104L, 3);
                answers.put(105L, 0);

                LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                                .id(55L)
                                .tenantId(TENANT_ID)
                                .externalUserId("50937123456")
                                .currentPoints(new BigDecimal("100.00"))
                                .build();

                when(courseRepository.findByIdAndTenantId(1L, TENANT_ID)).thenReturn(Optional.of(course));
                when(questionRepository.findByTenantIdAndCourseIdAndStatusOrderByDisplayOrderAscIdAsc(
                                TENANT_ID, 1L, CommonStatus.ACTIVE)).thenReturn(questions);
                when(progressRepository.countByTenantIdAndExternalUserIdAndCourseId(TENANT_ID, "50937123456", 1L))
                                .thenReturn(0L);
                when(progressRepository.save(any())).thenAnswer(inv -> {
                        LearningUserProgressEntity e = inv.getArgument(0);
                        e.setId(77L);
                        return e;
                });
                when(accountRepository.findByTenantIdAndExternalUserIdForUpdate(TENANT_ID, "50937123456"))
                                .thenReturn(Optional.of(account));
                when(leaderboardRepository.findByTenantIdAndLeaderboardMonthAndExternalUserId(any(), any(), any()))
                                .thenReturn(Optional.empty());
                when(leaderboardRepository.save(any()))
                                .thenAnswer(inv -> (GameMonthlyLeaderboardEntity) inv.getArgument(0));

                QuizSubmitResponse resp = quizService.submitQuiz(TENANT_ID, 1L, "50937123456", answers);

                assertEquals(5, resp.getCorrectCount());
                assertEquals(0, new BigDecimal("20.00").compareTo(resp.getPointsAwarded()));
                assertEquals(0, new BigDecimal("120.00").compareTo(account.getCurrentPoints()));
        }

        @Test
        void rotateKey_shouldSetGraceExpiresAtAndReturnSecretOnce() {
                PartnerApiKeyService keyService = new PartnerApiKeyService(apiKeyRepository);
                PartnerApiKeyEntity oldKey = PartnerApiKeyEntity.builder()
                                .id(1L)
                                .tenantId(TENANT_ID)
                                .partnerId(10L)
                                .keyPrefix("nk_live_old")
                                .status(ApiKeyStatus.ACTIVE)
                                .build();

                when(apiKeyRepository.findByTenantIdAndPartnerIdAndStatus(TENANT_ID, 10L, ApiKeyStatus.ACTIVE))
                                .thenReturn(List.of(oldKey));
                when(apiKeyRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

                PartnerApiKeyDto created = keyService.rotateKey(TENANT_ID, 10L, "Primary", "READ,REDEEM",
                                "partner_admin");

                assertNotNull(created.getPlainSecretKeyOnce());
                assertTrue(created.getPlainSecretKeyOnce().startsWith("nk_live_"));
                assertEquals(ApiKeyStatus.GRACE_PERIOD, oldKey.getStatus());
                assertNotNull(oldKey.getGraceExpiresAt());
        }

        @Test
        void agentAndSuperAgent_shouldCalculate2000And10000HtgEligibility() {
                AgentLoyaltyService agentService = new AgentLoyaltyService(
                                agentRepository, kpiRepository, superAgentKpiRepository, playbookRepository);

                AgentLoyaltyProgramEntity superAgent = AgentLoyaltyProgramEntity.builder()
                                .id(1L)
                                .tenantId(TENANT_ID)
                                .agentRole(AgentRoleType.SUPER_AGENT)
                                .rewardAmountHtg(new BigDecimal("10000.00"))
                                .build();
                AgentLoyaltyProgramEntity sub1 = AgentLoyaltyProgramEntity.builder()
                                .id(2L)
                                .tenantId(TENANT_ID)
                                .superAgentId(1L)
                                .monthlyCustomerTarget(100)
                                .rewardAmountHtg(new BigDecimal("2000.00"))
                                .build();
                AgentLoyaltyProgramEntity sub2 = AgentLoyaltyProgramEntity.builder()
                                .id(3L)
                                .tenantId(TENANT_ID)
                                .superAgentId(1L)
                                .monthlyCustomerTarget(100)
                                .rewardAmountHtg(new BigDecimal("2000.00"))
                                .build();

                AgentMonthlyKpiEntity sub1Kpi = agentService.evaluateAgentKpi(
                                AgentMonthlyKpiEntity.builder().qualifiedCustomers(105).targetCustomers(100).build(),
                                sub1);
                assertTrue(sub1Kpi.getRewardEligible());
                assertEquals(0, new BigDecimal("2000.00").compareTo(sub1Kpi.getRewardAmount()));

                when(kpiRepository.findByTenantIdAndAgentIdAndKpiMonth(TENANT_ID, 2L, "2026-11"))
                                .thenReturn(Optional.of(sub1Kpi));
                when(kpiRepository.findByTenantIdAndAgentIdAndKpiMonth(TENANT_ID, 3L, "2026-11"))
                                .thenReturn(Optional.of(AgentMonthlyKpiEntity.builder().rewardEligible(false).build()));
                when(superAgentKpiRepository.findByTenantIdAndSuperAgentIdAndKpiMonth(TENANT_ID, 1L, "2026-11"))
                                .thenReturn(Optional.empty());

                SuperAgentNetworkKpiEntity netKpi = agentService.evaluateSuperAgentNetworkKpi(
                                TENANT_ID, superAgent, List.of(sub1, sub2), "2026-11");
                assertEquals(0, new BigDecimal("50.00").compareTo(netKpi.getAchievementRatePct()));
                assertEquals(AgentKpiRewardStatus.ELIGIBLE, netKpi.getRewardStatus());
                assertEquals(0, new BigDecimal("10000.00").compareTo(netKpi.getRewardAmount()));
        }
}
