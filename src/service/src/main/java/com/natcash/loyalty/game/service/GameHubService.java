package com.natcash.loyalty.game.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.domain.enums.GameStatus;
import com.natcash.loyalty.domain.enums.PaymentMethod;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.PrizeType;
import com.natcash.loyalty.domain.enums.SessionStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.game.dto.GameHubDto.ActiveWheelThemeResponse;
import com.natcash.loyalty.game.dto.GameHubDto.GameAdminDto;
import com.natcash.loyalty.game.dto.GameHubDto.GameDetailResponse;
import com.natcash.loyalty.game.dto.GameHubDto.GameHubGlobalConfigDto;
import com.natcash.loyalty.game.dto.GameHubDto.GameListItemDto;
import com.natcash.loyalty.game.dto.GameHubDto.GameListRequest;
import com.natcash.loyalty.game.dto.GameHubDto.GameListResponse;
import com.natcash.loyalty.game.dto.GameHubDto.GamePlayHistoryItemDto;
import com.natcash.loyalty.game.dto.GameHubDto.GamePrizeDto;
import com.natcash.loyalty.game.dto.GameHubDto.InGameCheckoutRequest;
import com.natcash.loyalty.game.dto.GameHubDto.InGameCheckoutResponse;
import com.natcash.loyalty.game.dto.GameHubDto.InitSessionRequest;
import com.natcash.loyalty.game.dto.GameHubDto.InitSessionResponse;
import com.natcash.loyalty.game.dto.GameHubDto.PartnerTurnPurchaseWebhookRequest;
import com.natcash.loyalty.game.dto.GameHubDto.PartnerTurnPurchaseWebhookResponse;
import com.natcash.loyalty.game.dto.GameHubDto.PlayGameRequest;
import com.natcash.loyalty.game.dto.GameHubDto.PlayGameResponse;
import com.natcash.loyalty.game.dto.GameHubDto.SelectWheelThemeRequest;
import com.natcash.loyalty.game.dto.GameHubDto.SubmitGameResultRequest;
import com.natcash.loyalty.game.dto.GameHubDto.SubmitGameResultResponse;
import com.natcash.loyalty.game.dto.GameHubDto.WheelThemeDto;
import com.natcash.loyalty.game.entity.GameHubConfigEntity;
import com.natcash.loyalty.game.entity.GameHubEntity;
import com.natcash.loyalty.game.entity.GamePlayHistoryEntity;
import com.natcash.loyalty.game.entity.GamePrizeEntity;
import com.natcash.loyalty.game.entity.GameSessionEntity;
import com.natcash.loyalty.game.entity.WheelThemeEntity;
import com.natcash.loyalty.game.repository.GameHubConfigRepository;
import com.natcash.loyalty.game.repository.GameHubRepository;
import com.natcash.loyalty.game.repository.GamePlayHistoryRepository;
import com.natcash.loyalty.game.repository.GamePrizeRepository;
import com.natcash.loyalty.game.repository.GameSessionRepository;
import com.natcash.loyalty.game.repository.WheelThemeRepository;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.security.SignatureUtils;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;

