package com.natcash.loyalty.wheel.service;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.PrizeType;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.PrizeConfigDto;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.SpinWheelRequest;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.SpinWheelResponse;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.WheelConfigRequest;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.WheelConfigResponse;
import com.natcash.loyalty.wheel.entity.LuckyWheelEntity;
import com.natcash.loyalty.wheel.entity.LuckyWheelPrizeEntity;
import com.natcash.loyalty.wheel.repository.LuckyWheelPrizeRepository;
import com.natcash.loyalty.wheel.repository.LuckyWheelRepository;

import org.redisson.api.RAtomicLong;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LuckyWheelService {

    private static final Logger log = LoggerFactory.getLogger(LuckyWheelService.class);
    private static final SecureRandom secureRandom = new SecureRandom();

    private final LuckyWheelRepository wheelRepository;
    private final LuckyWheelPrizeRepository prizeRepository;
    private final AccountService accountService;
    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final DistributedLockHelper lockHelper;
    private final RedissonClient redissonClient;

    public LuckyWheelService(LuckyWheelRepository wheelRepository,
                             LuckyWheelPrizeRepository prizeRepository,
                             AccountService accountService,
                             LoyaltyAccountRepository accountRepository,
                             LoyaltyPointLedgerRepository ledgerRepository,
                             DistributedLockHelper lockHelper,
                             RedissonClient redissonClient) {
        this.wheelRepository = wheelRepository;
        this.prizeRepository = prizeRepository;
        this.accountService = accountService;
        this.accountRepository = accountRepository;
        this.ledgerRepository = ledgerRepository;
        this.lockHelper = lockHelper;
        this.redissonClient = redissonClient;
    }

    @Transactional(readOnly = true)
    public WheelConfigResponse getWheelConfig(String tenantId, WheelConfigRequest request) {
        String wheelCode = request != null && request.getWheelCode() != null && !request.getWheelCode().isBlank()
                ? request.getWheelCode()
                : "DEFAULT_LUCKY_WHEEL";

        LuckyWheelEntity wheel = wheelRepository.findByTenantIdAndWheelCodeAndStatus(tenantId, wheelCode, CommonStatus.ACTIVE)
                .orElseGet(() -> wheelRepository.findByTenantIdAndWheelCode(tenantId, wheelCode)
                        .orElseThrow(() -> new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Không tìm thấy cấu hình vòng quay may mắn")));

        List<LuckyWheelPrizeEntity> prizes = prizeRepository.findByWheel_IdAndStatusOrderByDisplayOrderAsc(wheel.getId(), CommonStatus.ACTIVE);

        List<PrizeConfigDto> prizeDtos = prizes.stream().map(p -> PrizeConfigDto.builder()
                .prizeId(p.getId())
                .prizeName(p.getPrizeName())
                .prizeType(p.getPrizeType())
                .prizeValue(p.getPrizeValue())
                .displayOrder(p.getDisplayOrder())
                .colorCode(p.getColorCode())
                .iconUrl(p.getIconUrl())
                .build()
        ).collect(Collectors.toList());

        return WheelConfigResponse.builder()
                .wheelId(wheel.getId())
                .wheelCode(wheel.getWheelCode())
                .wheelName(wheel.getWheelName())
                .pricePerSpin(wheel.getPricePerSpin())
                .freeSpinsDaily(wheel.getFreeSpinsDaily())
                .remainingSpinsToday(wheel.getFreeSpinsDaily())
                .prizes(prizeDtos)
                .build();
    }

    @Transactional
    public SpinWheelResponse executeSpin(String tenantId, SpinWheelRequest request) {
        String userId = request.getExternalUserId();
        String wheelCode = request.getWheelCode();

        LuckyWheelEntity wheel = wheelRepository.findByTenantIdAndWheelCodeAndStatus(tenantId, wheelCode, CommonStatus.ACTIVE)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Vòng quay may mắn đang tạm dừng hoặc không tồn tại"));

        String lockKey = "lock:spin:" + tenantId + ":" + wheel.getId() + ":" + userId;

        return lockHelper.executeWithLock(lockKey, () -> {
            List<LuckyWheelPrizeEntity> prizes = prizeRepository.findByWheel_IdAndStatusOrderByDisplayOrderAsc(wheel.getId(), CommonStatus.ACTIVE);
            if (prizes.isEmpty()) {
                throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Vòng quay chưa được thiết lập cơ cấu giải thưởng");
            }

            LoyaltyAccountEntity account = accountService.getAccountForUpdate(tenantId, userId);
            BigDecimal currentPoints = account.getCurrentPoints();

            // 1. Trừ điểm nếu vòng quay có thu phí điểm
            if (wheel.getPricePerSpin() != null && wheel.getPricePerSpin().compareTo(BigDecimal.ZERO) > 0) {
                if (currentPoints.compareTo(wheel.getPricePerSpin()) < 0) {
                    log.warn("[SPIN-INSUFFICIENT-POINTS] user={}, balance={}, price={}",
                            userId, currentPoints, wheel.getPricePerSpin());
                    throw new LoyaltyException(ErrorCode.INSUFFICIENT_POINTS, "Số dư điểm không đủ để tham gia vòng quay");
                }

                currentPoints = currentPoints.subtract(wheel.getPricePerSpin());
                account.setCurrentPoints(currentPoints);
                accountRepository.save(account);

                String feeTx = "SPIN_FEE_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
                LoyaltyPointLedgerEntity feeLedger = LoyaltyPointLedgerEntity.builder()
                        .tenantId(tenantId)
                        .account(account)
                        .pointChange(wheel.getPricePerSpin().negate())
                        .balanceAfter(currentPoints)
                        .changeType(PointActionType.BURN)
                        .referenceCode(feeTx)
                        .description("Phí tham gia vòng quay: " + wheel.getWheelName())
                        .createdAt(Instant.now())
                        .build();
                ledgerRepository.save(feeLedger);
            }

            // 2. Thuật toán phân bổ giải thưởng ngẫu nhiên theo ma trận trọng số xác suất
            int totalWeight = prizes.stream().mapToInt(p -> p.getProbabilityWeight() != null ? p.getProbabilityWeight() : 1).sum();
            if (totalWeight <= 0) {
                totalWeight = 100;
            }

            int randomVal = secureRandom.nextInt(totalWeight);
            int cumulativeWeight = 0;
            LuckyWheelPrizeEntity winningPrize = prizes.get(0);
            int winningIndex = 0;

            for (int i = 0; i < prizes.size(); i++) {
                cumulativeWeight += prizes.get(i).getProbabilityWeight();
                if (randomVal < cumulativeWeight) {
                    winningPrize = prizes.get(i);
                    winningIndex = i;
                    break;
                }
            }

            // 3. Khống chế ngân sách trúng thưởng nguyên tử hàng ngày qua Redis Atomic DECRBY / INCRBY
            if (winningPrize.getDailyBudgetLimit() != null && winningPrize.getDailyBudgetLimit().compareTo(BigDecimal.ZERO) > 0) {
                String todayStr = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
                String budgetKey = "budget:spin:" + tenantId + ":" + winningPrize.getId() + ":" + todayStr;
                RAtomicLong dailySpent = redissonClient.getAtomicLong(budgetKey);

                long prizeCost = winningPrize.getPrizeValue().longValue();
                long newSpent = dailySpent.addAndGet(prizeCost);
                if (dailySpent.remainTimeToLive() < 0) {
                    dailySpent.expire(Duration.ofHours(24));
                }

                if (newSpent > winningPrize.getDailyBudgetLimit().longValue()) {
                    log.warn("[SPIN-BUDGET-EXCEEDED] tenantId={}, prize={}, spent={}, limit={}",
                            tenantId, winningPrize.getPrizeName(), newSpent, winningPrize.getDailyBudgetLimit());
                    // Hoàn lại ngân sách đã cộng thử
                    dailySpent.addAndGet(-prizeCost);

                    // Fallback về giải khuyến khích / chúc may mắn lần sau
                    for (int i = 0; i < prizes.size(); i++) {
                        if (prizes.get(i).getPrizeType() == PrizeType.NO_LUCK || prizes.get(i).getDailyBudgetLimit() == null) {
                            winningPrize = prizes.get(i);
                            winningIndex = i;
                            break;
                        }
                    }
                }
            }

            // 4. Cộng thưởng cho người dùng và ghi sổ cái bất biến nếu trúng điểm
            if (winningPrize.getPrizeType() == PrizeType.POINTS && winningPrize.getPrizeValue().compareTo(BigDecimal.ZERO) > 0) {
                currentPoints = currentPoints.add(winningPrize.getPrizeValue());
                account.setCurrentPoints(currentPoints);
                accountRepository.save(account);

                String rewardTx = "SPIN_REWARD_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
                LoyaltyPointLedgerEntity rewardLedger = LoyaltyPointLedgerEntity.builder()
                        .tenantId(tenantId)
                        .account(account)
                        .pointChange(winningPrize.getPrizeValue())
                        .balanceAfter(currentPoints)
                        .changeType(PointActionType.EARN)
                        .referenceCode(rewardTx)
                        .description("Trúng thưởng vòng quay: " + winningPrize.getPrizeName())
                        .createdAt(Instant.now())
                        .build();
                ledgerRepository.save(rewardLedger);
            }

            // 5. Tính toán góc dừng Canvas (360 độ / số ô)
            int totalSlices = prizes.size();
            double sliceAngle = 360.0 / totalSlices;
            double winningAngle = (winningIndex * sliceAngle) + (sliceAngle / 2.0);

            log.info("[SPIN-SUCCESS] tenantId={}, user={}, prize={}, index={}, angle={}, newBalance={}",
                    tenantId, userId, winningPrize.getPrizeName(), winningIndex, winningAngle, currentPoints);

            return SpinWheelResponse.builder()
                    .prizeId(winningPrize.getId())
                    .prizeName(winningPrize.getPrizeName())
                    .prizeType(winningPrize.getPrizeType())
                    .prizeValue(winningPrize.getPrizeValue())
                    .winningIndex(winningIndex)
                    .winningAngle(winningAngle)
                    .newPointBalance(currentPoints)
                    .remainingSpinsToday(0)
                    .message(winningPrize.getPrizeType() == PrizeType.NO_LUCK ? "Chúc bạn may mắn lần sau!" : "Chúc mừng bạn đã trúng " + winningPrize.getPrizeName())
                    .timestamp(Instant.now())
                    .build();
        });
    }
}
