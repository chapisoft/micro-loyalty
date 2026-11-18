package com.natcash.loyalty.engagement.service;

import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.CustomerSegmentCode;
import com.natcash.loyalty.domain.enums.TriggerType;
import com.natcash.loyalty.engagement.entity.CommunicationLogEntity;
import com.natcash.loyalty.engagement.entity.ContentBannerEntity;
import com.natcash.loyalty.engagement.entity.CustomerSegmentMemberEntity;
import com.natcash.loyalty.engagement.entity.PopupImpressionLogEntity;
import com.natcash.loyalty.engagement.entity.PopupRuleEntity;
import com.natcash.loyalty.engagement.entity.TargetedOfferEntity;
import com.natcash.loyalty.engagement.entity.UserInboxMessageEntity;
import com.natcash.loyalty.engagement.repository.CommunicationLogRepository;
import com.natcash.loyalty.engagement.repository.ContentBannerRepository;
import com.natcash.loyalty.engagement.repository.CustomerSegmentMemberRepository;
import com.natcash.loyalty.engagement.repository.PopupImpressionLogRepository;
import com.natcash.loyalty.engagement.repository.PopupRuleRepository;
import com.natcash.loyalty.engagement.repository.TargetedOfferRepository;
import com.natcash.loyalty.engagement.repository.UserInboxMessageRepository;
import com.natcash.loyalty.exception.LoyaltyException;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Content Banners, Startup Popup Rules & Targeted Offers service (Figma 18/11 · CN-06 · Plan GĐ 5).
 */
@Service
@RequiredArgsConstructor
public class ContentEngagementService {

    public static final String SEGMENT_ALL = "ALL";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_SENT = "SENT";
    public static final String POPUP_REWARD_READY = "REWARD_READY";
    public static final String POPUP_VOUCHER_EXPIRING = "VOUCHER_EXPIRING";
    public static final String POPUP_MISSION_ENDING = "MISSION_ENDING";
    public static final String POPUP_CAMPAIGN = "CAMPAIGN_POPUP";

    private static final int DEFAULT_WINDOW_START = 8;
    private static final int DEFAULT_WINDOW_END = 20;
    private static final int DEFAULT_COOLDOWN_HOURS = 24;

