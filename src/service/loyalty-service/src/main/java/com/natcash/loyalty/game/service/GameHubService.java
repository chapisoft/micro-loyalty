package com.natcash.loyalty.game.service;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.GameStatus;
import com.natcash.loyalty.domain.enums.PaymentMethod;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.SessionStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.game.dto.GameHubDto.GameListItemDto;
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
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GameHubService {

    private static final Logger log = LoggerFactory.getLogger(GameHubService.class);
    private static final long SESSION_TTL_SECONDS = 1800L; // 30 phút

    private final GameHubRepository gameRepository;
    private final GameSessionRepository sessionRepository;
    private final AccountService accountService;
    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyPointLedgerRepository ledgerRepository;

    public GameHubService(GameHubRepository gameRepository,
                          GameSessionRepository sessionRepository,
                          AccountService accountService,
                          LoyaltyAccountRepository accountRepository,
                          LoyaltyPointLedgerRepository ledgerRepository) {
        this.gameRepository = gameRepository;
        this.sessionRepository = sessionRepository;
        this.accountService = accountService;
        this.accountRepository = accountRepository;
        this.ledgerRepository = ledgerRepository;
    }

    @Transactional(readOnly = true)
    public GameListResponse getGamesList(String tenantId, GameListRequest request) {
        List<GameHubEntity> games = gameRepository.findByTenantIdAndStatus(tenantId, GameStatus.ACTIVE);

        if (request != null && request.getCategory() != null && !request.getCategory().isBlank()) {
            games = games.stream()
                    .filter(g -> request.getCategory().equalsIgnoreCase(g.getCategory()))
                    .collect(Collectors.toList());
        }

        List<GameListItemDto> dtos = games.stream().map(g -> GameListItemDto.builder()
                .id(g.getId())
                .gameCode(g.getGameCode())
                .gameName(g.getGameName())
                .category(g.getCategory())
                .pricePerTurn(g.getPricePerTurn())
                .freeTurnsDaily(g.getFreeTurnsDaily())
                .remainingTurnsToday(g.getFreeTurnsDaily())
                .gameUrl(g.getGameUrl())
                .iconUrl(g.getIconUrl())
                .status(g.getStatus())
                .build()
        ).collect(Collectors.toList());

        return GameListResponse.builder()
                .games(dtos)
                .total(dtos.size())
                .build();
    }

    @Transactional
    public InitSessionResponse initGameSession(String tenantId, InitSessionRequest request) {
        String gameCode = request.getGameCode();
        String userId = request.getExternalUserId();

        GameHubEntity game = gameRepository.findByTenantIdAndGameCode(tenantId, gameCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Không tìm thấy trò chơi hoặc trò chơi không tồn tại"));

        if (game.getStatus() == GameStatus.MAINTENANCE) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Trò chơi đang trong quá trình bảo trì định kỳ");
        }

        if (game.getStatus() == GameStatus.INACTIVE) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Trò chơi đã tạm ngừng phát hành");
        }

        String sessionToken = "GS_" + UUID.randomUUID().toString().replace("-", "");
        Instant expiresAt = Instant.now().plusSeconds(SESSION_TTL_SECONDS);

        GameSessionEntity session = GameSessionEntity.builder()
                .tenantId(tenantId)
                .externalUserId(userId)
                .game(game)
                .sessionToken(sessionToken)
                .turnsAllocated(game.getFreeTurnsDaily())
                .turnsUsed(0)
                .status(SessionStatus.ACTIVE)
                .expiresAt(expiresAt)
                .build();

        sessionRepository.save(session);

        String launchUrl = (game.getGameUrl() != null ? game.getGameUrl() : "/games/" + game.getGameCode())
                + "?sessionToken=" + sessionToken + "&tenantId=" + tenantId;

        log.info("[GAME-SESSION-INIT] tenantId={}, user={}, game={}, token={}, turns={}",
                tenantId, userId, gameCode, sessionToken, game.getFreeTurnsDaily());

        return InitSessionResponse.builder()
                .sessionToken(sessionToken)
                .gameCode(game.getGameCode())
                .gameName(game.getGameName())
                .turnsAllocated(session.getTurnsAllocated())
                .turnsUsed(session.getTurnsUsed())
                .turnsRemaining(session.getTurnsAllocated() - session.getTurnsUsed())
                .status(session.getStatus())
                .expiresAt(expiresAt)
                .gameLaunchUrl(launchUrl)
                .build();
    }

    @Transactional
    public InGameCheckoutResponse inGameCheckout(String tenantId, InGameCheckoutRequest request) {
        String userId = request.getExternalUserId();
        String sessionToken = request.getSessionToken();
        int turnsToBuy = request.getTurnsToBuy() != null ? request.getTurnsToBuy() : 1;
        BigDecimal amount = request.getPaymentAmount();

        GameSessionEntity session = sessionRepository.findByTenantIdAndSessionToken(tenantId, sessionToken)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Phiên chơi game không hợp lệ hoặc không tồn tại"));

        if (session.getExpiresAt().isBefore(Instant.now()) || session.getStatus() != SessionStatus.ACTIVE) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Phiên chơi game đã hết hạn");
        }

        BigDecimal remainingBalance = BigDecimal.ZERO;
        String txCode = "IGC_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        PaymentMethod paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.POINTS;

        // Thanh toán bằng điểm Loyalty
        if (paymentMethod == PaymentMethod.POINTS) {
            LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, userId);

            if (account.getCurrentPoints().compareTo(amount) < 0) {
                log.warn("[GAME-CHECKOUT-INSUFFICIENT-POINTS] user={}, balance={}, required={}",
                        userId, account.getCurrentPoints(), amount);
                throw new LoyaltyException(ErrorCode.INSUFFICIENT_POINTS, "Số dư điểm không đủ để mua lượt chơi");
            }

            remainingBalance = account.getCurrentPoints().subtract(amount);
            account.setCurrentPoints(remainingBalance);
            accountRepository.save(account);

            LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                    .tenantId(tenantId)
                    .account(account)
                    .pointChange(amount.negate())
                    .balanceAfter(remainingBalance)
                    .changeType(PointActionType.BURN)
                    .referenceCode(txCode)
                    .description("Thanh toán mua " + turnsToBuy + " lượt chơi game: " + session.getGame().getGameName())
                    .createdAt(Instant.now())
                    .build();
            ledgerRepository.save(ledger);
        }

        session.setTurnsAllocated(session.getTurnsAllocated() + turnsToBuy);
        sessionRepository.save(session);

        log.info("[GAME-CHECKOUT-SUCCESS] tenantId={}, user={}, game={}, turnsBought={}, totalAvailable={}, txCode={}",
                tenantId, userId, session.getGame().getGameCode(), turnsToBuy, session.getTurnsAllocated() - session.getTurnsUsed(), txCode);

        return InGameCheckoutResponse.builder()
                .transactionCode(txCode)
                .sessionToken(sessionToken)
                .totalTurnsAvailable(session.getTurnsAllocated() - session.getTurnsUsed())
                .amountDeducted(amount)
                .paymentMethod(paymentMethod)
                .remainingPointBalance(remainingBalance)
                .message("Mua lượt chơi game thành công")
                .timestamp(Instant.now())
                .build();
    }
}
