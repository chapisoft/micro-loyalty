package com.natcash.loyalty.game.service;

import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.game.entity.GameMonthlyLeaderboardEntity;
import com.natcash.loyalty.game.entity.GamePointLedgerEntity;
import com.natcash.loyalty.game.entity.GamePointRuleEntity;
import com.natcash.loyalty.game.entity.LeaderboardPayoutEntity;
import com.natcash.loyalty.game.entity.LeaderboardPrizeEntity;
import com.natcash.loyalty.game.repository.GameMonthlyLeaderboardRepository;
import com.natcash.loyalty.game.repository.GamePointLedgerRepository;
import com.natcash.loyalty.game.repository.GamePointRuleRepository;
import com.natcash.loyalty.game.repository.LeaderboardPayoutRepository;
import com.natcash.loyalty.game.repository.LeaderboardPrizeRepository;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Game points (pts) and Monthly Leaderboard Engine (Figma 18/11 · GM-01 & GM-10).
 * Game points are non-spendable, reset on the 1st of every month, and strictly separate from Natcash Coins.
 */
@Service
@RequiredArgsConstructor
public class GameLeaderboardService {

    private static final Logger log = LoggerFactory.getLogger(GameLeaderboardService.class);
    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneOffset.UTC);

    public static final String BOARD_ALL = "ALL";
    public static final String BOARD_LEARNING = "LEARNING";
    public static final String BOARD_MINI_GAMES = "MINI_GAMES";

    public static final String SOURCE_MINI_GAME = "MINI_GAME";
    public static final String SOURCE_LEARNING_LESSON = "LEARNING_LESSON";
    public static final String SOURCE_DAILY_CHALLENGE = "DAILY_CHALLENGE";
    public static final String SOURCE_CHECKIN_STREAK = "CHECKIN_STREAK";
    public static final String SOURCE_LUCKY_PARTICIPATION = "LUCKY_GAME_PARTICIPATION";

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String FORMULA_PER_SCORE_UNIT = "PER_SCORE_UNIT";
    private static final String APPROVAL_PENDING = "PENDING_APPROVAL";
    private static final String APPROVAL_APPROVED = "APPROVED";
    private static final String APPROVAL_REJECTED = "REJECTED";

    private final GamePointRuleRepository ruleRepository;
    private final GamePointLedgerRepository ledgerRepository;
    private final GameMonthlyLeaderboardRepository leaderboardRepository;
    private final LeaderboardPrizeRepository prizeRepository;
    private final LeaderboardPayoutRepository payoutRepository;

    /**
     * Awards monthly game pts for a completed gameplay/learning event.
     * Buying extra plays with coins NEVER earns game pts.
     */
    @Transactional
    public int awardGamePoints(String tenantId,
                               String externalUserId,
                               String sourceCode,
                               int rawScore,
                               String gameCode,
                               String referenceCode,
                               boolean coinPurchasedPlay) {
        if (coinPurchasedPlay || externalUserId == null || externalUserId.isBlank() || sourceCode == null) {
            return 0;
        }

        String normalizedSource = sourceCode.trim().toUpperCase();
        GamePointRuleEntity rule = ruleRepository.findByTenantIdAndSourceCode(tenantId, normalizedSource)
                .orElseGet(() -> defaultRule(tenantId, normalizedSource));

        if (!STATUS_ACTIVE.equalsIgnoreCase(rule.getStatus())) {
            return 0;
        }

        int computedPts = computeActionPoints(rule, rawScore);
        if (computedPts <= 0) {
            return 0;
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Integer alreadyToday = ledgerRepository.sumDailyPoints(tenantId, externalUserId, normalizedSource, today);
        int earnedToday = alreadyToday != null ? alreadyToday : 0;
        int remainingCap = Math.max(0, rule.getDailyCapPts() - earnedToday);
        int ptsAwarded = Math.min(computedPts, remainingCap);
        if (ptsAwarded <= 0) {
            return 0;
        }

        String month = MONTH_FMT.format(Instant.now());
        String boardType = normalizeBoard(rule.getBoardType());

        ledgerRepository.save(GamePointLedgerEntity.builder()
                .tenantId(tenantId)
                .externalUserId(externalUserId)
                .sourceCode(normalizedSource)
                .boardType(boardType)
                .gameCode(gameCode)
                .referenceCode(referenceCode)
                .ptsAwarded(ptsAwarded)
                .earnedDate(today)
                .leaderboardMonth(month)
                .build());

        upsertMonthlyBoard(tenantId, month, BOARD_ALL, externalUserId, ptsAwarded);
        if (!BOARD_ALL.equals(boardType)) {
            upsertMonthlyBoard(tenantId, month, boardType, externalUserId, ptsAwarded);
        }

        return ptsAwarded;
    }

    @Transactional(readOnly = true)
    public List<GameMonthlyLeaderboardEntity> getLeaderboard(String tenantId, String month, String boardType) {
        String targetMonth = (month != null && !month.isBlank()) ? month.trim() : MONTH_FMT.format(Instant.now());
        String targetBoard = normalizeBoard(boardType);
        List<GameMonthlyLeaderboardEntity> rows = leaderboardRepository
                .findTop100ByTenantIdAndLeaderboardMonthAndBoardTypeOrderByTotalScoreDesc(tenantId, targetMonth, targetBoard);
        for (int i = 0; i < rows.size(); i++) {
            rows.get(i).setRankPosition(i + 1);
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPublicRulesAndPrizes(String tenantId, String boardType) {
        String targetBoard = normalizeBoard(boardType);
        List<GamePointRuleEntity> rules = ruleRepository.findByTenantIdOrderBySourceCodeAsc(tenantId);
        List<LeaderboardPrizeEntity> prizes = prizeRepository
                .findByTenantIdAndBoardTypeAndStatusOrderByRankFromAsc(tenantId, targetBoard, STATUS_ACTIVE);
        if (prizes.isEmpty() && !BOARD_ALL.equals(targetBoard)) {
            prizes = prizeRepository.findByTenantIdAndBoardTypeAndStatusOrderByRankFromAsc(tenantId, BOARD_ALL, STATUS_ACTIVE);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("boardType", targetBoard);
        result.put("month", MONTH_FMT.format(Instant.now()));
        result.put("rules", rules);
        result.put("prizes", prizes);
        result.put("coinPurchasedPlaysEarnPts", false);
        result.put("resetDayOfMonth", 1);
        return result;
    }

    @Transactional(readOnly = true)
    public List<GamePointRuleEntity> listRules(String tenantId) {
        return ruleRepository.findByTenantIdOrderBySourceCodeAsc(tenantId);
    }

    @Transactional
    public GamePointRuleEntity saveRule(String tenantId, GamePointRuleEntity req) {
        if (req.getSourceCode() == null || req.getSourceCode().isBlank()) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, "sourceCode is required");
        }
        String code = req.getSourceCode().trim().toUpperCase();
        GamePointRuleEntity entity = (req.getId() != null
                ? ruleRepository.findById(req.getId()).filter(r -> tenantId.equals(r.getTenantId())).orElse(null)
                : ruleRepository.findByTenantIdAndSourceCode(tenantId, code).orElse(null));
        if (entity == null) {
            entity = GamePointRuleEntity.builder().tenantId(tenantId).sourceCode(code).build();
        }
        entity.setBoardType(normalizeBoard(req.getBoardType()));
        entity.setFormulaType(req.getFormulaType() != null ? req.getFormulaType().trim().toUpperCase() : "FIXED");
        entity.setBasePts(req.getBasePts() != null ? Math.max(0, req.getBasePts()) : 10);
        entity.setScoreDivisor(req.getScoreDivisor() != null ? Math.max(1, req.getScoreDivisor()) : 1);
        entity.setMaxPtsPerAction(req.getMaxPtsPerAction() != null ? Math.max(0, req.getMaxPtsPerAction()) : 200);
        entity.setDailyCapPts(req.getDailyCapPts() != null ? Math.max(0, req.getDailyCapPts()) : 500);
        entity.setStatus(req.getStatus() != null ? req.getStatus().trim().toUpperCase() : STATUS_ACTIVE);
        entity.setDescription(req.getDescription());
        return ruleRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<LeaderboardPrizeEntity> listPrizes(String tenantId) {
        return prizeRepository.findByTenantIdOrderByBoardTypeAscRankFromAsc(tenantId);
    }

    @Transactional
    public LeaderboardPrizeEntity savePrize(String tenantId, LeaderboardPrizeEntity req) {
        if (req.getRankFrom() == null || req.getRankTo() == null || req.getRankFrom() < 1 || req.getRankTo() < req.getRankFrom()) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, "Invalid rank range");
        }
        LeaderboardPrizeEntity entity = req.getId() != null
                ? prizeRepository.findById(req.getId())
                        .filter(p -> tenantId.equals(p.getTenantId()))
                        .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND))
                : LeaderboardPrizeEntity.builder().tenantId(tenantId).build();

        entity.setBoardType(normalizeBoard(req.getBoardType()));
        entity.setRankFrom(req.getRankFrom());
        entity.setRankTo(req.getRankTo());
        entity.setPrizeType(req.getPrizeType() != null ? req.getPrizeType().trim().toUpperCase() : "VOUCHER");
        entity.setPrizeLabel(req.getPrizeLabel() != null ? req.getPrizeLabel().trim() : "");
        entity.setPrizeValue(req.getPrizeValue() != null ? req.getPrizeValue() : BigDecimal.ZERO);
        entity.setVoucherCode(req.getVoucherCode());
        entity.setSponsorName(req.getSponsorName());
        entity.setStatus(req.getStatus() != null ? req.getStatus().trim().toUpperCase() : STATUS_ACTIVE);
        return prizeRepository.save(entity);
    }

    @Transactional
    public void deletePrize(String tenantId, Long id) {
        LeaderboardPrizeEntity prize = prizeRepository.findById(id)
                .filter(p -> tenantId.equals(p.getTenantId()))
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        prizeRepository.delete(prize);
    }

    @Transactional(readOnly = true)
    public List<LeaderboardPayoutEntity> listPayouts(String tenantId, String month) {
        if (month != null && !month.isBlank()) {
            return payoutRepository.findByTenantIdAndLeaderboardMonthOrderByBoardTypeAscRankPositionAsc(tenantId, month.trim());
        }
        return payoutRepository.findByTenantIdOrderByLeaderboardMonthDescRankPositionAsc(tenantId);
    }

    /**
     * Monthly close job (00:00 on the 1st of every month): locks previous month rankings
     * and generates PENDING_APPROVAL payouts for dual-approval (QT-04).
     */
    @Scheduled(cron = "0 0 0 1 * *", zone = "UTC")
    @Transactional
    public void runMonthlyCloseJob() {
        String previousMonth = YearMonth.now(ZoneOffset.UTC).minusMonths(1).toString();
        for (String tenant : List.of("TENANT_NATCASH", "NATCASH", "TENANT_DELIMART")) {
            try {
                List<LeaderboardPayoutEntity> created = closeMonthAndGeneratePayouts(tenant, previousMonth);
                if (!created.isEmpty()) {
                    log.info("[LEADERBOARD-MONTHLY-CLOSE] tenant={}, month={}, payoutsCreated={}",
                            tenant, previousMonth, created.size());
                }
            } catch (Exception ex) {
                log.error("[LEADERBOARD-MONTHLY-CLOSE] failed for tenant={}, month={}", tenant, previousMonth, ex);
            }
        }
    }

    @Transactional
    public List<LeaderboardPayoutEntity> closeMonthAndGeneratePayouts(String tenantId, String month) {
        String targetMonth = (month != null && !month.isBlank())
                ? month.trim()
                : YearMonth.now(ZoneOffset.UTC).minusMonths(1).toString();

        List<LeaderboardPayoutEntity> created = new ArrayList<>();
        for (String board : List.of(BOARD_ALL, BOARD_LEARNING, BOARD_MINI_GAMES)) {
            List<LeaderboardPrizeEntity> prizes = prizeRepository
                    .findByTenantIdAndBoardTypeAndStatusOrderByRankFromAsc(tenantId, board, STATUS_ACTIVE);
            if (prizes.isEmpty()) {
                continue;
            }
            List<GameMonthlyLeaderboardEntity> ranked = leaderboardRepository
                    .findTop100ByTenantIdAndLeaderboardMonthAndBoardTypeOrderByTotalScoreDesc(tenantId, targetMonth, board);
            for (int i = 0; i < ranked.size(); i++) {
                int rank = i + 1;
                GameMonthlyLeaderboardEntity row = ranked.get(i);
                LeaderboardPrizeEntity matched = findPrizeForRank(prizes, rank);
                if (matched == null) {
                    continue;
                }
                if (payoutRepository.findByTenantIdAndLeaderboardMonthAndBoardTypeAndExternalUserId(
                        tenantId, targetMonth, board, row.getExternalUserId()).isPresent()) {
                    continue;
                }
                LeaderboardPayoutEntity payout = payoutRepository.save(LeaderboardPayoutEntity.builder()
                        .tenantId(tenantId)
                        .leaderboardMonth(targetMonth)
                        .boardType(board)
                        .externalUserId(row.getExternalUserId())
                        .displayName(row.getDisplayName())
                        .rankPosition(rank)
                        .totalPts(row.getTotalScore())
                        .prizeId(matched.getId())
                        .prizeLabel(matched.getPrizeLabel())
                        .prizeType(matched.getPrizeType())
                        .prizeValue(matched.getPrizeValue())
                        .approvalStatus(APPROVAL_PENDING)
                        .build());
                created.add(payout);
            }
        }
        return created;
    }

    @Transactional
    public LeaderboardPayoutEntity approvePayout(String tenantId, Long payoutId, String approver) {
        LeaderboardPayoutEntity payout = payoutRepository.findById(payoutId)
                .filter(p -> tenantId.equals(p.getTenantId()))
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        if (!APPROVAL_PENDING.equals(payout.getApprovalStatus())) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Payout is not pending approval");
        }
        Instant now = Instant.now();
        payout.setApprovalStatus(APPROVAL_APPROVED);
        payout.setApprovedBy(approver != null && !approver.isBlank() ? approver : "checker");
        payout.setApprovedAt(now);
        payout.setNotifiedAt(now);
        return payoutRepository.save(payout);
    }

    @Transactional
    public LeaderboardPayoutEntity rejectPayout(String tenantId, Long payoutId, String approver) {
        LeaderboardPayoutEntity payout = payoutRepository.findById(payoutId)
                .filter(p -> tenantId.equals(p.getTenantId()))
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        if (!APPROVAL_PENDING.equals(payout.getApprovalStatus())) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Payout is not pending approval");
        }
        payout.setApprovalStatus(APPROVAL_REJECTED);
        payout.setApprovedBy(approver != null && !approver.isBlank() ? approver : "checker");
        payout.setApprovedAt(Instant.now());
        return payoutRepository.save(payout);
    }

    private void upsertMonthlyBoard(String tenantId, String month, String boardType, String userId, int ptsDelta) {
        GameMonthlyLeaderboardEntity entry = leaderboardRepository
                .findByTenantIdAndLeaderboardMonthAndBoardTypeAndExternalUserId(tenantId, month, boardType, userId)
                .orElseGet(() -> GameMonthlyLeaderboardEntity.builder()
                        .tenantId(tenantId)
                        .leaderboardMonth(month)
                        .boardType(boardType)
                        .externalUserId(userId)
                        .displayName(maskPhone(userId))
                        .totalScore(0)
                        .gamesPlayed(0)
                        .build());
        entry.setTotalScore((entry.getTotalScore() != null ? entry.getTotalScore() : 0) + ptsDelta);
        entry.setGamesPlayed((entry.getGamesPlayed() != null ? entry.getGamesPlayed() : 0) + 1);
        leaderboardRepository.save(entry);
    }

    private int computeActionPoints(GamePointRuleEntity rule, int rawScore) {
        if (FORMULA_PER_SCORE_UNIT.equalsIgnoreCase(rule.getFormulaType())) {
            int divisor = Math.max(1, rule.getScoreDivisor() != null ? rule.getScoreDivisor() : 1);
            int scaled = Math.max(rule.getBasePts(), rawScore / divisor);
            return Math.min(scaled, rule.getMaxPtsPerAction());
        }
        return Math.min(rule.getBasePts(), rule.getMaxPtsPerAction());
    }

    private LeaderboardPrizeEntity findPrizeForRank(List<LeaderboardPrizeEntity> prizes, int rank) {
        for (LeaderboardPrizeEntity p : prizes) {
            if (p.getRankFrom() <= rank && rank <= p.getRankTo()) {
                return p;
            }
        }
        return null;
    }

    private GamePointRuleEntity defaultRule(String tenantId, String sourceCode) {
        return switch (sourceCode) {
            case SOURCE_MINI_GAME -> GamePointRuleEntity.builder()
                    .tenantId(tenantId).sourceCode(sourceCode).boardType(BOARD_MINI_GAMES)
                    .formulaType(FORMULA_PER_SCORE_UNIT).basePts(20).scoreDivisor(10)
                    .maxPtsPerAction(200).dailyCapPts(600).status(STATUS_ACTIVE).build();
            case SOURCE_LEARNING_LESSON -> GamePointRuleEntity.builder()
                    .tenantId(tenantId).sourceCode(sourceCode).boardType(BOARD_LEARNING)
                    .formulaType(FORMULA_PER_SCORE_UNIT).basePts(50).scoreDivisor(1)
                    .maxPtsPerAction(300).dailyCapPts(900).status(STATUS_ACTIVE).build();
            case SOURCE_LUCKY_PARTICIPATION -> GamePointRuleEntity.builder()
                    .tenantId(tenantId).sourceCode(sourceCode).boardType(BOARD_ALL)
                    .formulaType("FIXED").basePts(15).scoreDivisor(1)
                    .maxPtsPerAction(15).dailyCapPts(75).status(STATUS_ACTIVE).build();
            default -> GamePointRuleEntity.builder()
                    .tenantId(tenantId).sourceCode(sourceCode).boardType(BOARD_ALL)
                    .formulaType("FIXED").basePts(50).scoreDivisor(1)
                    .maxPtsPerAction(150).dailyCapPts(300).status(STATUS_ACTIVE).build();
        };
    }

    private String normalizeBoard(String boardType) {
        if (boardType == null || boardType.isBlank()) {
            return BOARD_ALL;
        }
        String upper = boardType.trim().toUpperCase();
        if (BOARD_LEARNING.equals(upper) || BOARD_MINI_GAMES.equals(upper)) {
            return upper;
        }
        return BOARD_ALL;
    }

    private String maskPhone(String userId) {
        if (userId == null || userId.length() <= 4) {
            return userId;
        }
        return userId.substring(0, Math.min(3, userId.length())) + "****" + userId.substring(userId.length() - 3);
    }
}
