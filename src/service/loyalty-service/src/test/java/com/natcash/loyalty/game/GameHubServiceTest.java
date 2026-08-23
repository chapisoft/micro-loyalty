package com.natcash.loyalty.game;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.domain.enums.GameStatus;
import com.natcash.loyalty.domain.enums.PaymentMethod;
import com.natcash.loyalty.domain.enums.SessionStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.game.dto.GameHubDto.GameListRequest;
import com.natcash.loyalty.game.dto.GameHubDto.GameListResponse;
import com.natcash.loyalty.game.dto.GameHubDto.InGameCheckoutRequest;
import com.natcash.loyalty.game.dto.GameHubDto.InGameCheckoutResponse;
import com.natcash.loyalty.game.dto.GameHubDto.InitSessionRequest;
import com.natcash.loyalty.game.dto.GameHubDto.InitSessionResponse;
import com.natcash.loyalty.game.entity.GameHubEntity;
import com.natcash.loyalty.game.entity.GameSessionEntity;
import com.natcash.loyalty.game.repository.GameHubRepository;
import com.natcash.loyalty.game.repository.GameSessionRepository;
import com.natcash.loyalty.game.service.GameHubService;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

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
    private AccountService accountService;

    @Mock
    private LoyaltyAccountRepository accountRepository;

    @Mock
    private LoyaltyPointLedgerRepository ledgerRepository;

    @InjectMocks
    private GameHubService gameHubService;

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
        assertTrue(response.getSessionToken().startsWith("GS_"));
        assertEquals("QUIZ_MASTER", response.getGameCode());
        assertEquals(3, response.getTurnsAllocated());
        assertEquals(3, response.getTurnsRemaining());
        assertEquals(SessionStatus.ACTIVE, response.getStatus());

        verify(sessionRepository, times(1)).save(any(GameSessionEntity.class));
    }

    @Test
    @DisplayName("BE-14.3: Mua thêm lượt chơi bằng điểm thành công và cập nhật phiên")
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
                .expiresAt(Instant.now().plusSeconds(600))
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
                .turnsToBuy(2)
                .paymentAmount(new BigDecimal("50.00"))
                .paymentMethod(PaymentMethod.POINTS)
                .build();

        InGameCheckoutResponse response = gameHubService.inGameCheckout("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals(2, response.getTotalTurnsAvailable());
        assertEquals(new BigDecimal("450.00"), response.getRemainingPointBalance());
        assertEquals(3, session.getTurnsAllocated());

        verify(accountRepository, times(1)).save(account);
        verify(ledgerRepository, times(1)).save(any());
        verify(sessionRepository, times(1)).save(session);
    }

    @Test
    @DisplayName("BE-14.4: Từ chối mua thêm lượt khi số dư điểm không đủ")
    void testInGameCheckoutInsufficientPoints() {
        GameHubEntity game = GameHubEntity.builder().gameCode("QUIZ_MASTER").build();
        GameSessionEntity session = GameSessionEntity.builder()
                .id(100L)
                .tenantId("TENANT_DELIMART")
                .externalUserId("USER_01")
                .game(game)
                .sessionToken("GS_TOKEN_123")
                .status(SessionStatus.ACTIVE)
                .expiresAt(Instant.now().plusSeconds(600))
                .build();

        LoyaltyAccountEntity account = LoyaltyAccountEntity.builder()
                .currentPoints(new BigDecimal("20.00"))
                .build();

        when(sessionRepository.findByTenantIdAndSessionToken("TENANT_DELIMART", "GS_TOKEN_123"))
                .thenReturn(Optional.of(session));
        when(accountService.getAccountForUpdate("TENANT_DELIMART", "USER_01"))
                .thenReturn(account);

        InGameCheckoutRequest request = InGameCheckoutRequest.builder()
                .externalUserId("USER_01")
                .gameCode("QUIZ_MASTER")
                .sessionToken("GS_TOKEN_123")
                .turnsToBuy(5)
                .paymentAmount(new BigDecimal("100.00"))
                .paymentMethod(PaymentMethod.POINTS)
                .build();

        assertThrows(LoyaltyException.class, () ->
                gameHubService.inGameCheckout("TENANT_DELIMART", request));

        verify(accountRepository, never()).save(any());
    }
}
