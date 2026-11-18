package com.natcash.loyalty.game;

import com.natcash.loyalty.game.entity.GameMonthlyLeaderboardEntity;
import com.natcash.loyalty.game.entity.GamePointRuleEntity;
import com.natcash.loyalty.game.entity.LeaderboardPayoutEntity;
import com.natcash.loyalty.game.entity.LeaderboardPrizeEntity;
import com.natcash.loyalty.game.repository.GameMonthlyLeaderboardRepository;
import com.natcash.loyalty.game.repository.GamePointLedgerRepository;
import com.natcash.loyalty.game.repository.GamePointRuleRepository;
import com.natcash.loyalty.game.repository.LeaderboardPayoutRepository;
import com.natcash.loyalty.game.repository.LeaderboardPrizeRepository;
import com.natcash.loyalty.game.service.GameLeaderboardService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GameLeaderboardServiceTest {

    @Mock
    private GamePointRuleRepository ruleRepository;
    @Mock
    private GamePointLedgerRepository ledgerRepository;
    @Mock
    private GameMonthlyLeaderboardRepository leaderboardRepository;
    @Mock
    private LeaderboardPrizeRepository prizeRepository;
    @Mock
    private LeaderboardPayoutRepository payoutRepository;

    private GameLeaderboardService service;

    @BeforeEach
    void setUp() {
        service = new GameLeaderboardService(
                ruleRepository, ledgerRepository, leaderboardRepository, prizeRepository, payoutRepository);
    }

    @Test
    @DisplayName("GĐ4-1: Mua lượt chơi bằng coin KHÔNG cộng Game points (pts)")
    void coinPurchasedPlayAwardsZeroPts() {
        int pts = service.awardGamePoints(
                "TENANT_NATCASH", "USER_1", GameLeaderboardService.SOURCE_LUCKY_PARTICIPATION,
                0, "LUCKY_WHEEL", "TX_1", true);

        assertEquals(0, pts);
        verify(ledgerRepository, never()).save(any());
        verify(leaderboardRepository, never()).save(any());
    }

    @Test
    @DisplayName("GĐ4-2: Cộng Game points theo công thức mini game và kiểm soát trần ngày")
    void miniGameAwardsPtsCappedByDailyLimit() {
        GamePointRuleEntity rule = GamePointRuleEntity.builder()
                .tenantId("TENANT_NATCASH")
                .sourceCode("MINI_GAME")
                .boardType("MINI_GAMES")
                .formulaType("PER_SCORE_UNIT")
                .basePts(20)
                .scoreDivisor(10)
                .maxPtsPerAction(200)
                .dailyCapPts(300)
                .status("ACTIVE")
                .build();

        when(ruleRepository.findByTenantIdAndSourceCode("TENANT_NATCASH", "MINI_GAME"))
                .thenReturn(Optional.of(rule));
        when(ledgerRepository.sumDailyPoints(eq("TENANT_NATCASH"), eq("USER_1"), eq("MINI_GAME"), any(LocalDate.class)))
                .thenReturn(250);
        when(leaderboardRepository.findByTenantIdAndLeaderboardMonthAndBoardTypeAndExternalUserId(
                eq("TENANT_NATCASH"), any(), any(), eq("USER_1")))
                .thenReturn(Optional.empty());

        // rawScore=1500 -> 1500/10=150 pts, capped by remaining daily cap (300 - 250 = 50)
        int pts = service.awardGamePoints(
                "TENANT_NATCASH", "USER_1", "MINI_GAME", 1500, "GAME2048", "TX_2048", false);

        assertEquals(50, pts);
        verify(ledgerRepository, times(1)).save(any());
        // Upserts BOTH ALL board and MINI_GAMES board
        verify(leaderboardRepository, times(2)).save(any(GameMonthlyLeaderboardEntity.class));
    }

    @Test
    @DisplayName("GĐ4-3: Chốt tháng tạo payout chờ duyệt QT-04 theo giải hạng CMS")
    void closeMonthCreatesPendingPayouts() {
        LeaderboardPrizeEntity top1 = LeaderboardPrizeEntity.builder()
                .id(10L)
                .tenantId("TENANT_NATCASH")
                .boardType("ALL")
                .rankFrom(1)
                .rankTo(1)
                .prizeType("VOUCHER")
                .prizeLabel("10 GB + Voucher 200 HTG")
                .prizeValue(new BigDecimal("200.00"))
                .status("ACTIVE")
                .build();

        GameMonthlyLeaderboardEntity leader = GameMonthlyLeaderboardEntity.builder()
                .tenantId("TENANT_NATCASH")
                .leaderboardMonth("2026-10")
                .boardType("ALL")
                .externalUserId("USER_TOP1")
                .displayName("Jean")
                .totalScore(15400)
                .build();

        when(prizeRepository.findByTenantIdAndBoardTypeAndStatusOrderByRankFromAsc("TENANT_NATCASH", "ALL", "ACTIVE"))
                .thenReturn(List.of(top1));
        when(prizeRepository.findByTenantIdAndBoardTypeAndStatusOrderByRankFromAsc("TENANT_NATCASH", "LEARNING", "ACTIVE"))
                .thenReturn(List.of());
        when(prizeRepository.findByTenantIdAndBoardTypeAndStatusOrderByRankFromAsc("TENANT_NATCASH", "MINI_GAMES", "ACTIVE"))
                .thenReturn(List.of());
        when(leaderboardRepository.findTop100ByTenantIdAndLeaderboardMonthAndBoardTypeOrderByTotalScoreDesc(
                "TENANT_NATCASH", "2026-10", "ALL"))
                .thenReturn(List.of(leader));
        when(payoutRepository.findByTenantIdAndLeaderboardMonthAndBoardTypeAndExternalUserId(
                "TENANT_NATCASH", "2026-10", "ALL", "USER_TOP1"))
                .thenReturn(Optional.empty());
        when(payoutRepository.save(any(LeaderboardPayoutEntity.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        List<LeaderboardPayoutEntity> payouts = service.closeMonthAndGeneratePayouts("TENANT_NATCASH", "2026-10");

        assertEquals(1, payouts.size());
        assertEquals("PENDING_APPROVAL", payouts.get(0).getApprovalStatus());
        assertEquals(1, payouts.get(0).getRankPosition());
        assertNotNull(payouts.get(0).getPrizeLabel());
    }
}
