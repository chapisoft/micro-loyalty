package com.natcash.loyalty.game.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
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
import com.natcash.loyalty.game.dto.GameHubDto.GameAdminDto;
import com.natcash.loyalty.game.dto.GameHubDto.GameHubGlobalConfigDto;
import com.natcash.loyalty.game.dto.GameHubDto.GameListItemDto;
import com.natcash.loyalty.game.dto.GameHubDto.GameListRequest;
import com.natcash.loyalty.game.dto.GameHubDto.GameListResponse;
import com.natcash.loyalty.game.dto.GameHubDto.GamePlayHistoryItemDto;
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
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GameHubService {

    private static final Logger log = LoggerFactory.getLogger(GameHubService.class);
    private static final long SESSION_TTL_SECONDS = 1800L; // 30 phút
    private static final ObjectMapper objectMapper = new ObjectMapper();

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

    public GameHubService(GameHubRepository gameRepository,
                          GameSessionRepository sessionRepository,
                          GamePlayHistoryRepository historyRepository,
                          GameHubConfigRepository configRepository,
                          AccountService accountService,
                          LoyaltyAccountRepository accountRepository,
                          LoyaltyPointLedgerRepository ledgerRepository,
                          ClearingTransactionRepository clearingRepository,
                          DistributedLockHelper lockHelper,
                          RedissonClient redissonClient) {
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
        GameHubEntity entity;
        if (dto.getId() != null) {
            entity = gameRepository.findByTenantIdAndId(tenantId, dto.getId())
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Không tìm thấy trò chơi để cập nhật"));
        } else {
            entity = GameHubEntity.builder()
                    .tenantId(tenantId)
                    .gameCode(dto.getGameCode())
                    .createdAt(Instant.now())
                    .build();
        }

        entity.setGameName(dto.getGameName());
        entity.setCategory(dto.getCategory() != null ? dto.getCategory() : "LUCKY_DRAW");
        entity.setPricePerTurn(dto.getPricePerTurnHtg() != null ? dto.getPricePerTurnHtg() : (dto.getPricePerTurn() != null ? dto.getPricePerTurn() : BigDecimal.ZERO));
        entity.setFreeTurnsDaily(dto.getFreeTurnsDaily() != null ? dto.getFreeTurnsDaily() : 1);
        entity.setDailyBudgetLimit(dto.getDailyBudgetLimit() != null ? dto.getDailyBudgetLimit() : new BigDecimal("50000.00"));
        entity.setAllowPointsSpin(dto.getAllowPointsSpin() != null ? dto.getAllowPointsSpin() : true);
        entity.setGameUrl(dto.getGameUrl());
        entity.setIconUrl(dto.getIconUrl());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : GameStatus.ACTIVE);

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
}
