package com.natcash.loyalty.wheel.service;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.account.service.AccountService;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.RedisKeys;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.PointActionType;
import com.natcash.loyalty.domain.enums.PrizeType;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.ledger.entity.LoyaltyPointLedgerEntity;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.lock.DistributedLockHelper;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.AutoBalancePrizesResponse;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.PrizeConfigDto;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.SpinWheelRequest;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.SpinWheelResponse;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.WheelConfigRequest;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.WheelConfigResponse;
import com.natcash.loyalty.wheel.dto.LuckyWheelDto.WheelPrizeAdminDto;
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
                .nameVi(p.getNameVi() != null ? p.getNameVi() : p.getPrizeName())
                .nameEn(p.getNameEn() != null ? p.getNameEn() : p.getPrizeName())
                .nameFr(p.getNameFr() != null ? p.getNameFr() : p.getPrizeName())
                .nameHt(p.getNameHt() != null ? p.getNameHt() : p.getPrizeName())
                .prizeType(p.getPrizeType())
                .prizeValue(p.getPrizeValue())
                .displayOrder(p.getDisplayOrder())
                .colorCode(p.getColorCode())
                .iconUrl(p.getIconUrl())
                .iconSymbol(p.getIconSymbol() != null ? p.getIconSymbol() : "🎁")
                .bgImageUrl(p.getBgImageUrl())
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

        String lockKey = RedisKeys.getSpinLockKey(tenantId, userId, wheel.getId());

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

            // 3. Khống chế ngân sách trúng thưởng Ngày / Tuần / Tháng nguyên tử qua Redis Atomic
            boolean budgetExceeded = false;
            LocalDate now = LocalDate.now();
            String todayStr = now.format(DateTimeFormatter.BASIC_ISO_DATE);
            int weekOfYear = now.get(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR);
            int weekYear = now.get(java.time.temporal.IsoFields.WEEK_BASED_YEAR);
            String weekStr = weekYear + "_W" + String.format("%02d", weekOfYear);
            String monthStr = now.format(DateTimeFormatter.ofPattern("yyyyMM"));

            long prizeCost = winningPrize.getPrizeValue() != null ? winningPrize.getPrizeValue().longValue() : 0;

            // 3.1 Kiểm tra ngân sách Ngày
            if (winningPrize.getDailyBudgetLimit() != null && winningPrize.getDailyBudgetLimit().compareTo(BigDecimal.ZERO) > 0) {
                String dayKey = "budget:spin:" + tenantId + ":" + winningPrize.getId() + ":D:" + todayStr;
                RAtomicLong daySpent = redissonClient.getAtomicLong(dayKey);
                long newSpent = daySpent.addAndGet(prizeCost);
                if (daySpent.remainTimeToLive() < 0) {
                    daySpent.expire(Duration.ofHours(24));
                }
                if (newSpent > winningPrize.getDailyBudgetLimit().longValue()) {
                    daySpent.addAndGet(-prizeCost);
                    budgetExceeded = true;
                }
            }

            // 3.2 Kiểm tra ngân sách Tuần
            if (!budgetExceeded && winningPrize.getWeeklyBudgetLimit() != null && winningPrize.getWeeklyBudgetLimit().compareTo(BigDecimal.ZERO) > 0) {
                String weekKey = "budget:spin:" + tenantId + ":" + winningPrize.getId() + ":W:" + weekStr;
                RAtomicLong weekSpent = redissonClient.getAtomicLong(weekKey);
                long newSpent = weekSpent.addAndGet(prizeCost);
                if (weekSpent.remainTimeToLive() < 0) {
                    weekSpent.expire(Duration.ofDays(8));
                }
                if (newSpent > winningPrize.getWeeklyBudgetLimit().longValue()) {
                    weekSpent.addAndGet(-prizeCost);
                    budgetExceeded = true;
                }
            }

            // 3.3 Kiểm tra ngân sách Tháng
            if (!budgetExceeded && winningPrize.getMonthlyBudgetLimit() != null && winningPrize.getMonthlyBudgetLimit().compareTo(BigDecimal.ZERO) > 0) {
                String monthKey = "budget:spin:" + tenantId + ":" + winningPrize.getId() + ":M:" + monthStr;
                RAtomicLong monthSpent = redissonClient.getAtomicLong(monthKey);
                long newSpent = monthSpent.addAndGet(prizeCost);
                if (monthSpent.remainTimeToLive() < 0) {
                    monthSpent.expire(Duration.ofDays(32));
                }
                if (newSpent > winningPrize.getMonthlyBudgetLimit().longValue()) {
                    monthSpent.addAndGet(-prizeCost);
                    budgetExceeded = true;
                }
            }

            if (budgetExceeded) {
                log.warn("[SPIN-BUDGET-EXCEEDED] tenantId={}, prize={}", tenantId, winningPrize.getPrizeName());
                for (int i = 0; i < prizes.size(); i++) {
                    if (prizes.get(i).getPrizeType() == PrizeType.NO_LUCK || prizes.get(i).getDailyBudgetLimit() == null) {
                        winningPrize = prizes.get(i);
                        winningIndex = i;
                        break;
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

    // ── CMS ADMIN WHEEL PRIZE OPERATIONS ──

    @Transactional(readOnly = true)
    public List<WheelPrizeAdminDto> getAllPrizesAdmin(String tenantId, String wheelCode) {
        String effectiveWheelCode = wheelCode != null && !wheelCode.isBlank() ? wheelCode : "DEFAULT_LUCKY_WHEEL";
        LuckyWheelEntity wheel = wheelRepository.findByTenantIdAndWheelCode(tenantId, effectiveWheelCode)
                .orElseGet(() -> wheelRepository.findAll().stream().filter(w -> tenantId.equals(w.getTenantId())).findFirst()
                        .orElseThrow(() -> new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Không tìm thấy cấu hình vòng quay")));

        List<LuckyWheelPrizeEntity> prizes = prizeRepository.findByWheel_IdOrderByDisplayOrderAsc(wheel.getId());
        return prizes.stream().map(p -> WheelPrizeAdminDto.builder()
                .id(p.getId())
                .displayOrder(p.getDisplayOrder())
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
                .dailyMaxWinners(p.getDailyMaxWinners() != null ? p.getDailyMaxWinners() : (p.getDailyBudgetLimit() != null && p.getPrizeValue() != null && p.getPrizeValue().compareTo(BigDecimal.ZERO) > 0
                        ? p.getDailyBudgetLimit().divide(p.getPrizeValue(), java.math.RoundingMode.DOWN).intValue()
                        : 0))
                .weeklyMaxWinners(p.getWeeklyMaxWinners())
                .monthlyMaxWinners(p.getMonthlyMaxWinners())
                .colorCode(p.getColorCode())
                .iconUrl(p.getIconUrl())
                .iconSymbol(p.getIconSymbol() != null ? p.getIconSymbol() : "🎁")
                .bgImageUrl(p.getBgImageUrl())
                .status(p.getStatus() != null ? p.getStatus().name() : "ACTIVE")
                .actualWinCountToday(0)
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public WheelPrizeAdminDto savePrizeAdmin(String tenantId, String wheelCode, WheelPrizeAdminDto dto) {
        String effectiveWheelCode = wheelCode != null && !wheelCode.isBlank() ? wheelCode : "DEFAULT_LUCKY_WHEEL";
        LuckyWheelEntity wheel = wheelRepository.findByTenantIdAndWheelCode(tenantId, effectiveWheelCode)
                .orElseGet(() -> wheelRepository.findAll().stream().filter(w -> tenantId.equals(w.getTenantId())).findFirst()
                        .orElseGet(() -> {
                            LuckyWheelEntity newWheel = LuckyWheelEntity.builder()
                                    .tenantId(tenantId)
                                    .wheelCode(effectiveWheelCode)
                                    .wheelName("Vòng Quay May Mắn")
                                    .status(CommonStatus.ACTIVE)
                                    .createdAt(Instant.now())
                                    .build();
                            return wheelRepository.save(newWheel);
                        }));

        LuckyWheelPrizeEntity entity;
        if (dto.getId() != null) {
            entity = prizeRepository.findById(dto.getId())
                    .orElseThrow(() -> new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Không tìm thấy ô thưởng để cập nhật"));
        } else {
            entity = LuckyWheelPrizeEntity.builder()
                    .wheel(wheel)
                    .createdAt(Instant.now())
                    .build();
        }

        entity.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 1);
        String name = dto.getPrizeName() != null && !dto.getPrizeName().isBlank()
                ? dto.getPrizeName()
                : (dto.getNameVi() != null && !dto.getNameVi().isBlank() ? dto.getNameVi() : "Ô Thưởng " + entity.getDisplayOrder());
        entity.setPrizeName(name);
        entity.setNameVi(dto.getNameVi() != null ? dto.getNameVi() : name);
        entity.setNameEn(dto.getNameEn());
        entity.setNameFr(dto.getNameFr());
        entity.setNameHt(dto.getNameHt());
        try {
            entity.setPrizeType(dto.getPrizeType() != null ? PrizeType.valueOf(dto.getPrizeType().toUpperCase().trim()) : PrizeType.POINTS);
        } catch (Exception e) {
            entity.setPrizeType(PrizeType.POINTS);
        }
        entity.setPrizeValue(dto.getPrizeValue() != null ? dto.getPrizeValue() : BigDecimal.ZERO);
        entity.setProbabilityWeight(dto.getProbabilityWeight() != null ? dto.getProbabilityWeight() : 10);
        entity.setDailyBudgetLimit(dto.getDailyBudgetLimit());
        entity.setWeeklyBudgetLimit(dto.getWeeklyBudgetLimit());
        entity.setMonthlyBudgetLimit(dto.getMonthlyBudgetLimit());
        entity.setDailyMaxWinners(dto.getDailyMaxWinners());
        entity.setWeeklyMaxWinners(dto.getWeeklyMaxWinners());
        entity.setMonthlyMaxWinners(dto.getMonthlyMaxWinners());
        entity.setColorCode(dto.getColorCode() != null ? dto.getColorCode() : "#F59E0B");
        entity.setIconUrl(dto.getIconUrl());
        entity.setIconSymbol(dto.getIconSymbol() != null ? dto.getIconSymbol() : "🎁");
        entity.setBgImageUrl(dto.getBgImageUrl());
        entity.setStatus(dto.getStatus() != null && dto.getStatus().equalsIgnoreCase("INACTIVE") ? CommonStatus.INACTIVE : CommonStatus.ACTIVE);

        LuckyWheelPrizeEntity saved = prizeRepository.save(entity);
        return WheelPrizeAdminDto.builder()
                .id(saved.getId())
                .displayOrder(saved.getDisplayOrder())
                .prizeName(saved.getPrizeName())
                .nameVi(saved.getNameVi())
                .nameEn(saved.getNameEn())
                .nameFr(saved.getNameFr())
                .nameHt(saved.getNameHt())
                .prizeType(saved.getPrizeType().name())
                .prizeValue(saved.getPrizeValue())
                .probabilityWeight(saved.getProbabilityWeight())
                .dailyBudgetLimit(saved.getDailyBudgetLimit())
                .weeklyBudgetLimit(saved.getWeeklyBudgetLimit())
                .monthlyBudgetLimit(saved.getMonthlyBudgetLimit())
                .dailyMaxWinners(saved.getDailyMaxWinners())
                .weeklyMaxWinners(saved.getWeeklyMaxWinners())
                .monthlyMaxWinners(saved.getMonthlyMaxWinners())
                .colorCode(saved.getColorCode())
                .iconUrl(saved.getIconUrl())
                .iconSymbol(saved.getIconSymbol())
                .bgImageUrl(saved.getBgImageUrl())
                .status(saved.getStatus().name())
                .build();
    }

    @Transactional
    public AutoBalancePrizesResponse autoBalancePrizes(String tenantId, String wheelCode) {
        String effectiveWheelCode = wheelCode != null && !wheelCode.isBlank() ? wheelCode : "DEFAULT_LUCKY_WHEEL";
        LuckyWheelEntity wheel = wheelRepository.findByTenantIdAndWheelCode(tenantId, effectiveWheelCode)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Không tìm thấy vòng quay"));

        List<LuckyWheelPrizeEntity> prizes = prizeRepository.findByWheel_IdOrderByDisplayOrderAsc(wheel.getId());
        if (prizes.isEmpty()) {
            throw new LoyaltyException(ErrorCode.POLICY_VIOLATION, "Không có ô thưởng để cân bằng xác suất");
        }

        int count = prizes.size();
        int baseWeight = 100 / count;
        int remainder = 100 % count;

        for (int i = 0; i < count; i++) {
            LuckyWheelPrizeEntity p = prizes.get(i);
            int weight = baseWeight + (i < remainder ? 1 : 0);
            p.setProbabilityWeight(weight);
            prizeRepository.save(p);
        }

        List<WheelPrizeAdminDto> updatedList = getAllPrizesAdmin(tenantId, effectiveWheelCode);
        return AutoBalancePrizesResponse.builder()
                .prizes(updatedList)
                .totalProbability(100)
                .message("Đã cân bằng tự động tổng xác suất 100% thành công")
                .build();
    }
}
