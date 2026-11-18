package com.natcash.loyalty.game.service;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.codegeneration.domain.CodeType;
import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService;
import com.natcash.loyalty.config.SystemParamSpec;
import com.natcash.loyalty.config.service.SystemParameterService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.CurrencyAssetType;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.game.dto.GameHubDto.GameDashboardStatsResponse;
import com.natcash.loyalty.game.entity.GameMonthlyLeaderboardEntity;
import com.natcash.loyalty.game.entity.LearningCourseEntity;
import com.natcash.loyalty.game.entity.LearningQuestionEntity;
import com.natcash.loyalty.game.entity.LearningUserProgressEntity;
import com.natcash.loyalty.game.repository.GameMonthlyLeaderboardRepository;
import com.natcash.loyalty.game.repository.LearningCourseRepository;
import com.natcash.loyalty.game.repository.LearningQuestionRepository;
import com.natcash.loyalty.game.repository.LearningUserProgressRepository;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.ledger.service.PointBucketFifoService;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class LearningQuizService {

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneOffset.UTC);

    private final LearningCourseRepository courseRepository;
    private final LearningQuestionRepository questionRepository;
    private final LearningUserProgressRepository progressRepository;
    private final GameMonthlyLeaderboardRepository leaderboardRepository;

    @Autowired(required = false)
    private LoyaltyAccountRepository accountRepository;

    @Autowired(required = false)
    private LoyaltyPointLedgerRepository ledgerRepository;

    @Autowired(required = false)
    private PointBucketFifoService fifoService;

    @Autowired(required = false)
    private GameHubService gameHubService;

    @Autowired(required = false)
    private GameLeaderboardService gameLeaderboardService;

    public LearningQuizService(LearningCourseRepository courseRepository,
                               LearningQuestionRepository questionRepository,
                               LearningUserProgressRepository progressRepository,
                               GameMonthlyLeaderboardRepository leaderboardRepository) {
        this.courseRepository = courseRepository;
        this.questionRepository = questionRepository;
        this.progressRepository = progressRepository;
        this.leaderboardRepository = leaderboardRepository;
    }

    @Transactional(readOnly = true)
    public List<LearningCourseEntity> listActiveCourses(String tenantId) {
        return courseRepository.findByTenantIdAndStatusOrderByIdAsc(tenantId, CommonStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public List<QuestionPublicDto> getCourseQuestions(String tenantId, Long courseId) {
        courseRepository.findByIdAndTenantId(courseId, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        return questionRepository
                .findByTenantIdAndCourseIdAndStatusOrderByDisplayOrderAscIdAsc(tenantId, courseId, CommonStatus.ACTIVE)
                .stream()
                .map(q -> QuestionPublicDto.builder()
                        .id(q.getId())
                        .courseId(q.getCourseId())
                        .questionText(q.getQuestionText())
                        .options(q.getOptions())
                        .audioUrl(q.getAudioUrl())
                        .difficulty(q.getDifficulty())
                        .displayOrder(q.getDisplayOrder())
                        .build())
                .toList();
    }

    @Transactional
    public QuizSubmitResponse submitQuiz(String tenantId, Long courseId, String externalUserId, Map<Long, Integer> answers) {
        LearningCourseEntity course = courseRepository.findByIdAndTenantId(courseId, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));

        List<LearningQuestionEntity> questions = questionRepository
                .findByTenantIdAndCourseIdAndStatusOrderByDisplayOrderAscIdAsc(tenantId, courseId, CommonStatus.ACTIVE);
        if (questions.isEmpty()) {
            throw new LoyaltyException(ErrorCode.NOT_FOUND);
        }

        int correctCount = 0;
        Map<Long, Integer> safeAnswers = answers != null ? answers : Collections.emptyMap();
        for (LearningQuestionEntity q : questions) {
            Integer chosen = safeAnswers.get(q.getId());
            if (chosen != null && chosen.equals(q.getCorrectOptionIndex())) {
                correctCount++;
            }
        }

        BigDecimal pointsAwarded = calculateTieredReward(course, correctCount);
        int score = correctCount * 100;
        long previousAttempts = progressRepository.countByTenantIdAndExternalUserIdAndCourseId(
                tenantId, externalUserId, courseId);

        LearningUserProgressEntity progress = progressRepository.save(LearningUserProgressEntity.builder()
                .tenantId(tenantId)
                .externalUserId(externalUserId)
                .courseId(courseId)
                .attemptNo((int) previousAttempts + 1)
                .correctCount(correctCount)
                .totalQuestions(questions.size())
                .score(score)
                .pointsAwarded(pointsAwarded)
                .build());

        if (pointsAwarded.compareTo(BigDecimal.ZERO) > 0 && accountRepository != null) {
            accountRepository.findByTenantIdAndExternalUserIdForUpdate(tenantId, externalUserId)
                    .ifPresent(account -> creditQuizPoints(tenantId, account, course, pointsAwarded));
        }

        if (gameLeaderboardService != null) {
            gameLeaderboardService.awardGamePoints(
                    tenantId,
                    externalUserId,
                    GameLeaderboardService.SOURCE_LEARNING_LESSON,
                    score,
                    course.getCourseCode(),
                    "QUIZ_" + progress.getId(),
                    false);
        } else {
            updateLeaderboard(tenantId, externalUserId, score);
        }

        return QuizSubmitResponse.builder()
                .progressId(progress.getId())
                .courseId(courseId)
                .courseCode(course.getCourseCode())
                .correctCount(correctCount)
                .totalQuestions(questions.size())
                .score(score)
                .pointsAwarded(pointsAwarded)
                .attemptNo(progress.getAttemptNo())
                .build();
    }

    public BigDecimal calculateTieredReward(LearningCourseEntity course, int correctCount) {
        SystemParameterService paramService = SystemParameterService.get();
        String tenantId = course.getTenantId();
        if (correctCount >= paramService.getInt(tenantId, SystemParamSpec.LEARNING_TIER3_CORRECT)) {
            return course.getRewardTier3Points() != null ? course.getRewardTier3Points() : new BigDecimal("100.00");
        }
        if (correctCount >= paramService.getInt(tenantId, SystemParamSpec.LEARNING_TIER2_CORRECT)) {
            return course.getRewardTier2Points() != null ? course.getRewardTier2Points() : new BigDecimal("50.00");
        }
        if (correctCount >= paramService.getInt(tenantId, SystemParamSpec.LEARNING_TIER1_CORRECT)) {
            return course.getRewardTier1Points() != null ? course.getRewardTier1Points() : new BigDecimal("20.00");
        }
        return BigDecimal.ZERO;
    }

    private void creditQuizPoints(String tenantId,
                                  LoyaltyAccountEntity account,
                                  LearningCourseEntity course,
                                  BigDecimal points) {
        BigDecimal nextBalance = (account.getCurrentPoints() != null ? account.getCurrentPoints() : BigDecimal.ZERO).add(points);
        account.setCurrentPoints(nextBalance);
        accountRepository.save(account);

        String ref = CentralizedCodeGeneratorService.get().generateCode(
                CodeType.QUIZ_REWARD_TX,
                Map.of("scope", course.getCourseCode()));
        if (fifoService != null && account.getId() != null) {
            int expiryMonths = SystemParameterService.get().getInt(tenantId, SystemParamSpec.WALLET_DEFAULT_POINT_EXPIRATION_MONTHS);
            Instant exp = Instant.now().plus(expiryMonths * 30L, ChronoUnit.DAYS);
            fifoService.createEarnBucket(tenantId, account.getId(), points, exp, ref, CurrencyAssetType.LOYALTY_COIN);
        }
        if (ledgerRepository != null) {
            ledgerRepository.save(LoyaltyPointLedgerEntity.builder()
                    .tenantId(tenantId)
                    .account(account)
                    .pointChange(points)
                    .balanceAfter(nextBalance)
                    .changeType(PointActionType.REWARD)
                    .referenceCode(ref)
                    .description("Learning quiz reward: " + course.getCourseCode())
                    .createdAt(Instant.now())
                    .build());
        }
    }

    private void updateLeaderboard(String tenantId, String externalUserId, int deltaScore) {
        String month = MONTH_FMT.format(Instant.now());
        GameMonthlyLeaderboardEntity entry = leaderboardRepository
                .findByTenantIdAndLeaderboardMonthAndExternalUserId(tenantId, month, externalUserId)
                .orElseGet(() -> GameMonthlyLeaderboardEntity.builder()
                        .tenantId(tenantId)
                        .leaderboardMonth(month)
                        .externalUserId(externalUserId)
                        .displayName(externalUserId)
                        .totalScore(0)
                        .gamesPlayed(0)
                        .build());
        entry.setTotalScore(entry.getTotalScore() + deltaScore);
        entry.setGamesPlayed(entry.getGamesPlayed() + 1);
        leaderboardRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<GameMonthlyLeaderboardEntity> getLeaderboard(String tenantId, String month) {
        String targetMonth = month != null && !month.isBlank() ? month.trim() : MONTH_FMT.format(Instant.now());
        return leaderboardRepository.findTop50ByTenantIdAndLeaderboardMonthOrderByTotalScoreDesc(tenantId, targetMonth);
    }

    @Transactional(readOnly = true)
    public List<LearningQuestionEntity> listAdminQuestions(String tenantId, Long courseId) {
        if (courseId != null) {
            return questionRepository.findByTenantIdAndCourseIdAndStatusOrderByDisplayOrderAscIdAsc(
                    tenantId, courseId, CommonStatus.ACTIVE);
        }
        return questionRepository.findByTenantIdOrderByCourseIdAscDisplayOrderAsc(tenantId);
    }

    @Transactional
    public LearningQuestionEntity saveAdminQuestion(String tenantId, LearningQuestionEntity question) {
        question.setTenantId(tenantId);
        if (question.getStatus() == null) {
            question.setStatus(CommonStatus.ACTIVE);
        }
        return questionRepository.save(question);
    }

    @Transactional
    public void deleteAdminQuestion(String tenantId, Long id) {
        LearningQuestionEntity existing = questionRepository.findById(id)
                .filter(q -> tenantId.equals(q.getTenantId()))
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        questionRepository.delete(existing);
    }

    @Transactional
    public List<LearningQuestionEntity> importQuestions(String tenantId, List<LearningQuestionEntity> questions) {
        if (questions == null || questions.isEmpty()) {
            return Collections.emptyList();
        }
        for (LearningQuestionEntity q : questions) {
            q.setTenantId(tenantId);
            if (q.getStatus() == null) {
                q.setStatus(CommonStatus.ACTIVE);
            }
        }
        return questionRepository.saveAll(questions);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAdminGameStatistics(String tenantId) {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("tenantId", tenantId);
        stats.put("activeCourses", courseRepository.findByTenantIdAndStatusOrderByIdAsc(tenantId, CommonStatus.ACTIVE).size());
        stats.put("totalQuestions", questionRepository.findByTenantIdOrderByCourseIdAscDisplayOrderAsc(tenantId).size());
        stats.put("leaderboardCount", leaderboardRepository
                .findTop50ByTenantIdAndLeaderboardMonthOrderByTotalScoreDesc(tenantId, MONTH_FMT.format(Instant.now())).size());
        if (gameHubService != null) {
            GameDashboardStatsResponse hubStats = gameHubService.getGameDashboardStats(tenantId);
            stats.put("hubDashboardStats", hubStats);
        }
        return stats;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionPublicDto {
        private Long id;
        private Long courseId;
        private String questionText;
        private String options;
        private String audioUrl;
        private String difficulty;
        private Integer displayOrder;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizSubmitResponse {
        private Long progressId;
        private Long courseId;
        private String courseCode;
        private int correctCount;
        private int totalQuestions;
        private int score;
        private BigDecimal pointsAwarded;
        private int attemptNo;
    }
}
