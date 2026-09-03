package com.natcash.loyalty.clearing;

import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.ReconciliationReportResponse;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodRequest;
import com.natcash.loyalty.clearing.dto.ClearingDto.SettlePeriodResponse;
import com.natcash.loyalty.clearing.service.ClearingSettlementService;
import com.natcash.loyalty.domain.enums.ClearingStatus;
import com.natcash.loyalty.wallet.entity.ClearingTransactionEntity;
import com.natcash.loyalty.wallet.repository.ClearingTransactionRepository;

import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.clearing.repository.LoyaltyClearinghouseSettlementRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClearingSettlementServiceTest {

    @Mock
    private ClearingTransactionRepository clearingRepository;

    @Mock
    private LoyaltyPartnerRepository partnerRepository;

    @Mock
    private LoyaltyClearinghouseSettlementRepository settlementRepository;

    @InjectMocks
    private ClearingSettlementService clearingService;

    @Test
    @DisplayName("BE-16.1: Tổng hợp báo cáo đối soát bù trừ tài chính theo kỳ thành công")
    void testGetReconciliationReportSuccess() {
        Instant from = Instant.now().minusSeconds(86400 * 7);
        Instant to = Instant.now();

        ClearingTransactionEntity tx1 = ClearingTransactionEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .transactionCode("TXN_001")
                .issuerPartnerId(100L)
                .redeemerPartnerId(200L)
                .pointsRedeemed(new BigDecimal("100.00"))
                .fiatAmount(new BigDecimal("100.00"))
                .status(ClearingStatus.PENDING)
                .createdAt(from.plusSeconds(3600))
                .build();

        when(clearingRepository.findByTenantIdAndCreatedAtBetween(eq("TENANT_DELIMART"), eq(from), eq(to)))
                .thenReturn(List.of(tx1));

        ReconciliationReportRequest request = ReconciliationReportRequest.builder()
                .fromDate(from)
                .toDate(to)
                .build();

        ReconciliationReportResponse response = clearingService.getReconciliationReport("TENANT_DELIMART", request);

        assertNotNull(response);
        assertEquals(1, response.getGrandTotalTransactions());
        assertEquals(new BigDecimal("100.00"), response.getGrandTotalPointsRedeemed());
        assertEquals(new BigDecimal("100.00"), response.getGrandTotalFiatAmount());
        assertEquals(2, response.getPartnerSummaries().size());
    }

    @Test
    @DisplayName("BE-16.2: Quyết toán kết chuyển kỳ bù trừ và chuyển trạng thái SETTLED")
    void testSettlePeriodSuccess() {
        Instant from = Instant.now().minusSeconds(86400 * 7);
        Instant to = Instant.now();

        ClearingTransactionEntity tx1 = ClearingTransactionEntity.builder()
                .id(1L)
                .tenantId("TENANT_DELIMART")
                .transactionCode("TXN_001")
                .issuerPartnerId(100L)
                .redeemerPartnerId(200L)
                .fiatAmount(new BigDecimal("500.00"))
                .status(ClearingStatus.PENDING)
                .createdAt(from.plusSeconds(3600))
                .build();

        when(clearingRepository.findByTenantIdAndCreatedAtBetween(eq("TENANT_DELIMART"), eq(from), eq(to)))
                .thenReturn(List.of(tx1));

        SettlePeriodRequest request = SettlePeriodRequest.builder()
                .fromDate(from)
                .toDate(to)
                .remarks("Quyết toán bù trừ tuần 33/2026")
                .build();

        SettlePeriodResponse response = clearingService.settlePeriod("TENANT_DELIMART", request);

        assertNotNull(response);
        assertTrue(response.getSettlementBatchCode().startsWith("SETTLE_"));
        assertEquals(1, response.getSettledTransactionCount());
        assertEquals(new BigDecimal("500.00"), response.getTotalSettledAmount());
        assertEquals(ClearingStatus.SETTLED, response.getStatus());
        assertEquals(ClearingStatus.SETTLED, tx1.getStatus());

        verify(clearingRepository, times(1)).saveAll(any());
    }
}
