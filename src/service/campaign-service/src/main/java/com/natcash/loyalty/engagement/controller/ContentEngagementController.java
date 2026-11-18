package com.natcash.loyalty.engagement.controller;

import com.natcash.loyalty.engagement.entity.ContentBannerEntity;
import com.natcash.loyalty.engagement.entity.PopupRuleEntity;
import com.natcash.loyalty.engagement.entity.TargetedOfferEntity;
import com.natcash.loyalty.engagement.service.ContentEngagementService;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/loyalty/v1/engagement")
@RequiredArgsConstructor
@Tag(name = "Content Banners, Startup Popups & Targeted Offers (CN-06)", description = "Banner theo vị trí, Popup nhắc khi mở app (08:00-20:00, 24h cooldown) và Ưu đãi gửi riêng")
public class ContentEngagementController {

    private final ContentEngagementService contentService;

    @GetMapping("/me/home")
    @Operation(summary = "Trả danh sách Banner theo vị trí và phân khúc của khách hàng")
    public ResponseEntity<Map<String, Object>> getMyHome(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "externalUserId", required = false) String externalUserId,
            @RequestParam(value = "placement", required = false) String placement) {
        return ResponseEntity.ok(contentService.getHomeContent(
                resolveTenantId(headerTenantId), externalUserId, placement));
    }

    @GetMapping("/me/popup")
    @Operation(summary = "Trả tối đa 1 Popup ưu tiên khi mở app (08:00-20:00, nhớ 24h)")
    public ResponseEntity<Map<String, Object>> getMyPopup(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "externalUserId") String externalUserId,
            @RequestParam(value = "hasClaimableReward", defaultValue = "false") boolean hasClaimableReward,
            @RequestParam(value = "expiringVoucherDays", required = false) Integer expiringVoucherDays,
            @RequestParam(value = "endingMissionDays", required = false) Integer endingMissionDays,
            @RequestParam(value = "localHour", required = false) Integer localHour) {
        return ResponseEntity.ok(contentService.resolveStartupPopup(
                resolveTenantId(headerTenantId), externalUserId,
                hasClaimableReward, expiringVoucherDays, endingMissionDays, localHour));
    }

    @GetMapping("/admin/banners")
    @Operation(summary = "Admin CMS (CN-06) - Danh sách Banner")
    public ResponseEntity<List<ContentBannerEntity>> listBanners(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        return ResponseEntity.ok(contentService.listBanners(resolveTenantId(headerTenantId)));
    }

    @PostMapping("/admin/banners")
    @Operation(summary = "Admin CMS (CN-06) - Tạo hoặc cập nhật Banner")
    public ResponseEntity<ContentBannerEntity> saveBanner(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody ContentBannerEntity banner) {
        return ResponseEntity.ok(contentService.saveBanner(resolveTenantId(headerTenantId), banner));
    }

    @DeleteMapping("/admin/banners/{id}")
    @Operation(summary = "Admin CMS (CN-06) - Xóa Banner")
    public ResponseEntity<Void> deleteBanner(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id) {
        contentService.deleteBanner(resolveTenantId(headerTenantId), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/popup-rules")
    @Operation(summary = "Admin CMS (CN-06) - Danh sách luật Popup mở app")
    public ResponseEntity<List<PopupRuleEntity>> listPopupRules(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        return ResponseEntity.ok(contentService.listPopupRules(resolveTenantId(headerTenantId)));
    }

    @PostMapping("/admin/popup-rules")
    @Operation(summary = "Admin CMS (CN-06) - Tạo hoặc cập nhật luật Popup mở app")
    public ResponseEntity<PopupRuleEntity> savePopupRule(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody PopupRuleEntity rule) {
        return ResponseEntity.ok(contentService.savePopupRule(resolveTenantId(headerTenantId), rule));
    }

    @GetMapping("/admin/targeted-offers")
    @Operation(summary = "Admin CMS (CN-06) - Danh sách Ưu đãi gửi riêng")
    public ResponseEntity<List<TargetedOfferEntity>> listTargetedOffers(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        return ResponseEntity.ok(contentService.listTargetedOffers(resolveTenantId(headerTenantId)));
    }

    @PostMapping("/admin/targeted-offers")
    @Operation(summary = "Admin CMS (CN-06) - Tạo hoặc cập nhật Ưu đãi gửi riêng")
    public ResponseEntity<TargetedOfferEntity> saveTargetedOffer(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody TargetedOfferEntity offer) {
        return ResponseEntity.ok(contentService.saveTargetedOffer(resolveTenantId(headerTenantId), offer));
    }

    @DeleteMapping("/admin/targeted-offers/{id}")
    @Operation(summary = "Admin CMS (CN-06) - Xóa Ưu đãi gửi riêng")
    public ResponseEntity<Void> deleteTargetedOffer(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id) {
        contentService.deleteTargetedOffer(resolveTenantId(headerTenantId), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/admin/targeted-offers/{id}/send")
    @Operation(summary = "Admin CMS (CN-06) - Gửi ưu đãi vào Inbox + Push cho nhóm khách hàng")
    public ResponseEntity<Map<String, Object>> sendTargetedOffer(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, List<String>> body) {
        List<String> overrideUsers = body != null ? body.get("userIds") : null;
        return ResponseEntity.ok(contentService.sendTargetedOffer(resolveTenantId(headerTenantId), id, overrideUsers));
    }

    private String resolveTenantId(String headerTenantId) {
        if (headerTenantId != null && !headerTenantId.isBlank()) {
            return headerTenantId;
        }
        String ctx = TenantContext.getTenantId();
        return (ctx != null && !ctx.isBlank()) ? ctx : "TENANT_NATCASH";
    }
}
