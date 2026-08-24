package com.natcash.loyalty.game;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.domain.enums.GameStatus;
import com.natcash.loyalty.domain.enums.PaymentMethod;
import com.natcash.loyalty.domain.enums.SessionStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.game.dto.GameHubDto.GameAdminDto;
import com.natcash.loyalty.game.dto.GameHubDto.GameHubGlobalConfigDto;
import com.natcash.loyalty.game.dto.GameHubDto.GameListRequest;
import com.natcash.loyalty.game.dto.GameHubDto.GameListResponse;
import com.natcash.loyalty.game.dto.GameHubDto.InGameCheckoutRequest;
import com.natcash.loyalty.game.dto.GameHubDto.InGameCheckoutResponse;
import com.natcash.loyalty.game.dto.GameHubDto.InitSessionRequest;
import com.natcash.loyalty.game.dto.GameHubDto.InitSessionResponse;
import com.natcash.loyalty.game.dto.GameHubDto.PartnerTurnPurchaseWebhookRequest;
import com.natcash.loyalty.game.dto.GameHubDto.PartnerTurnPurchaseWebhookResponse;
import com.natcash.loyalty.game.dto.GameHubDto.SubmitGameResultRequest;
import com.natcash.loyalty.game.dto.GameHubDto.SubmitGameResultResponse;
import com.natcash.loyalty.game.entity.GameHubConfigEntity;
import com.natcash.loyalty.game.entity.GameHubEntity;
import com.natcash.loyalty.game.entity.GamePlayHistoryEntity;
import com.natcash.loyalty.game.entity.GameSessionEntity;
import com.natcash.loyalty.game.repository.GameHubConfigRepository;
import com.natcash.loyalty.game.repository.GameHubRepository;
import com.natcash.loyalty.game.repository.GamePlayHistoryRepository;
import com.natcash.loyalty.game.repository.GameSessionRepository;
import com.natcash.loyalty.game.service.GameHubService;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RAtomicLong;
import org.redisson.api.RedissonClient;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameHubServiceTest {

    @Mock
    private GameHubRepository gameRepository;

    @Mock
    private GameSessionRepository sessionRepository;

    @Mock
    private GamePlayHistoryRepository historyRepository;

    @Mock
    private GameHubConfigRepository configRepository;

    @Mock
    private AccountService accountService;

    @Mock
    private LoyaltyAccountRepository accountRepository;

    @Mock
    private LoyaltyPointLedgerRepository ledgerRepository;

    @Mock
    private ClearingTransactionRepository clearingRepository;

    @Mock
    private DistributedLockHelper lockHelper;

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private RAtomicLong atomicLong;

    @InjectMocks
    private GameHubService gameHubService;

    @BeforeEach
    void setUp() {
        lenient().when(lockHelper.executeWithLock(anyString(), any(Supplier.class)))
                .thenAnswer(invocation -> {
                    Supplier<?> supplier = invocation.getArgument(1);
                    return supplier.get();
                });
    }

    @Test
    @DisplayName("BE-14.1: Lấy danh mục game đang hoạt động thành công")
    void testGetGamesListSuccess() {
        GameHubEntity game = GameHubEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .gameCode("QUIZ_MASTER")
                .gameName("Đấu Trí Siêu Thị")
                .category("QUIZ")
                .pricePerTurn(new BigDecimal("10.00"))
                .freeTurnsDaily(2)
                .status(GameStatus.ACTIVE)
                .build();

        when(gameRepository.findByTenantIdAndStatus("TENANT_DELIMART", GameStatus.ACTIVE))
                .thenReturn(List.of(game));

        GameListResponse response = gameHubService.getGamesList("TENANT_DELIMART", new GameListRequest("USER_01", "QUIZ"));

        assertNotNull(response);
        assertEquals(1, response.getTotal());
        assertEquals("QUIZ_MASTER", response.getGames().get(0).getGameCode());
        assertEquals(2, response.getGames().get(0).getRemainingTurnsToday());
    }

    @Test
    @DisplayName("BE-14.2: Khởi tạo phiên chơi game và sinh session token thành công")
    void testInitGameSessionSuccess() {
        GameHubEntity game = GameHubEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .gameCode("QUIZ_MASTER")
                .gameName("Đấu Trí Siêu Thị")
                .category("QUIZ")
                .freeTurnsDaily(3)
                .gameUrl("https://game.delimart.com/quiz")
                .status(GameStatus.ACTIVE)
                .build();

        when(gameRepository.findByTenantIdAndGameCode("TENANT_DELIMART", "QUIZ_MASTER"))
                .thenReturn(Optional.of(game));

        InitSessionRequest request = InitSessionRequest.builder()
                .externalUserId("USER_01")
                .gameCode("QUIZ_MASTER")
                .build();

        InitSessionResponse response = gameHubService.initGameSession("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals("QUIZ_MASTER", response.getGameCode());
        assertEquals(3, response.getTurnsAllocated());
        assertEquals(3, response.getTurnsRemaining());
        assertNotNull(response.getSessionToken());
        assertTrue(response.getSessionToken().startsWith("GS_"));

        verify(sessionRepository, times(1)).save(any(GameSessionEntity.class));
    }

    @Test
    @DisplayName("BE-14.3: Submit kết quả chơi minigame thành công, cộng điểm và lưu lịch sử")
    void testSubmitGameResultSuccess() {
        GameHubEntity game = GameHubEntity.builder()
                .id(1L)
                .tenantId("TENANT_NATCASH")
                .gameCode("SUPERMARKET_QUIZ")
                .gameName("Đố Vui Siêu Thị")
                .category("QUIZ")
                .dailyBudgetLimit(new BigDecimal("50000.00"))
                .status(GameStatus.ACTIVE)
                .gameParams("{\"quizQuestionCount\":5,\"quizRewardPoints\":150}")
                .build();

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .id(10L)
                .tenantId("TENANT_NATCASH")
                .externalUserId("USER_01")
                .currentPoints(new BigDecimal("500.00"))
                .build();

        when(gameRepository.findByTenantIdAndGameCode("TENANT_NATCASH", "SUPERMARKET_QUIZ"))
                .thenReturn(Optional.of(game));
        when(accountService.getAccountForUpdate("TENANT_NATCASH", "USER_01"))
                .thenReturn(account);
        when(redissonClient.getAtomicLong(anyString())).thenReturn(atomicLong);
        when(atomicLong.addAndGet(anyLong())).thenReturn(150L);

        SubmitGameResultRequest request = SubmitGameResultRequest.builder()
                .externalUserId("USER_01")
                .gameCode("SUPERMARKET_QUIZ")
                .score(5) // Trả lời đúng 5/5 câu hỏi
                .build();

        SubmitGameResultResponse response = gameHubService.submitGameResult("TENANT_NATCASH", request);

        assertNotNull(response);
        assertEquals("SUPERMARKET_QUIZ", response.getGameCode());
        assertEquals(5, response.getScore());
        assertEquals("POINTS", response.getRewardType());
        assertEquals(new BigDecimal("150"), response.getPointsAwarded());
        assertEquals(new BigDecimal("650.00"), response.getNewPointBalance()); // 500 + 150 = 650
        assertNotNull(response.getTransactionRef());

        verify(accountRepository, times(1)).save(account);
        verify(ledgerRepository, times(1)).save(any(LoyaltyPointLedgerEntity.class));
        verify(historyRepository, times(1)).save(any(GamePlayHistoryEntity.class));
    }

    @Test
    @DisplayName("BE-14.4: Thanh toán mua lượt chơi bằng điểm thành công")
    void testInGameCheckoutSuccess() {
        GameHubEntity game = GameHubEntity.builder()
                .id(1L)
                .gameCode("QUIZ_MASTER")
                .gameName("Đấu Trí Siêu Thị")
                .build();

        GameSessionEntity session = GameSessionEntity.builder()
                .id(100L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("USER_01")
                .game(game)
                .sessionToken("GS_TOKEN_123")
                .turnsAllocated(1)
                .turnsUsed(1)
                .status(SessionStatus.ACTIVE)
                .expiresAt(Instant.now().plusSeconds(1800))
                .build();

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .id(10L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("USER_01")
                .currentPoints(new BigDecimal("500.00"))
                .build();

        when(sessionRepository.findByTenantIdAndSessionToken("TENANT_DELIMART", "GS_TOKEN_123"))
                .thenReturn(Optional.of(session));
        when(accountService.getAccountForUpdate("TENANT_DELIMART", "USER_01"))
                .thenReturn(account);

        InGameCheckoutRequest request = InGameCheckoutRequest.builder()
                .externalUserId("USER_01")
                .gameCode("QUIZ_MASTER")
                .sessionToken("GS_TOKEN_123")
                .turnsToBuy(3)
                .paymentAmount(new BigDecimal("30.00"))
                .paymentMethod(PaymentMethod.POINTS)
                .build();

        InGameCheckoutResponse response = gameHubService.inGameCheckout("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals(3, response.getTotalTurnsAvailable()); // 1 - 1 + 3 = 3
        assertEquals(new BigDecimal("470.00"), response.getRemainingPointBalance());
        assertEquals(new BigDecimal("30.00"), response.getAmountDeducted());

        verify(accountRepository, times(1)).save(account);
        verify(ledgerRepository, times(1)).save(any(LoyaltyPointLedgerEntity.class));
        verify(sessionRepository, times(1)).save(session);
    }

    @Test
    @DisplayName("BE-14.5: Webhook đối tác mua lượt game thành công, cộng lượt và ghi nợ đối soát thu tiền")
    void testProcessPartnerTurnPurchaseSuccess() {
        GameSessionEntity session = GameSessionEntity.builder()
                .id(100L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("USER_01")
                .sessionToken("GS_TOKEN_123")
                .turnsAllocated(2)
                .turnsUsed(1)
                .status(SessionStatus.ACTIVE)
                .build();

        when(sessionRepository.findByTenantIdAndSessionToken("TENANT_DELIMART", "GS_TOKEN_123"))
                .thenReturn(Optional.of(session));

        PartnerTurnPurchaseWebhookRequest request =
                PartnerTurnPurchaseWebhookRequest.builder()
                        .partnerCode("NATCASH_WALLET")
                        .externalUserId("USER_01")
                        .sessionToken("GS_TOKEN_123")
                        .gameCode("QUIZ_MASTER")
                        .turnsPurchased(5)
                        .paymentAmount(new BigDecimal("50.00"))
                        .currency("HTG")
                        .partnerTransactionCode("NC_TX_987654")
                        .build();

        PartnerTurnPurchaseWebhookResponse response =
                gameHubService.processPartnerTurnPurchase("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals("NC_TX_987654", response.getPartnerTransactionCode());
        assertEquals("USER_01", response.getExternalUserId());
        assertEquals(5, response.getTurnsAdded());
        assertEquals(6, response.getTotalTurnsAvailable()); // 2 - 1 + 5 = 6
        assertEquals("PENDING", response.getClearingStatus());
        assertNotNull(response.getTransactionCode());

        verify(sessionRepository, times(1)).save(session);
        verify(clearingRepository, times(1)).save(any(ClearingTransactionEntity.class));
    }

    @Test
    @DisplayName("BE-14.6: Admin CMS lấy danh sách và lưu cấu hình chung cổng game")
    void testAdminGetAndSaveGlobalConfig() {
        GameHubConfigEntity config = GameHubConfigEntity.builder()
                .id(1L)
                .tenantId("TENANT_NATCASH")
                .pointsPerTurnExchange(50)
                .goldenHourEnabled(true)
                .maintenanceMode(false)
                .maxDailyTurnsPerUser(10)
                .welcomeBannerText("Banner Test")
                .build();

        when(configRepository.findByTenantId("TENANT_NATCASH")).thenReturn(Optional.of(config));

        GameHubGlobalConfigDto fetched = gameHubService.getGlobalConfig("TENANT_NATCASH");
        assertNotNull(fetched);
        assertEquals(50, fetched.getPointsPerTurnExchange());
        assertTrue(fetched.getGoldenHourEnabled());

        GameHubGlobalConfigDto updateDto = GameHubGlobalConfigDto.builder()
                .pointsPerTurnExchange(60)
                .goldenHourEnabled(false)
                .maintenanceMode(true)
                .maxDailyTurnsPerUser(15)
                .welcomeBannerText("Updated Banner")
                .build();

        GameHubGlobalConfigDto saved = gameHubService.saveGlobalConfig("TENANT_NATCASH", updateDto);
        assertNotNull(saved);
        assertEquals(60, saved.getPointsPerTurnExchange());
        verify(configRepository, times(1)).save(any(GameHubConfigEntity.class));
    }
}