    private final ContentBannerRepository bannerRepository;
    private final PopupRuleRepository popupRuleRepository;
    private final PopupImpressionLogRepository impressionLogRepository;
    private final TargetedOfferRepository offerRepository;
    private final CustomerSegmentMemberRepository segmentMemberRepository;
    private final UserInboxMessageRepository inboxRepository;
    private final CommunicationLogRepository commLogRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getHomeContent(String tenantId, String externalUserId, String placement) {
        Set<String> userSegments = resolveUserSegments(tenantId, externalUserId);
        Instant now = Instant.now();

        List<ContentBannerEntity> candidates = (placement != null && !placement.isBlank())
                ? bannerRepository.findByTenantIdAndPlacementAndStatusOrderByDisplayOrderAsc(
                        tenantId, placement.trim().toUpperCase(), STATUS_ACTIVE)
                : bannerRepository.findByTenantIdAndStatusOrderByDisplayOrderAsc(tenantId, STATUS_ACTIVE);

        List<ContentBannerEntity> active = new ArrayList<>();
        Map<String, List<ContentBannerEntity>> byPlacement = new LinkedHashMap<>();

        for (ContentBannerEntity b : candidates) {
            if (!isWithinSchedule(b.getStartDate(), b.getEndDate(), now)) {
                continue;
            }
            if (!matchesSegment(b.getSegmentCode(), userSegments)) {
                continue;
            }
            active.add(b);
            byPlacement.computeIfAbsent(b.getPlacement(), k -> new ArrayList<>()).add(b);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("banners", active);
        response.put("bannersByPlacement", byPlacement);
        response.put("segments", userSegments);
        return response;
    }

    /**
     * Evaluates startup popup rules (CN-06):
     *  - Max 1 popup per opening, remembered for 24h (cooldownHours)
     *  - Only shown within 08:00-20:00 (windowStartHour <= hour < windowEndHour)
     *  - Priority: reward ready > voucher expiring > mission ending > campaign popup
     */
    @Transactional
    public Map<String, Object> resolveStartupPopup(String tenantId,
                                                   String externalUserId,
                                                   boolean hasClaimableReward,
                                                   Integer expiringVoucherDays,
                                                   Integer endingMissionDays,
                                                   Integer localHour) {
        Map<String, Object> res = new LinkedHashMap<>();
        if (externalUserId == null || externalUserId.isBlank()) {
            res.put("popup", null);
            res.put("suppressedReason", "ANONYMOUS");
            return res;
        }

        int hour = localHour != null ? localHour : ZonedDateTime.now(ZoneOffset.UTC).getHour();
        if (hour < DEFAULT_WINDOW_START || hour >= DEFAULT_WINDOW_END) {
            res.put("popup", null);
            res.put("suppressedReason", "OUTSIDE_TIME_WINDOW");
            return res;
        }

        Instant since = Instant.now().minus(DEFAULT_COOLDOWN_HOURS, ChronoUnit.HOURS);
        if (impressionLogRepository.existsByTenantIdAndExternalUserIdAndShownAtAfter(tenantId, externalUserId, since)) {
            res.put("popup", null);
            res.put("suppressedReason", "COOLDOWN_24H");
            return res;
        }

        Set<String> userSegments = resolveUserSegments(tenantId, externalUserId);
        List<PopupRuleEntity> rules = popupRuleRepository
                .findByTenantIdAndEnabledTrueAndStatusOrderByPriorityAsc(tenantId, STATUS_ACTIVE);

        for (PopupRuleEntity rule : rules) {
            int startH = rule.getWindowStartHour() != null ? rule.getWindowStartHour() : DEFAULT_WINDOW_START;
            int endH = rule.getWindowEndHour() != null ? rule.getWindowEndHour() : DEFAULT_WINDOW_END;
            if (hour < startH || hour >= endH) {
                continue;
            }
            if (!matchesSegment(rule.getSegmentCode(), userSegments)) {
                continue;
            }
            if (!matchesPopupCondition(rule, hasClaimableReward, expiringVoucherDays, endingMissionDays)) {
                continue;
            }

            impressionLogRepository.save(PopupImpressionLogEntity.builder()
                    .tenantId(tenantId)
                    .externalUserId(externalUserId)
                    .ruleCode(rule.getRuleCode())
                    .shownAt(Instant.now())
                    .build());

            res.put("popup", rule);
            res.put("suppressedReason", null);
            return res;
        }

        res.put("popup", null);
        res.put("suppressedReason", "NO_MATCHING_RULE");
        return res;
    }

    // ───────────────────────── CMS Admin CRUD (CN-06) ─────────────────────────

    @Transactional(readOnly = true)
    public List<ContentBannerEntity> listBanners(String tenantId) {
        return bannerRepository.findByTenantIdOrderByPlacementAscDisplayOrderAsc(tenantId);
    }

    @Transactional
    public ContentBannerEntity saveBanner(String tenantId, ContentBannerEntity req) {
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, "Banner title is required");
        }
        ContentBannerEntity entity = req.getId() != null
                ? bannerRepository.findById(req.getId())
                        .filter(b -> tenantId.equals(b.getTenantId()))
                        .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND))
                : ContentBannerEntity.builder().tenantId(tenantId).build();

        entity.setPlacement(req.getPlacement() != null && !req.getPlacement().isBlank()
                ? req.getPlacement().trim().toUpperCase() : "LOYALTY_HOME");
        entity.setTitle(req.getTitle().trim());
        entity.setSubtitle(req.getSubtitle());
        entity.setCtaLabel(req.getCtaLabel());
        entity.setImageUrl(req.getImageUrl());
        entity.setDeepLink(req.getDeepLink());
        entity.setSegmentCode(req.getSegmentCode() != null && !req.getSegmentCode().isBlank()
                ? req.getSegmentCode().trim().toUpperCase() : SEGMENT_ALL);
        entity.setI18nJson(req.getI18nJson());
        entity.setDisplayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : 1);
        entity.setStartDate(req.getStartDate());
        entity.setEndDate(req.getEndDate());
        entity.setStatus(req.getStatus() != null ? req.getStatus().trim().toUpperCase() : STATUS_ACTIVE);
        return bannerRepository.save(entity);
    }

    @Transactional
    public void deleteBanner(String tenantId, Long id) {
        ContentBannerEntity b = bannerRepository.findById(id)
                .filter(x -> tenantId.equals(x.getTenantId()))
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        bannerRepository.delete(b);
    }

    @Transactional(readOnly = true)
    public List<PopupRuleEntity> listPopupRules(String tenantId) {
        return popupRuleRepository.findByTenantIdOrderByPriorityAsc(tenantId);
    }

    @Transactional
    public PopupRuleEntity savePopupRule(String tenantId, PopupRuleEntity req) {
        if (req.getRuleCode() == null || req.getRuleCode().isBlank()) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, "ruleCode is required");
        }
        String code = req.getRuleCode().trim().toUpperCase();
        PopupRuleEntity entity = req.getId() != null
                ? popupRuleRepository.findById(req.getId())
                        .filter(r -> tenantId.equals(r.getTenantId()))
                        .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND))
                : popupRuleRepository.findByTenantIdAndRuleCode(tenantId, code)
                        .orElseGet(() -> PopupRuleEntity.builder().tenantId(tenantId).ruleCode(code).build());

        entity.setPopupType(req.getPopupType() != null && !req.getPopupType().isBlank()
                ? req.getPopupType().trim().toUpperCase() : POPUP_CAMPAIGN);
        entity.setPriority(req.getPriority() != null ? Math.max(1, req.getPriority()) : 1);
        entity.setThresholdDays(req.getThresholdDays());
        entity.setTitle(req.getTitle() != null ? req.getTitle().trim() : code);
        entity.setBody(req.getBody());
        entity.setCtaLabel(req.getCtaLabel());
        entity.setDeepLink(req.getDeepLink());
        entity.setSegmentCode(req.getSegmentCode() != null && !req.getSegmentCode().isBlank()
                ? req.getSegmentCode().trim().toUpperCase() : SEGMENT_ALL);
        entity.setWindowStartHour(req.getWindowStartHour() != null ? req.getWindowStartHour() : DEFAULT_WINDOW_START);
        entity.setWindowEndHour(req.getWindowEndHour() != null ? req.getWindowEndHour() : DEFAULT_WINDOW_END);
        entity.setCooldownHours(req.getCooldownHours() != null ? req.getCooldownHours() : DEFAULT_COOLDOWN_HOURS);
        entity.setEnabled(req.getEnabled() != null ? req.getEnabled() : Boolean.TRUE);
        entity.setStatus(req.getStatus() != null ? req.getStatus().trim().toUpperCase() : STATUS_ACTIVE);
        return popupRuleRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<TargetedOfferEntity> listTargetedOffers(String tenantId) {
        return offerRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional
    public TargetedOfferEntity saveTargetedOffer(String tenantId, TargetedOfferEntity req) {
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, "Offer title is required");
        }
        TargetedOfferEntity entity = req.getId() != null
                ? offerRepository.findById(req.getId())
                        .filter(o -> tenantId.equals(o.getTenantId()))
                        .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND))
                : TargetedOfferEntity.builder()
                        .tenantId(tenantId)
                        .offerCode(req.getOfferCode() != null && !req.getOfferCode().isBlank()
                                ? req.getOfferCode().trim().toUpperCase()
                                : "OFFER_" + System.currentTimeMillis())
                        .build();

        entity.setTitle(req.getTitle().trim());
        entity.setBody(req.getBody() != null ? req.getBody() : "");
        entity.setSegmentCode(req.getSegmentCode() != null && !req.getSegmentCode().isBlank()
                ? req.getSegmentCode().trim().toUpperCase() : SEGMENT_ALL);
        entity.setVoucherCode(req.getVoucherCode());
        entity.setChannels(req.getChannels() != null && !req.getChannels().isBlank()
                ? req.getChannels().trim().toUpperCase() : "INBOX,PUSH");
        entity.setDeepLink(req.getDeepLink() != null && !req.getDeepLink().isBlank()
                ? req.getDeepLink() : "/rewards");
        entity.setValidUntil(req.getValidUntil());
        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            entity.setStatus(req.getStatus().trim().toUpperCase());
        }
        return offerRepository.save(entity);
    }

    @Transactional
    public void deleteTargetedOffer(String tenantId, Long id) {
        TargetedOfferEntity offer = offerRepository.findById(id)
                .filter(o -> tenantId.equals(o.getTenantId()))
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        offerRepository.delete(offer);
    }

    /**
     * Dispatches a targeted offer into user_inbox_messages (+ PUSH comm log) for members in the target segment.
     */
    @Transactional
    public Map<String, Object> sendTargetedOffer(String tenantId, Long offerId, List<String> overrideUserIds) {
        TargetedOfferEntity offer = offerRepository.findById(offerId)
                .filter(o -> tenantId.equals(o.getTenantId()))
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));

        Set<String> recipients = new LinkedHashSet<>();
        if (overrideUserIds != null && !overrideUserIds.isEmpty()) {
            overrideUserIds.stream().filter(u -> u != null && !u.isBlank()).forEach(u -> recipients.add(u.trim()));
        } else {
            CustomerSegmentCode segEnum = parseSegmentCode(offer.getSegmentCode());
            if (segEnum != null) {
                List<CustomerSegmentMemberEntity> members = segmentMemberRepository
                        .findByTenantIdAndSegmentCodeOrderByScoreDesc(tenantId, segEnum);
                for (CustomerSegmentMemberEntity m : members) {
                    recipients.add(m.getExternalUserId());
                }
            }
        }

        boolean sendInbox = offer.getChannels() == null || offer.getChannels().toUpperCase().contains("INBOX");
        boolean sendPush = offer.getChannels() != null && offer.getChannels().toUpperCase().contains("PUSH");
        String targetDeepLink = (offer.getDeepLink() != null && !offer.getDeepLink().isBlank())
                ? offer.getDeepLink() : "/rewards";

        int delivered = 0;
        for (String userId : recipients) {
            if (sendInbox) {
                inboxRepository.save(UserInboxMessageEntity.builder()
                        .tenantId(tenantId)
                        .externalUserId(userId)
                        .category("PROMO")
                        .title(offer.getTitle())
                        .body(offer.getBody())
                        .deepLink(targetDeepLink)
                        .isRead(Boolean.FALSE)
                        .build());
            }
            if (sendPush) {
                commLogRepository.save(CommunicationLogEntity.builder()
                        .tenantId(tenantId)
                        .externalUserId(userId)
                        .triggerType(TriggerType.INACTIVE_REMINDER)
                        .channel("PUSH")
                        .title(offer.getTitle())
                        .content(offer.getBody())
                        .sentAt(Instant.now())
                        .isRead(Boolean.FALSE)
                        .build());
            }
            delivered++;
        }

        offer.setSentCount((offer.getSentCount() != null ? offer.getSentCount() : 0) + delivered);
        offer.setLastSentAt(Instant.now());
        offer.setStatus(STATUS_SENT);
        offerRepository.save(offer);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("offerId", offer.getId());
        result.put("offerCode", offer.getOfferCode());
        result.put("deliveredCount", delivered);
        result.put("totalSentCount", offer.getSentCount());
        result.put("status", offer.getStatus());
        return result;
    }

    private Set<String> resolveUserSegments(String tenantId, String externalUserId) {
        Set<String> segments = new LinkedHashSet<>();
        segments.add(SEGMENT_ALL);
        if (externalUserId != null && !externalUserId.isBlank()) {
            List<CustomerSegmentMemberEntity> rows = segmentMemberRepository
                    .findByTenantIdAndExternalUserId(tenantId, externalUserId);
            for (CustomerSegmentMemberEntity r : rows) {
                if (r.getSegmentCode() != null) {
                    segments.add(r.getSegmentCode().name());
                }
            }
        }
        return segments;
    }

    private boolean matchesSegment(String ruleSegment, Set<String> userSegments) {
        if (ruleSegment == null || ruleSegment.isBlank() || SEGMENT_ALL.equalsIgnoreCase(ruleSegment)) {
            return true;
        }
        return userSegments.contains(ruleSegment.trim().toUpperCase());
    }

    private boolean isWithinSchedule(Instant start, Instant end, Instant now) {
        if (start != null && now.isBefore(start)) {
            return false;
        }
        if (end != null && now.isAfter(end)) {
            return false;
        }
        return true;
    }

    private boolean matchesPopupCondition(PopupRuleEntity rule,
                                          boolean hasClaimableReward,
                                          Integer expiringVoucherDays,
                                          Integer endingMissionDays) {
        String type = rule.getPopupType() != null ? rule.getPopupType().toUpperCase() : POPUP_CAMPAIGN;
        return switch (type) {
            case POPUP_REWARD_READY -> hasClaimableReward;
            case POPUP_VOUCHER_EXPIRING -> {
                int maxDays = rule.getThresholdDays() != null ? rule.getThresholdDays() : 3;
                yield expiringVoucherDays != null && expiringVoucherDays >= 0 && expiringVoucherDays <= maxDays;
            }
            case POPUP_MISSION_ENDING -> {
                int maxDays = rule.getThresholdDays() != null ? rule.getThresholdDays() : 2;
                yield endingMissionDays != null && endingMissionDays >= 0 && endingMissionDays <= maxDays;
            }
            default -> true;
        };
    }

    private CustomerSegmentCode parseSegmentCode(String code) {
        if (code == null || code.isBlank() || SEGMENT_ALL.equalsIgnoreCase(code)) {
            return null;
        }
        try {
            return CustomerSegmentCode.valueOf(code.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
