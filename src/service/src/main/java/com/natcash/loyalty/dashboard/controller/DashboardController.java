package com.natcash.loyalty.dashboard.controller;

import com.natcash.loyalty.account.repository.LoyaltyAccountRepository;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.VoucherStatus;
import com.natcash.loyalty.ledger.repository.LoyaltyPointLedgerRepository;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;
import com.natcash.loyalty.wallet.repository.LoyaltyVoucherRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/loyalty/v1/dashboard")
@Tag(name = "Dashboard Statistics API", description = "Số Liệu Báo Cáo Thống Kê Tổng Quan")
public class DashboardController {

    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyVoucherRepository voucherRepository;
    private final LoyaltyPointLedgerRepository ledgerRepository;
    private final ClearingTransactionRepository clearingRepository;

    public DashboardController(LoyaltyAccountRepository accountRepository,
                               LoyaltyVoucherRepository voucherRepository,
                               LoyaltyPointLedgerRepository ledgerRepository,
                               ClearingTransactionRepository clearingRepository) {
        this.accountRepository = accountRepository;
        this.voucherRepository = voucherRepository;
        this.ledgerRepository = ledgerRepository;
        this.clearingRepository = clearingRepository;
    }

    @GetMapping("/stats")
    @Operation(summary = "Lấy số liệu thống kê thời gian thực từ cơ sở dữ liệu", description = "Tính toán trực tiếp từ các bảng loyalty_accounts, loyalty_point_ledger, loyalty_vouchers, clearing_transactions")
    public ResponseEntity<DashboardStatsResponse> getStats(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();

        long totalMembers = accountRepository.countByTenantId(tenantId);
        long activeMembers = accountRepository.countByTenantIdAndStatus(tenantId, CommonStatus.ACTIVE);
        long activeVouchers = voucherRepository.countByTenantIdAndStatus(tenantId, VoucherStatus.ACTIVE);
        long totalLedgerTransactions = ledgerRepository.countByTenantId(tenantId);

        BigDecimal totalEarnedPoints = ledgerRepository.sumEarnedPoints(tenantId);
        BigDecimal totalBurnedPoints = ledgerRepository.sumBurnedPoints(tenantId);
        BigDecimal clearingSettledAmount = clearingRepository.sumClearingAmount(tenantId);

        DashboardStatsResponse response = DashboardStatsResponse.builder()
                .totalMembers(totalMembers)
                .activeMembers(activeMembers)
                .totalEarnedPoints(totalEarnedPoints)
                .totalBurnedPoints(totalBurnedPoints)
                .activeVouchers(activeVouchers)
                .totalTransactions(totalLedgerTransactions)
                .clearingSettledAmount(clearingSettledAmount)
                .uptimePercent(new BigDecimal("100.00"))
                .build();

        return ResponseEntity.ok(response);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardStatsResponse {
        private Long totalMembers;
        private Long activeMembers;
        private BigDecimal totalEarnedPoints;
        private BigDecimal totalBurnedPoints;
        private Long activeVouchers;
        private Long totalTransactions;
        private BigDecimal clearingSettledAmount;
        private BigDecimal uptimePercent;
    }
}