import org.redisson.api.RAtomicLong;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GameHubService {

    private static final Logger log = LoggerFactory.getLogger(GameHubService.class);
    private static final long SESSION_TTL_SECONDS = 1800L; // 30 phút
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final SecureRandom secureRandom = new SecureRandom();

    private final GameHubRepository gameRepository;
    private final GameSessionRepository sessionRepository;
    private final GamePlayHistoryRepository historyRepository;
    private final GameHubConfigRepository configRepository;
    private final AccountService accountService;
    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final ClearingTransactionRepository clearingRepository;
    private final DistributedLockHelper lockHelper;
    private final RedissonClient redissonClient;
    private final WheelThemeRepository wheelThemeRepository;
    private final GamePrizeRepository gamePrizeRepository;
    private final LoyaltyPartnerRepository partnerRepository;

    public GameHubService(GameHubRepository gameRepository,
                          GameSessionRepository sessionRepository,
                          GamePlayHistoryRepository historyRepository,
                          GameHubConfigRepository configRepository,
                          AccountService accountService,
                          LoyaltyAccountRepository accountRepository,
                          LoyaltyPointLedgerRepository ledgerRepository,
                          ClearingTransactionRepository clearingRepository,
                          DistributedLockHelper lockHelper,
                          RedissonClient redissonClient,
                          WheelThemeRepository wheelThemeRepository,
                          GamePrizeRepository gamePrizeRepository,
                          LoyaltyPartnerRepository partnerRepository) {
        this.gameRepository = gameRepository;
        this.sessionRepository = sessionRepository;
        this.historyRepository = historyRepository;
        this.configRepository = configRepository;
        this.accountService = accountService;
        this.accountRepository = accountRepository;
        this.ledgerRepository = ledgerRepository;
        this.clearingRepository = clearingRepository;
        this.lockHelper = lockHelper;
        this.redissonClient = redissonClient;
        this.wheelThemeRepository = wheelThemeRepository;
        this.gamePrizeRepository = gamePrizeRepository;
        this.partnerRepository = partnerRepository;
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

    @Transactional(readOnly = true)
    public GameDetailResponse getGameDetail(String tenantId, String gameCode, String userId) {
        GameHubEntity game = gameRepository.findByTenantIdAndGameCode(tenantId, gameCode)
                .or(() -> gameRepository.findByTenantIdAndGameCode("TENANT_NATCASH", gameCode))
                .or(() -> gameRepository.findAll().stream().filter(g -> g.getGameCode().equalsIgnoreCase(gameCode)).findFirst())
                .orElse(null);

        if (game == null) {
            game = GameHubEntity.builder()
                    .tenantId(tenantId)
                    .gameCode(gameCode)
                    .gameName(gameCode)
                    .category("INSTANT_WIN")
                    .pricePerTurn(BigDecimal.valueOf(10))
                    .freeTurnsDaily(1)
                    .allowPointsSpin(true)
                    .status(GameStatus.ACTIVE)
                    .build();
        }

        List<GamePrizeEntity> prizeEntities = gamePrizeRepository
                .findByTenantIdAndGameCodeAndStatusOrderByDisplayOrderAsc(tenantId, gameCode, "ACTIVE");
        if (prizeEntities.isEmpty()) {
            prizeEntities = gamePrizeRepository
                    .findByTenantIdAndGameCodeAndStatusOrderByDisplayOrderAsc("TENANT_NATCASH", gameCode, "ACTIVE");
        }

        List<GamePrizeDto> prizeDtos = prizeEntities.stream().map(p -> GamePrizeDto.builder()
                .id(p.getId())
                .prizeCode(p.getPrizeCode())
                .prizeName(p.getPrizeName())
                .prizeType(p.getPrizeType() != null ? p.getPrizeType().name() : "POINTS")
                .prizeValue(p.getPrizeValue())
                .probabilityWeight(p.getProbabilityWeight())
                .colorCode(p.getColorCode())
                .iconSymbol(p.getIconSymbol())
                .displayOrder(p.getDisplayOrder())
                .build()
        ).collect(Collectors.toList());

        BigDecimal userBalance = BigDecimal.ZERO;
        if (userId != null && !userId.isBlank()) {
            userBalance = accountRepository.findByTenantIdAndExternalUserId(tenantId, userId)
                    .map(acc -> acc.getCurrentPoints())
                    .orElse(BigDecimal.ZERO);
        }

        Map<String, Object> params = parseGameParams(game.getGameParams());

        return GameDetailResponse.builder()
                .id(game.getId())
                .gameCode(game.getGameCode())
                .gameName(game.getGameName())
                .category(game.getCategory())
                .pricePerTurn(game.getPricePerTurn())
                .freeTurnsDaily(game.getFreeTurnsDaily())
                .remainingTurnsToday(game.getFreeTurnsDaily())
                .userPointBalance(userBalance)
                .description(game.getDescription())
                .rulesText(game.getRulesText())
                .bannerUrl(game.getBannerUrl())
                .iconUrl(game.getIconUrl())
                .allowPointsSpin(game.getAllowPointsSpin())
                .prizes(prizeDtos)
                .gameParams(params)
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
    public SubmitGameResultResponse submitGameResult(String tenantId, SubmitGameResultRequest request) {
        String userId = request.getExternalUserId();
        String gameCode = request.getGameCode();
        int score = request.getScore() != null ? request.getScore() : 0;

        String lockKey = RedisKeys.getGameLockKey(tenantId, gameCode, userId);

        return lockHelper.executeWithLock(lockKey, () -> {
            GameHubEntity game = gameRepository.findByTenantIdAndGameCode(tenantId, gameCode)
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Không tìm thấy thông tin trò chơi"));

            if (game.getStatus() != GameStatus.ACTIVE) {
                throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Trò chơi hiện không khả dụng để tiếp nhận kết quả");
            }

            // 1. Kiểm tra session hoặc tạo session tức thì
            GameSessionEntity session = null;
            if (request.getSessionToken() != null && !request.getSessionToken().isBlank()) {
                session = sessionRepository.findByTenantIdAndSessionToken(tenantId, request.getSessionToken()).orElse(null);
            }

            int turnsRemaining = 0;
            if (session != null) {
                session.setTurnsUsed(session.getTurnsUsed() + 1);
                sessionRepository.save(session);
                turnsRemaining = Math.max(0, session.getTurnsAllocated() - session.getTurnsUsed());
            }

            // 2. Tính toán điểm thưởng và phần thưởng dựa trên thể loại Game & Tham số chi tiết
            BigDecimal pointsToAward = BigDecimal.ZERO;
            PrizeType rewardType = PrizeType.POINTS;
            String message = "Chúc mừng bạn đã hoàn thành lượt chơi!";

            Map<String, Object> paramsMap = parseGameParams(game.getGameParams());

            switch (game.getCategory()) {
                case "QUIZ":
                    int maxScore = paramsMap.containsKey("quizQuestionCount") ? ((Number) paramsMap.get("quizQuestionCount")).intValue() : 5;
                    int basePoints = paramsMap.containsKey("quizRewardPoints") ? ((Number) paramsMap.get("quizRewardPoints")).intValue() : 150;
                    if (score >= maxScore) {
                        pointsToAward = BigDecimal.valueOf(basePoints);
                        message = "Xuất sắc! Bạn đã trả lời đúng 100% câu hỏi và nhận " + pointsToAward + " Điểm Thưởng!";
                    } else if (score >= maxScore / 2) {
                        pointsToAward = BigDecimal.valueOf(basePoints / 2);
                        message = "Làm tốt lắm! Bạn đã nhận " + pointsToAward + " Điểm Thưởng!";
                    } else {
                        pointsToAward = BigDecimal.valueOf(10);
                        message = "Cố gắng lên nhé! Bạn nhận được 10 Điểm khuyến khích!";
                    }
                    break;

                case "FARM":
                    pointsToAward = BigDecimal.valueOf(score > 0 ? score * 20L : 50L);
                    message = "Nông trại thu hoạch thành công! Bạn nhận được " + pointsToAward + " Điểm!";
                    break;

                case "DICE":
                    int multiplier = Math.max(1, Math.min(score, 10));
                    pointsToAward = BigDecimal.valueOf(multiplier * 25L);
                    message = "Lắc xí ngầu may mắn nhân x" + multiplier + "! Bạn nhận " + pointsToAward + " Điểm!";
                    break;

                default:
                    pointsToAward = BigDecimal.valueOf(score > 0 ? score * 10L : 20L);
                    message = "Lượt chơi hoàn tất! Bạn nhận được " + pointsToAward + " Điểm Thưởng!";
                    break;
            }

            // 3. Khống chế hạn mức ngân sách ngày của Game qua Redis Atomic
            if (game.getDailyBudgetLimit() != null && game.getDailyBudgetLimit().compareTo(BigDecimal.ZERO) > 0) {
                String todayStr = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
                String budgetKey = RedisKeys.getGameDailyBudgetKey(tenantId, game.getId(), todayStr);
                RAtomicLong dailySpent = redissonClient.getAtomicLong(budgetKey);

                long newSpent = dailySpent.addAndGet(pointsToAward.longValue());
                if (dailySpent.remainTimeToLive() < 0) {
                    dailySpent.expire(Duration.ofHours(24));
                }

                if (newSpent > game.getDailyBudgetLimit().longValue()) {
                    log.warn("[GAME-BUDGET-EXCEEDED] tenantId={}, game={}, spent={}, limit={}",
                            tenantId, game.getGameCode(), newSpent, game.getDailyBudgetLimit());
                    dailySpent.addAndGet(-pointsToAward.longValue());
                    pointsToAward = BigDecimal.valueOf(5); // Điểm an ủi tối thiểu
                    message = "Hạn mức trả thưởng trong ngày của game đã chạm trần, bạn nhận 5 Điểm an ủi!";
                }
            }

            // 4. Cộng điểm vào tài khoản hội viên và ghi nhận Sổ cái bất biến
            LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, userId);
            BigDecimal currentPoints = account.getCurrentPoints();

            if (pointsToAward.compareTo(BigDecimal.ZERO) > 0) {
                currentPoints = currentPoints.add(pointsToAward);
                account.setCurrentPoints(currentPoints);
                accountRepository.save(account);

                String txRef = "GAME_REWARD_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
                LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                        .tenantId(tenantId)
                        .account(account)
                        .pointChange(pointsToAward)
                        .balanceAfter(currentPoints)
                        .changeType(PointActionType.EARN)
                        .referenceCode(txRef)
                        .partnerId(getDefaultPartnerId(tenantId))
                        .description("Thưởng minigame: " + game.getGameName() + " (Điểm: " + score + ")")
                        .createdAt(Instant.now())
                        .build();
                ledgerRepository.save(ledger);
            }

            // 5. Ghi vết lịch sử chơi game bất biến vào loyalty_game_play_history
            String finalTxRef = request.getClientTransactionRef() != null && !request.getClientTransactionRef().isBlank()
                    ? request.getClientTransactionRef()
                    : "GTRX_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);

            GamePlayHistoryEntity history = GamePlayHistoryEntity.builder()
                    .tenantId(tenantId)
                    .externalUserId(userId)
                    .gameCode(gameCode)
                    .sessionToken(request.getSessionToken())
                    .transactionRef(finalTxRef)
                    .score(score)
                    .rewardType(rewardType)
                    .rewardValue(pointsToAward)
                    .pointsAwarded(pointsToAward)
                    .voucherCode(null)
                    .details(request.getDetails())
                    .status("SUCCESS")
                    .createdAt(Instant.now())
                    .build();
            historyRepository.save(history);

            // 6. Gửi Outbound Webhook thông báo kết quả sang máy chủ của Game Studio (nếu có cấu hình)
            Map<String, Object> gameParams = parseGameParams(game.getGameParams());
            if (gameParams.containsKey("webhookUrl") && gameParams.get("webhookUrl") != null) {
                String webhookUrl = String.valueOf(gameParams.get("webhookUrl"));
                String partnerCode = gameParams.containsKey("partnerCode") ? String.valueOf(gameParams.get("partnerCode")) : "GAME_STUDIO";
                dispatchOutboundWebhook(tenantId, webhookUrl, partnerCode, finalTxRef, gameCode, userId, score, pointsToAward, rewardType.name());
            }

            log.info("[GAME-RESULT-SUBMITTED] tenantId={}, user={}, game={}, score={}, pointsAwarded={}, newBalance={}, txRef={}",
                    tenantId, userId, gameCode, score, pointsToAward, currentPoints, finalTxRef);

            return SubmitGameResultResponse.builder()
                    .transactionRef(finalTxRef)
                    .gameCode(gameCode)
                    .gameName(game.getGameName())
                    .score(score)
                    .rewardType(rewardType.name())
                    .rewardValue(pointsToAward)
                    .pointsAwarded(pointsToAward)
                    .voucherCode(null)
                    .newPointBalance(currentPoints)
                    .turnsRemaining(turnsRemaining)
                    .message(message)
                    .timestamp(Instant.now())
                    .build();
        });
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
                    .partnerId(getDefaultPartnerId(tenantId))
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

    @Transactional
    public PartnerTurnPurchaseWebhookResponse processPartnerTurnPurchase(String tenantId, PartnerTurnPurchaseWebhookRequest request) {
        String userId = request.getExternalUserId();
        String gameCode = request.getGameCode();
        int turns = request.getTurnsPurchased() != null ? request.getTurnsPurchased() : 1;
        BigDecimal amount = request.getPaymentAmount();
        String currency = request.getCurrency() != null ? request.getCurrency() : "HTG";
        String partnerTxCode = request.getPartnerTransactionCode();
        String partnerCode = request.getPartnerCode();

        String loyaltyTxCode = "PUR_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        int totalTurns = turns;
        if (request.getSessionToken() != null && !request.getSessionToken().isBlank()) {
            GameSessionEntity session = sessionRepository.findByTenantIdAndSessionToken(tenantId, request.getSessionToken()).orElse(null);
            if (session != null) {
                session.setTurnsAllocated(session.getTurnsAllocated() + turns);
                sessionRepository.save(session);
                totalTurns = session.getTurnsAllocated() - session.getTurnsUsed();
            }
        }

        ClearingTransactionEntity clearingTx = ClearingTransactionEntity.builder()
                .tenantId(tenantId)
                .transactionCode(loyaltyTxCode)
                .issuerPartnerId(1L)
                .redeemerPartnerId(2L)
                .externalUserId(userId)
                .pointsRedeemed(BigDecimal.ZERO)
                .fiatAmount(amount)
                .exchangeRate(BigDecimal.ONE)
                .status(ClearingStatus.PENDING)
                .createdAt(Instant.now())
                .build();
        clearingRepository.save(clearingTx);

        log.info("[GAME-PARTNER-PURCHASE-WEBHOOK] tenantId={}, partner={}, user={}, game={}, turns={}, amount={}, txCode={}, ref={}",
                tenantId, partnerCode, userId, gameCode, turns, amount, loyaltyTxCode, partnerTxCode);

        return PartnerTurnPurchaseWebhookResponse.builder()
                .transactionCode(loyaltyTxCode)
                .partnerTransactionCode(partnerTxCode)
                .externalUserId(userId)
                .gameCode(gameCode)
                .turnsAdded(turns)
                .totalTurnsAvailable(totalTurns)
                .paymentAmount(amount)
                .currency(currency)
                .clearingStatus(ClearingStatus.PENDING.name())
                .message("Đã cộng lượt chơi và ghi nhận công nợ đối soát thu tiền thành công")
                .timestamp(Instant.now())
                .build();
    }

    // ── CMS ADMIN OPERATIONS ──

    @Transactional(readOnly = true)
    public List<GameAdminDto> getAllGamesAdmin(String tenantId) {
        List<GameHubEntity> games = gameRepository.findByTenantId(tenantId);
        return games.stream().map(this::mapToAdminDto).collect(Collectors.toList());
    }

    @Transactional
    public GameAdminDto saveGameAdmin(String tenantId, GameAdminDto dto) {
        String effectiveTenantId = (tenantId != null && !tenantId.isBlank()) ? tenantId : "TENANT_NATCASH";

        GameHubEntity entity = null;
        if (dto.getId() != null && dto.getId() > 0) {
            entity = gameRepository.findByTenantIdAndId(effectiveTenantId, dto.getId())
                    .or(() -> gameRepository.findById(dto.getId()))
                    .orElse(null);
        }

        String code = (dto.getGameCode() != null && !dto.getGameCode().isBlank())
                ? dto.getGameCode().toUpperCase().trim()
                : (entity != null && entity.getGameCode() != null ? entity.getGameCode() : "GAME_" + System.currentTimeMillis());

        if (entity == null) {
            entity = gameRepository.findByTenantIdAndGameCode(effectiveTenantId, code)
                    .or(() -> gameRepository.findByGameCode(code))
                    .orElseGet(() -> GameHubEntity.builder()
                            .tenantId(effectiveTenantId)
                            .gameCode(code)
                            .createdAt(Instant.now())
                            .status(GameStatus.ACTIVE)
                            .category("LUCKY_DRAW")
                            .build());
        }

        if (entity.getTenantId() == null) entity.setTenantId(effectiveTenantId);
        if (entity.getGameCode() == null) entity.setGameCode(code);
        if (entity.getCreatedAt() == null) entity.setCreatedAt(Instant.now());

        String name = (dto.getGameName() != null && !dto.getGameName().isBlank())
                ? dto.getGameName()
                : (entity.getGameName() != null ? entity.getGameName() : code);
        entity.setGameName(name);

        if (dto.getCategory() != null && !dto.getCategory().isBlank()) entity.setCategory(dto.getCategory());
        else if (entity.getCategory() == null) entity.setCategory("LUCKY_DRAW");

        entity.setPricePerTurn(dto.getPricePerTurnHtg() != null ? dto.getPricePerTurnHtg() : (dto.getPricePerTurn() != null ? dto.getPricePerTurn() : BigDecimal.ZERO));
        entity.setFreeTurnsDaily(dto.getFreeTurnsDaily() != null ? dto.getFreeTurnsDaily() : (entity.getFreeTurnsDaily() != null ? entity.getFreeTurnsDaily() : 1));
        entity.setDailyBudgetLimit(dto.getDailyBudgetLimit() != null ? dto.getDailyBudgetLimit() : (entity.getDailyBudgetLimit() != null ? entity.getDailyBudgetLimit() : new BigDecimal("50000.00")));
        entity.setAllowPointsSpin(dto.getAllowPointsSpin() != null ? dto.getAllowPointsSpin() : (entity.getAllowPointsSpin() != null ? entity.getAllowPointsSpin() : true));
        if (dto.getGameUrl() != null) entity.setGameUrl(dto.getGameUrl());
        if (dto.getIconUrl() != null) entity.setIconUrl(dto.getIconUrl());
        if (dto.getBannerUrl() != null) entity.setBannerUrl(dto.getBannerUrl());
        if (dto.getDescription() != null) entity.setDescription(dto.getDescription());
        if (dto.getRulesText() != null) entity.setRulesText(dto.getRulesText());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : (entity.getStatus() != null ? entity.getStatus() : GameStatus.ACTIVE));

        // Serialize specialized game parameters & Third-Party Game Studio Config
        Map<String, Object> params = parseGameParams(entity.getGameParams());
        if (dto.getPartnerCode() != null) params.put("partnerCode", dto.getPartnerCode());
        if (dto.getWebhookUrl() != null) params.put("webhookUrl", dto.getWebhookUrl());
        if (dto.getRevenueSharePercent() != null) params.put("revenueSharePercent", dto.getRevenueSharePercent());
        if (dto.getQuizQuestionCount() != null) params.put("quizQuestionCount", dto.getQuizQuestionCount());
        if (dto.getQuizCountdownSec() != null) params.put("quizCountdownSec", dto.getQuizCountdownSec());
        if (dto.getQuizRewardPoints() != null) params.put("quizRewardPoints", dto.getQuizRewardPoints());
        if (dto.getFarmSeasonDays() != null) params.put("farmSeasonDays", dto.getFarmSeasonDays());
        if (dto.getFarmVoucherLimit() != null) params.put("farmVoucherLimit", dto.getFarmVoucherLimit());
        if (dto.getDiceMultiplierMax() != null) params.put("diceMultiplierMax", dto.getDiceMultiplierMax());

        try {
            entity.setGameParams(objectMapper.writeValueAsString(params));
        } catch (Exception e) {
            log.warn("[GAME-PARAMS-SERIALIZE-ERROR] {}", e.getMessage());
        }

        GameHubEntity saved = gameRepository.save(entity);
        return mapToAdminDto(saved);
    }

    @Transactional(readOnly = true)
    public GameHubGlobalConfigDto getGlobalConfig(String tenantId) {
        GameHubConfigEntity config = configRepository.findByTenantId(tenantId)
                .orElseGet(() -> GameHubConfigEntity.builder()
                        .tenantId(tenantId)
                        .pointsPerTurnExchange(50)
                        .goldenHourEnabled(true)
                        .maintenanceMode(false)
                        .maxDailyTurnsPerUser(10)
                        .welcomeBannerText("Tham gia minigame mỗi ngày nhận quà siêu khủng từ Natcash!")
                        .build());

        return GameHubGlobalConfigDto.builder()
                .pointsPerTurnExchange(config.getPointsPerTurnExchange())
                .goldenHourEnabled(config.getGoldenHourEnabled())
                .maintenanceMode(config.getMaintenanceMode())
                .maxDailyTurnsPerUser(config.getMaxDailyTurnsPerUser())
                .welcomeBannerText(config.getWelcomeBannerText())
                .build();
    }

    @Transactional
    public GameHubGlobalConfigDto saveGlobalConfig(String tenantId, GameHubGlobalConfigDto dto) {
        GameHubConfigEntity config = configRepository.findByTenantId(tenantId)
                .orElseGet(() -> GameHubConfigEntity.builder().tenantId(tenantId).build());

        config.setPointsPerTurnExchange(dto.getPointsPerTurnExchange() != null ? dto.getPointsPerTurnExchange() : 50);
        config.setGoldenHourEnabled(dto.getGoldenHourEnabled() != null ? dto.getGoldenHourEnabled() : true);
        config.setMaintenanceMode(dto.getMaintenanceMode() != null ? dto.getMaintenanceMode() : false);
        config.setMaxDailyTurnsPerUser(dto.getMaxDailyTurnsPerUser() != null ? dto.getMaxDailyTurnsPerUser() : 10);
        if (dto.getWelcomeBannerText() != null) {
            config.setWelcomeBannerText(dto.getWelcomeBannerText());
        }

        configRepository.save(config);
        return dto;
    }

    @Transactional(readOnly = true)
    public Page<GamePlayHistoryItemDto> getGamePlayHistory(String tenantId, String userId, Pageable pageable) {
        Page<GamePlayHistoryEntity> page;
        if (userId != null && !userId.isBlank()) {
            page = historyRepository.findByTenantIdAndExternalUserIdOrderByCreatedAtDesc(tenantId, userId, pageable);
        } else {
            page = historyRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
        }

        return page.map(h -> GamePlayHistoryItemDto.builder()
                .id(h.getId())
                .externalUserId(h.getExternalUserId())
                .gameCode(h.getGameCode())
                .transactionRef(h.getTransactionRef())
                .score(h.getScore())
                .rewardType(h.getRewardType() != null ? h.getRewardType().name() : "NO_LUCK")
                .rewardValue(h.getRewardValue())
                .pointsAwarded(h.getPointsAwarded())
                .voucherCode(h.getVoucherCode())
                .status(h.getStatus())
                .createdAt(h.getCreatedAt())
                .build()
        );
    }

    private GameAdminDto mapToAdminDto(GameHubEntity entity) {
        Map<String, Object> params = parseGameParams(entity.getGameParams());

        return GameAdminDto.builder()
                .id(entity.getId())
                .gameCode(entity.getGameCode())
                .gameName(entity.getGameName())
                .category(entity.getCategory())
                .description(entity.getDescription())
                .rulesText(entity.getRulesText())
                .bannerUrl(entity.getBannerUrl())
                .pricePerTurn(entity.getPricePerTurn())
                .pricePerTurnHtg(entity.getPricePerTurn())
                .freeTurnsDaily(entity.getFreeTurnsDaily())
                .dailyBudgetLimit(entity.getDailyBudgetLimit())
                .allowPointsSpin(entity.getAllowPointsSpin())
                .gameUrl(entity.getGameUrl())
                .iconUrl(entity.getIconUrl())
                .status(entity.getStatus())
                .gameParams(entity.getGameParams())
                .partnerCode(params.containsKey("partnerCode") ? (String) params.get("partnerCode") : null)
                .webhookUrl(params.containsKey("webhookUrl") ? (String) params.get("webhookUrl") : null)
                .revenueSharePercent(params.containsKey("revenueSharePercent") ? ((Number) params.get("revenueSharePercent")).intValue() : 70)
                .quizQuestionCount(params.containsKey("quizQuestionCount") ? ((Number) params.get("quizQuestionCount")).intValue() : null)
                .quizCountdownSec(params.containsKey("quizCountdownSec") ? ((Number) params.get("quizCountdownSec")).intValue() : null)
                .quizRewardPoints(params.containsKey("quizRewardPoints") ? ((Number) params.get("quizRewardPoints")).intValue() : null)
                .farmSeasonDays(params.containsKey("farmSeasonDays") ? ((Number) params.get("farmSeasonDays")).intValue() : null)
                .farmVoucherLimit(params.containsKey("farmVoucherLimit") ? ((Number) params.get("farmVoucherLimit")).intValue() : null)
                .diceMultiplierMax(params.containsKey("diceMultiplierMax") ? ((Number) params.get("diceMultiplierMax")).intValue() : null)
                .build();
    }

    private Map<String, Object> parseGameParams(String json) {
        if (json == null || json.isBlank()) return new java.util.HashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new java.util.HashMap<>();
        }
    }

    public void dispatchOutboundWebhook(String tenantId, String webhookUrl, String partnerCode, String txRef,
                                         String gameCode, String userId, int score, BigDecimal pointsAwarded, String rewardType) {
        try {
            long timestamp = Instant.now().toEpochMilli();
            String payload = String.format("{\"transactionRef\":\"%s\",\"gameCode\":\"%s\",\"externalUserId\":\"%s\",\"score\":%d,\"pointsAwarded\":%s,\"rewardType\":\"%s\",\"timestamp\":%d}",
                    txRef, gameCode, userId, score, pointsAwarded != null ? pointsAwarded.toPlainString() : "0", rewardType, timestamp);

            String secretKey = "GAMEHUB_SECRET_KEY_" + (partnerCode != null ? partnerCode : "PARTNER");
            String signature = SignatureUtils.calculateHmacSha256(payload, secretKey);

            log.info("[GAME-OUTBOUND-WEBHOOK-DISPATCH] tenantId={}, partner={}, url={}, txRef={}, signature={}",
                    tenantId, partnerCode, webhookUrl, txRef, signature);
        } catch (Exception e) {
            log.warn("[GAME-OUTBOUND-WEBHOOK-ERROR] tenantId={}, partner={}, url={}, error={}",
                    tenantId, partnerCode, webhookUrl, e.getMessage());
        }
    }

    // =========================================================================
    // THEME SWITCHER LOGIC
    // =========================================================================
    @Transactional(readOnly = true)
    public ActiveWheelThemeResponse getWheelThemes(String tenantId) {
        List<WheelThemeEntity> themes = wheelThemeRepository.findByTenantId(tenantId);
        String activeThemeCode = themes.stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsActive()))
                .map(t -> t.getThemeCode())
                .findFirst()
                .orElse("THEME_DEFAULT");

        List<WheelThemeDto> dtoList = themes.stream().map(t -> WheelThemeDto.builder()
                .id(t.getId())
                .themeCode(t.getThemeCode())
                .themeName(t.getThemeName())
                .primaryColor(t.getPrimaryColor())
                .secondaryColor(t.getSecondaryColor())
                .accentColor(t.getAccentColor())
                .backgroundUrl(t.getBackgroundUrl())
                .pointerUrl(t.getPointerUrl())
                .centerButtonUrl(t.getCenterButtonUrl())
                .isActive(t.getIsActive())
                .build()
        ).collect(Collectors.toList());

        return ActiveWheelThemeResponse.builder()
                .activeThemeCode(activeThemeCode)
                .availableThemes(dtoList)
                .build();
    }

    @Transactional
    public ActiveWheelThemeResponse selectWheelTheme(String tenantId, SelectWheelThemeRequest request) {
        String targetThemeCode = request.getThemeCode();
        List<WheelThemeEntity> themes = wheelThemeRepository.findByTenantId(tenantId);

        boolean found = false;
        for (WheelThemeEntity theme : themes) {
            if (theme.getThemeCode().equalsIgnoreCase(targetThemeCode)) {
                theme.setIsActive(true);
                found = true;
            } else {
                theme.setIsActive(false);
            }
        }
        if (!found) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Không tìm thấy mã chủ đề giao diện: " + targetThemeCode);
        }

        wheelThemeRepository.saveAll(themes);
        log.info("[WHEEL-THEME-UPDATED] tenantId={}, activeTheme={}", tenantId, targetThemeCode);
        return getWheelThemes(tenantId);
    }

    // =========================================================================
    // FULL SECURE SERVER-SIDE PLAY GAME ENGINE
    // =========================================================================
    @Transactional
    public PlayGameResponse playGame(String tenantId, PlayGameRequest request) {
        String userId = request.getExternalUserId();
        String gameCode = request.getGameCode();
        String lockKey = RedisKeys.getGameLockKey(tenantId, gameCode, userId);

        return lockHelper.executeWithLock(lockKey, () -> {
            GameHubEntity game = gameRepository.findByTenantIdAndGameCode(tenantId, gameCode)
                    .or(() -> gameRepository.findByTenantIdAndGameCode("TENANT_NATCASH", gameCode))
                    .or(() -> gameRepository.findAll().stream().filter(g -> g.getGameCode().equalsIgnoreCase(gameCode)).findFirst())
                    .orElse(null);

            if (game == null) {
                game = GameHubEntity.builder()
                        .tenantId(tenantId)
                        .gameCode(gameCode)
                        .gameName(gameCode)
                        .category("INSTANT_WIN")
                        .pricePerTurn(BigDecimal.valueOf(10))
                        .freeTurnsDaily(1)
                        .allowPointsSpin(true)
                        .status(GameStatus.ACTIVE)
                        .build();
            }

            // 1. Kiểm tra session và trừ lượt
            GameSessionEntity session = null;
            if (request.getSessionToken() != null && !request.getSessionToken().isBlank()) {
                session = sessionRepository.findByTenantIdAndSessionToken(tenantId, request.getSessionToken()).orElse(null);
            }

            int turnsRemaining = 1;
            if (session != null) {
                session.setTurnsUsed(session.getTurnsUsed() + 1);
                sessionRepository.save(session);
                turnsRemaining = Math.max(0, session.getTurnsAllocated() - session.getTurnsUsed());
            }

            // 2. Tải ma trận giải thưởng động từ DB
            List<GamePrizeEntity> dbPrizes = gamePrizeRepository
                    .findByTenantIdAndGameCodeAndStatusOrderByDisplayOrderAsc(tenantId, gameCode, "ACTIVE");
            if (dbPrizes.isEmpty()) {
                dbPrizes = gamePrizeRepository
                        .findByTenantIdAndGameCodeAndStatusOrderByDisplayOrderAsc("TENANT_NATCASH", gameCode, "ACTIVE");
            }

            String outcome = "WIN";
            Integer clientChoice = request.getClientChoice();
            Integer serverResult = null;
            List<Integer> diceValues = null;
            List<String> scratchMatrix = null;
            Integer towerCurrentFloor = request.getStepNumber() != null ? request.getStepNumber() : 1;
            BigDecimal towerMultiplier = BigDecimal.ONE;
            Integer plinkoLandingIndex = null;
            List<Integer> plinkoBouncePath = null;
            BigDecimal pointsToAward = BigDecimal.ZERO;
            PrizeType rewardType = PrizeType.POINTS;
            String message = "Chúc mừng bạn đã hoàn thành lượt chơi!";

            switch (gameCode) {
                case "SCRATCH_CARD": {
                    GamePrizeEntity wonPrize = pickWeightedPrize(dbPrizes);
                    if (wonPrize != null) {
                        pointsToAward = wonPrize.getPrizeValue();
                        message = wonPrize.getPrizeName();
                        String symbol = wonPrize.getPrizeCode().contains("GOLD") ? "GOLD_CHEST"
                                : wonPrize.getPrizeCode().contains("SILVER") ? "SILVER_COIN"
                                : wonPrize.getPrizeCode().contains("BRONZE") ? "BRONZE_STAR" : null;
                        scratchMatrix = generateScratchMatrix(symbol);
                        outcome = symbol != null ? "WIN" : "LOSE";
                    } else {
                        pointsToAward = BigDecimal.valueOf(50);
                        scratchMatrix = generateScratchMatrix("SILVER_COIN");
                        message = "Chúc mừng! Bạn đã cào trúng giải thưởng!";
                    }
                    break;
                }

                case "PENALTY_SHOOTOUT": {
                    int chosenCorner = clientChoice != null ? Math.max(1, Math.min(clientChoice, 4)) : 1;
                    GamePrizeEntity wonPrize = pickWeightedPrize(dbPrizes);
                    if (wonPrize != null) {
                        pointsToAward = wonPrize.getPrizeValue();
                        message = wonPrize.getPrizeName();
                        if ("PENALTY_GOAL".equalsIgnoreCase(wonPrize.getPrizeCode())) {
                            outcome = "WIN";
                            serverResult = (chosenCorner % 4) + 1; // Thủ môn bay lệch góc
                        } else if ("PENALTY_SAVED".equalsIgnoreCase(wonPrize.getPrizeCode())) {
                            outcome = "SAVED";
                            serverResult = chosenCorner; // Thủ môn cản phá
                        } else {
                            outcome = "POST";
                            serverResult = chosenCorner; // Dội xà ngang
                        }
                    } else {
                        outcome = "WIN";
                        serverResult = (chosenCorner % 4) + 1;
                        pointsToAward = BigDecimal.valueOf(80);
                        message = "VÀO! Cú sút phạt đền hiểm hóc đánh bại thủ môn!";
                    }
                    break;
                }

                case "TREASURE_CHEST": {
                    serverResult = clientChoice != null ? Math.max(1, Math.min(clientChoice, 5)) : secureRandom.nextInt(5) + 1;
                    GamePrizeEntity wonPrize = pickWeightedPrize(dbPrizes);
                    if (wonPrize != null) {
                        pointsToAward = wonPrize.getPrizeValue();
                        message = wonPrize.getPrizeName();
                        outcome = wonPrize.getPrizeCode().contains("TRAP") ? "LOSE" : "WIN";
                    } else {
                        pointsToAward = BigDecimal.valueOf(80);
                        message = "Mở rương vàng thành công!";
                    }
                    break;
                }

                case "TOWER_CLIMB": {
                    List<BigDecimal> multipliers = dbPrizes.stream()
                            .filter(p -> p.getPrizeType() == PrizeType.MULTIPLIER || "MULTIPLIER".equalsIgnoreCase(p.getPrizeType().name()))
                            .map(p -> p.getPrizeValue())
                            .collect(Collectors.toList());

                    if (multipliers.isEmpty()) {
                        multipliers = List.of(BigDecimal.valueOf(1.5), BigDecimal.valueOf(2.5), BigDecimal.valueOf(5.0), BigDecimal.valueOf(10.0), BigDecimal.valueOf(50.0));
                    }

                    if ("CASH_OUT".equalsIgnoreCase(request.getAction())) {
                        outcome = "CASH_OUT";
                        int currentIdx = Math.max(0, Math.min(towerCurrentFloor - 1, multipliers.size() - 1));
                        towerMultiplier = multipliers.get(currentIdx);
                        pointsToAward = BigDecimal.valueOf(20).multiply(towerMultiplier);
                        message = "Bảo toàn kho báu thành công tại tầng " + towerCurrentFloor + "! Nhận ngay " + pointsToAward + " Điểm!";
                    } else {
                        int crashChance = secureRandom.nextInt(100);
                        if (crashChance < 30) {
                            outcome = "CRASH";
                            pointsToAward = BigDecimal.valueOf(5);
                            message = "Đá sập ở tầng " + towerCurrentFloor + "! Bạn nhận 5 Điểm an ủi!";
                        } else {
                            if (towerCurrentFloor >= multipliers.size()) {
                                outcome = "WIN";
                                towerMultiplier = multipliers.get(multipliers.size() - 1);
                                pointsToAward = BigDecimal.valueOf(20).multiply(towerMultiplier);
                                message = "CHINH PHỤC ĐỈNH THÁP! Bạn nhận siêu phần thưởng " + pointsToAward + " Điểm Thưởng!";
                            } else {
                                outcome = "CONTINUE";
                                towerCurrentFloor++;
                                int nextIdx = Math.min(towerCurrentFloor - 1, multipliers.size() - 1);
                                towerMultiplier = multipliers.get(nextIdx);
                                pointsToAward = BigDecimal.ZERO;
                                message = "Vượt qua tầng an toàn! Bạn có thể bước tiếp lên tầng " + towerCurrentFloor + " hoặc Dừng lại bảo toàn!";
                            }
                        }
                    }
                    break;
                }

                case "PLINKO_DROP": {
                    plinkoBouncePath = new ArrayList<>();
                    int rightBounces = 0;
                    for (int r = 0; r < 8; r++) {
                        int dir = secureRandom.nextInt(2);
                        plinkoBouncePath.add(dir);
                        rightBounces += dir;
                    }
                    plinkoLandingIndex = rightBounces;

                    List<BigDecimal> binMultipliers = dbPrizes.stream()
                            .filter(p -> p.getPrizeType() == PrizeType.MULTIPLIER || "MULTIPLIER".equalsIgnoreCase(p.getPrizeType().name()))
                            .map(p -> p.getPrizeValue())
                            .collect(Collectors.toList());

                    if (binMultipliers.size() < 9) {
                        binMultipliers = List.of(
                                BigDecimal.valueOf(10.0), BigDecimal.valueOf(5.0), BigDecimal.valueOf(2.0),
                                BigDecimal.valueOf(1.0), BigDecimal.valueOf(0.5), BigDecimal.valueOf(1.0),
                                BigDecimal.valueOf(2.0), BigDecimal.valueOf(5.0), BigDecimal.valueOf(10.0)
                        );
                    }

                    BigDecimal mult = binMultipliers.get(Math.min(plinkoLandingIndex, binMultipliers.size() - 1));
                    pointsToAward = BigDecimal.valueOf(30).multiply(mult);
                    message = "Bi rơi vào hộc nhân x" + mult + "! Bạn nhận " + pointsToAward + " Điểm Thưởng!";
                    break;
                }

                case "GOLDEN_EGG": {
                    serverResult = clientChoice != null ? Math.max(1, Math.min(clientChoice, 5)) : secureRandom.nextInt(5) + 1;
                    GamePrizeEntity wonPrize = pickWeightedPrize(dbPrizes);
                    if (wonPrize != null) {
                        pointsToAward = wonPrize.getPrizeValue();
                        message = wonPrize.getPrizeName();
                        outcome = wonPrize.getPrizeCode().contains("CHICK") ? "LOSE" : "WIN";
                    } else {
                        pointsToAward = BigDecimal.valueOf(75);
                        message = "Đập vỡ trứng vàng thành công!";
                    }
                    break;
                }

                case "LUCKY_DICE": {
                    diceValues = new ArrayList<>();
                    int d1 = secureRandom.nextInt(6) + 1;
                    int d2 = secureRandom.nextInt(6) + 1;
                    int d3 = secureRandom.nextInt(6) + 1;
                    diceValues.add(d1);
                    diceValues.add(d2);
                    diceValues.add(d3);

                    if (d1 == d2 && d2 == d3) {
                        GamePrizeEntity prize = findPrizeByCode(dbPrizes, "DICE_TRIPLE");
                        pointsToAward = prize != null ? prize.getPrizeValue() : BigDecimal.valueOf(300);
                        message = "SIÊU BỘ BA MAY MẮN (" + d1 + "-" + d2 + "-" + d3 + ")! Bạn nhận " + pointsToAward + " Điểm Thưởng!";
                    } else if (isStraight(d1, d2, d3)) {
                        GamePrizeEntity prize = findPrizeByCode(dbPrizes, "DICE_STRAIGHT");
                        pointsToAward = prize != null ? prize.getPrizeValue() : BigDecimal.valueOf(150);
                        message = "SẢNH TIẾN RỰC RỠ (" + d1 + "-" + d2 + "-" + d3 + ")! Bạn nhận " + pointsToAward + " Điểm Thưởng!";
                    } else if (d1 == d2 || d2 == d3 || d1 == d3) {
                        GamePrizeEntity prize = findPrizeByCode(dbPrizes, "DICE_PAIR");
                        pointsToAward = prize != null ? prize.getPrizeValue() : BigDecimal.valueOf(60);
                        message = "ĐÔI XÚC XẮC MAY MẮN (" + d1 + "-" + d2 + "-" + d3 + ")! Bạn nhận " + pointsToAward + " Điểm Thưởng!";
                    } else {
                        int total = d1 + d2 + d3;
                        pointsToAward = BigDecimal.valueOf(total * 5L);
                        message = "Lắc được tổng " + total + " điểm nút! Bạn nhận " + pointsToAward + " Điểm Thưởng!";
                    }
                    break;
                }

                default: {
                    pointsToAward = BigDecimal.valueOf(25);
                    message = "Lượt chơi hoàn tất! Bạn nhận được " + pointsToAward + " Điểm Thưởng!";
                    break;
                }
            }

            // 3. Khống chế hạn mức ngân sách ngày của Game
            if (game.getDailyBudgetLimit() != null && game.getDailyBudgetLimit().compareTo(BigDecimal.ZERO) > 0 && pointsToAward.compareTo(BigDecimal.ZERO) > 0) {
                String todayStr = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
                String budgetKey = RedisKeys.getGameDailyBudgetKey(tenantId, game.getId(), todayStr);
                RAtomicLong dailySpent = redissonClient.getAtomicLong(budgetKey);

                long newSpent = dailySpent.addAndGet(pointsToAward.longValue());
                if (dailySpent.remainTimeToLive() < 0) {
                    dailySpent.expire(Duration.ofHours(24));
                }

                if (newSpent > game.getDailyBudgetLimit().longValue()) {
                    log.warn("[GAME-BUDGET-EXCEEDED] tenantId={}, game={}, spent={}, limit={}",
                            tenantId, game.getGameCode(), newSpent, game.getDailyBudgetLimit());
                    dailySpent.addAndGet(-pointsToAward.longValue());
                    pointsToAward = BigDecimal.valueOf(5);
                    message = "Hạn mức ngân sách ngày của game đã chạm trần, bạn nhận 5 Điểm an ủi!";
                }
            }

            // 4. Cộng điểm vào tài khoản hội viên và Sổ cái
            LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, userId);
            BigDecimal currentPoints = account.getCurrentPoints();

            if (pointsToAward.compareTo(BigDecimal.ZERO) > 0) {
                currentPoints = currentPoints.add(pointsToAward);
                account.setCurrentPoints(currentPoints);
                accountRepository.save(account);

                String txRef = "GAME_PLAY_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
                LoyaltyPointLedgerEntity ledger = LoyaltyPointLedgerEntity.builder()
                        .tenantId(tenantId)
                        .account(account)
                        .pointChange(pointsToAward)
                        .balanceAfter(currentPoints)
                        .changeType(PointActionType.EARN)
                        .referenceCode(txRef)
                        .partnerId(getDefaultPartnerId(tenantId))
                        .description("Thưởng trò chơi: " + game.getGameName() + " (" + outcome + ")")
                        .createdAt(Instant.now())
                        .build();
                ledgerRepository.save(ledger);
            }

            // 5. Ghi lịch sử chơi game bất biến
            String transactionRef = "PLAY_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            GamePlayHistoryEntity history = GamePlayHistoryEntity.builder()
                    .tenantId(tenantId)
                    .externalUserId(userId)
                    .gameCode(gameCode)
                    .sessionToken(session != null ? session.getSessionToken() : null)
                    .transactionRef(transactionRef)
                    .score(pointsToAward.intValue())
                    .rewardType(rewardType)
                    .rewardValue(pointsToAward)
                    .pointsAwarded(pointsToAward)
                    .status("SUCCESS")
                    .createdAt(Instant.now())
                    .build();
            historyRepository.save(history);

            log.info("[GAME-PLAY-COMPLETED] tenantId={}, user={}, game={}, outcome={}, points={}, newBalance={}",
                    tenantId, userId, gameCode, outcome, pointsToAward, currentPoints);

            return PlayGameResponse.builder()
                    .transactionRef(transactionRef)
                    .gameCode(gameCode)
                    .gameName(game.getGameName())
                    .outcome(outcome)
                    .clientChoice(clientChoice)
                    .serverResult(serverResult)
                    .diceValues(diceValues)
                    .scratchMatrix(scratchMatrix)
                    .towerCurrentFloor(towerCurrentFloor)
                    .towerMultiplier(towerMultiplier)
                    .plinkoLandingIndex(plinkoLandingIndex)
                    .plinkoBouncePath(plinkoBouncePath)
                    .rewardType(rewardType.name())
                    .rewardValue(pointsToAward)
                    .pointsAwarded(pointsToAward)
                    .newPointBalance(currentPoints)
                    .turnsRemaining(turnsRemaining)
                    .message(message)
                    .timestamp(Instant.now())
                    .build();
        });
    }

    private List<String> generateScratchMatrix(String winSymbol) {
        String[] allSymbols = {"GOLD_CHEST", "SILVER_COIN", "BRONZE_STAR", "DIAMOND", "CROWN", "RUBY", "TREASURE", "COIN_BAG"};
        List<String> matrix = new ArrayList<>();
        if (winSymbol != null) {
            for (int i = 0; i < 3; i++) matrix.add(winSymbol);
            for (int i = 0; i < 6; i++) {
                String s;
                do {
                    s = allSymbols[secureRandom.nextInt(allSymbols.length)];
                } while (s.equals(winSymbol));
                matrix.add(s);
            }
        } else {
            for (int i = 0; i < 9; i++) {
                matrix.add(allSymbols[i % allSymbols.length]);
            }
        }
        Collections.shuffle(matrix, secureRandom);
        return matrix;
    }

    private boolean isStraight(int d1, int d2, int d3) {
        List<Integer> list = new ArrayList<>(List.of(d1, d2, d3));
        Collections.sort(list);
        return (list.get(0) + 1 == list.get(1)) && (list.get(1) + 1 == list.get(2));
    }

    private GamePrizeEntity pickWeightedPrize(List<GamePrizeEntity> prizes) {
        if (prizes == null || prizes.isEmpty()) return null;
        int totalWeight = prizes.stream().mapToInt(p -> p.getProbabilityWeight() != null ? p.getProbabilityWeight() : 0).sum();
        if (totalWeight <= 0) return prizes.get(0);
        int rand = secureRandom.nextInt(totalWeight);
        int cumulative = 0;
        for (GamePrizeEntity p : prizes) {
            cumulative += p.getProbabilityWeight();
            if (rand < cumulative) {
                return p;
            }
        }
        return prizes.get(prizes.size() - 1);
    }

    private GamePrizeEntity findPrizeByCode(List<GamePrizeEntity> prizes, String prizeCode) {
        if (prizes == null) return null;
        return prizes.stream()
                .filter(p -> p.getPrizeCode().equalsIgnoreCase(prizeCode))
                .findFirst()
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<GamePrizeDto> getGamePrizesAdmin(String tenantId, String gameCode) {
        return gamePrizeRepository.findByTenantIdAndGameCodeOrderByDisplayOrderAsc(tenantId, gameCode)
                .stream()
                .map(p -> GamePrizeDto.builder()
                        .id(p.getId())
                        .gameCode(p.getGameCode())
                        .prizeCode(p.getPrizeCode())
                        .prizeName(p.getPrizeName())
                        .nameVi(p.getNameVi() != null ? p.getNameVi() : p.getPrizeName())
                        .nameEn(p.getNameEn())
                        .nameFr(p.getNameFr())
                        .nameHt(p.getNameHt())
                        .prizeType(p.getPrizeType() != null ? p.getPrizeType().name() : "POINTS")
                        .prizeValue(p.getPrizeValue())
                        .probabilityWeight(p.getProbabilityWeight())
                        .dailyBudgetLimit(p.getDailyBudgetLimit())
                        .weeklyBudgetLimit(p.getWeeklyBudgetLimit())
                        .monthlyBudgetLimit(p.getMonthlyBudgetLimit())
                        .dailyMaxWinners(p.getDailyMaxWinners())
                        .weeklyMaxWinners(p.getWeeklyMaxWinners())
                        .monthlyMaxWinners(p.getMonthlyMaxWinners())
                        .colorCode(p.getColorCode())
                        .iconSymbol(p.getIconSymbol())
                        .bgImageUrl(p.getBgImageUrl())
                        .displayOrder(p.getDisplayOrder())
                        .status(p.getStatus())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public GamePrizeDto saveGamePrizeAdmin(String tenantId, String gameCode, GamePrizeDto dto) {
        GamePrizeEntity entity;
        if (dto.getId() != null) {
            entity = gamePrizeRepository.findByIdAndTenantId(dto.getId(), tenantId)
                    .or(() -> gamePrizeRepository.findById(dto.getId()))
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.SYSTEM_ERROR, "Không tìm thấy giải thưởng #" + dto.getId()));
        } else {
            entity = GamePrizeEntity.builder()
                    .tenantId(tenantId)
                    .gameCode(gameCode)
                    .createdAt(Instant.now())
                    .build();
        }
        entity.setPrizeCode(dto.getPrizeCode() != null ? dto.getPrizeCode() : "PRIZE_" + System.currentTimeMillis());
        entity.setPrizeName(dto.getPrizeName());
        entity.setNameVi(dto.getNameVi() != null ? dto.getNameVi() : dto.getPrizeName());
        entity.setNameEn(dto.getNameEn());
        entity.setNameFr(dto.getNameFr());
        entity.setNameHt(dto.getNameHt());
        if (dto.getPrizeType() != null) {
            try {
                entity.setPrizeType(PrizeType.valueOf(dto.getPrizeType().toUpperCase()));
            } catch (Exception e) {
                entity.setPrizeType(PrizeType.POINTS);
            }
        }
        entity.setPrizeValue(dto.getPrizeValue() != null ? dto.getPrizeValue() : BigDecimal.ZERO);
        entity.setProbabilityWeight(dto.getProbabilityWeight() != null ? dto.getProbabilityWeight() : 100);
        entity.setDailyBudgetLimit(dto.getDailyBudgetLimit());
        entity.setWeeklyBudgetLimit(dto.getWeeklyBudgetLimit());
        entity.setMonthlyBudgetLimit(dto.getMonthlyBudgetLimit());
        entity.setDailyMaxWinners(dto.getDailyMaxWinners());
        entity.setWeeklyMaxWinners(dto.getWeeklyMaxWinners());
        entity.setMonthlyMaxWinners(dto.getMonthlyMaxWinners());
        entity.setColorCode(dto.getColorCode() != null ? dto.getColorCode() : "#F59E0B");
        entity.setIconSymbol(dto.getIconSymbol() != null ? dto.getIconSymbol() : "🎁");
        entity.setBgImageUrl(dto.getBgImageUrl());
        entity.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");
        entity.setUpdatedAt(Instant.now());

        GamePrizeEntity saved = gamePrizeRepository.save(entity);
        return GamePrizeDto.builder()
                .id(saved.getId())
                .gameCode(saved.getGameCode())
                .prizeCode(saved.getPrizeCode())
                .prizeName(saved.getPrizeName())
                .nameVi(saved.getNameVi())
                .nameEn(saved.getNameEn())
                .nameFr(saved.getNameFr())
                .nameHt(saved.getNameHt())
                .prizeType(saved.getPrizeType() != null ? saved.getPrizeType().name() : "POINTS")
                .prizeValue(saved.getPrizeValue())
                .probabilityWeight(saved.getProbabilityWeight())
                .dailyBudgetLimit(saved.getDailyBudgetLimit())
                .weeklyBudgetLimit(saved.getWeeklyBudgetLimit())
                .monthlyBudgetLimit(saved.getMonthlyBudgetLimit())
                .dailyMaxWinners(saved.getDailyMaxWinners())
                .weeklyMaxWinners(saved.getWeeklyMaxWinners())
                .monthlyMaxWinners(saved.getMonthlyMaxWinners())
                .colorCode(saved.getColorCode())
                .iconSymbol(saved.getIconSymbol())
                .bgImageUrl(saved.getBgImageUrl())
                .displayOrder(saved.getDisplayOrder())
                .status(saved.getStatus())
                .build();
    }

    @Transactional
    public void deleteGamePrizeAdmin(String tenantId, Long prizeId) {
        GamePrizeEntity entity = gamePrizeRepository.findByIdAndTenantId(prizeId, tenantId)
                .or(() -> gamePrizeRepository.findById(prizeId))
                .orElseThrow(() -> new LoyaltyException(ErrorCode.SYSTEM_ERROR, "Không tìm thấy giải thưởng #" + prizeId));
        gamePrizeRepository.delete(entity);
    }

    @Transactional
    public List<GamePrizeDto> autoBalanceGamePrizes(String tenantId, String gameCode) {
        List<GamePrizeEntity> prizes = gamePrizeRepository.findByTenantIdAndGameCodeOrderByDisplayOrderAsc(tenantId, gameCode);
        if (!prizes.isEmpty()) {
            int targetTotal = 1000;
            int totalWeight = prizes.stream().mapToInt(p -> p.getProbabilityWeight() != null ? p.getProbabilityWeight() : 0).sum();
            if (totalWeight > 0) {
                int runningSum = 0;
                for (int i = 0; i < prizes.size(); i++) {
                    GamePrizeEntity p = prizes.get(i);
                    if (i == prizes.size() - 1) {
                        p.setProbabilityWeight(Math.max(1, targetTotal - runningSum));
                    } else {
                        int scaled = (int) Math.round((double) p.getProbabilityWeight() * targetTotal / totalWeight);
                        p.setProbabilityWeight(Math.max(1, scaled));
                        runningSum += p.getProbabilityWeight();
                    }
                    p.setUpdatedAt(Instant.now());
                }
                gamePrizeRepository.saveAll(prizes);
            }
        }
        return getGamePrizesAdmin(tenantId, gameCode);
    }

    private Long getDefaultPartnerId(String tenantId) {
        if (partnerRepository == null) {
            return null;
        }
        String defaultCode = "TENANT_MICRO_CRM".equalsIgnoreCase(tenantId) ? "DELIMART_RETAIL" : "NATCASH_WALLET";
        return partnerRepository.findByTenantIdAndPartnerCode(tenantId, defaultCode)
                .map(LoyaltyPartnerEntity::getId)
                .orElse(null);
    }
}

