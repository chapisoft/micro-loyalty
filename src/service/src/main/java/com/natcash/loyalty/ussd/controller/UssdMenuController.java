package com.natcash.loyalty.ussd.controller;

import com.natcash.loyalty.account.entity.LoyaltyAccountEntity;
import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.TierLevel;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/loyalty/v1/ussd")
@RequiredArgsConstructor
@Tag(name = "USSD Menu API", description = "Kênh tra cứu & đổi điểm USSD *202# tối đa 160 ký tự ASCII")
public class UssdMenuController {

    private final LoyaltyAccountRepository accountRepository;

    @GetMapping("/menu")
    @Operation(summary = "Trả thực đơn USSD *202# cho thuê bao")
    public ResponseEntity<Map<String, Object>> getUssdMenu(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam("msisdn") String msisdn,
            @RequestParam(value = "lang", required = false, defaultValue = "ht") String lang) {
        String tenantId = headerTenantId != null && !headerTenantId.isBlank()
                ? headerTenantId.trim()
                : TenantContext.getTenantId();

        LoyaltyAccountEntity account = accountRepository.findByTenantIdAndExternalUserId(tenantId, msisdn)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.ACCOUNT_NOT_FOUND));

        BigDecimal points = account.getCurrentPoints() != null ? account.getCurrentPoints() : BigDecimal.ZERO;
        TierLevel tier = account.getTier() != null ? account.getTier().getCode() : TierLevel.SILVER;

        String menuText;
        if ("fr".equalsIgnoreCase(lang)) {
            menuText = String.format("Natcash Coin: %s pts (%s)\n1.Echanger\n2.Partenaires\n3.Aide",
                    points.stripTrailingZeros().toPlainString(), tier.name());
        } else if ("en".equalsIgnoreCase(lang)) {
            menuText = String.format("Natcash Coin: %s pts (%s)\n1.Redeem\n2.Partners\n3.Help",
                    points.stripTrailingZeros().toPlainString(), tier.name());
        } else {
            menuText = String.format("Natcash Coin: %s pwen (%s)\n1.Chanje\n2.Patne\n3.Ed",
                    points.stripTrailingZeros().toPlainString(), tier.name());
        }

        if (menuText.length() > 160) {
            menuText = menuText.substring(0, 160);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("msisdn", msisdn);
        response.put("lang", lang);
        response.put("menuText", menuText);
        response.put("length", menuText.length());
        response.put("currentPoints", points);
        response.put("tier", tier);
        return ResponseEntity.ok(response);
    }
}
