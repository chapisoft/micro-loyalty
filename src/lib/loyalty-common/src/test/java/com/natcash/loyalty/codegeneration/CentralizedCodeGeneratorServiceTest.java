package com.natcash.loyalty.codegeneration;

import com.natcash.loyalty.codegeneration.domain.CodeType;
import com.natcash.loyalty.codegeneration.entity.SysCodeTypeEntity;
import com.natcash.loyalty.codegeneration.port.SequenceBatchPort;
import com.natcash.loyalty.codegeneration.repository.SysCodeTypeRepository;
import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService;
import com.natcash.loyalty.codegeneration.service.CentralizedCodeGeneratorService.SysCodeTypeDto;
import com.natcash.loyalty.codegeneration.service.PostgresSequenceAllocator;
import com.natcash.loyalty.domain.enums.CommonStatus;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CentralizedCodeGeneratorServiceTest {

    @Mock
    private SysCodeTypeRepository sysCodeTypeRepository;

    @Mock
    private SequenceBatchPort sequenceBatchPort;

    private PostgresSequenceAllocator sequenceAllocator;
    private CentralizedCodeGeneratorService codeGeneratorService;

    @BeforeEach
    void setUp() {
        sequenceAllocator = new PostgresSequenceAllocator(sequenceBatchPort);
        codeGeneratorService = new CentralizedCodeGeneratorService(sysCodeTypeRepository, sequenceAllocator);
    }

    @Test
    void shouldAllocate50SequencesInRamPerSingleDatabaseNextvalCall() {
        when(sequenceBatchPort.allocateNextBatch("seq_code_settlement")).thenReturn(1L, 51L);

        for (long expected = 1L; expected <= 50L; expected++) {
            assertEquals(expected, sequenceAllocator.nextSequence("seq_code_settlement", 50));
        }
        verify(sequenceBatchPort, times(1)).allocateNextBatch("seq_code_settlement");

        assertEquals(51L, sequenceAllocator.nextSequence("seq_code_settlement", 50));
        verify(sequenceBatchPort, times(2)).allocateNextBatch("seq_code_settlement");
    }

    @Test
    void shouldCacheCodeTypeConfigAndRenderPeriodAndDateTemplate() {
        String todayUtc = DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneOffset.UTC).format(Instant.now());
        when(sysCodeTypeRepository.findByCodeTypeIgnoreCase(CodeType.SETTLEMENT_BATCH.name()))
                .thenReturn(Optional.of(SysCodeTypeEntity.builder()
                        .id(1L)
                        .codeType(CodeType.SETTLEMENT_BATCH.name())
                        .staticPrefix("SETTLE")
                        .formatTemplate("{prefix}_{period}_{date}_{seq:6}")
                        .dateFormat("yyyyMMdd")
                        .seqPadding(6)
                        .seqName("seq_code_settlement")
                        .batchAllocationSize(50)
                        .status(CommonStatus.ACTIVE)
                        .build()));
        when(sequenceBatchPort.allocateNextBatch("seq_code_settlement")).thenReturn(1L);

        String code1 = codeGeneratorService.generateCode(CodeType.SETTLEMENT_BATCH, Map.of("period", "2026-11"));
        String code2 = codeGeneratorService.generateCode(CodeType.SETTLEMENT_BATCH, Map.of("period", "2026-11"));

        assertEquals("SETTLE_202611_" + todayUtc + "_000001", code1);
        assertEquals("SETTLE_202611_" + todayUtc + "_000002", code2);
        verify(sysCodeTypeRepository, times(1)).findByCodeTypeIgnoreCase(CodeType.SETTLEMENT_BATCH.name());
        verify(sequenceBatchPort, times(1)).allocateNextBatch("seq_code_settlement");
    }

    @Test
    void shouldRenderScopeAndKindTemplatesCorrectly() {
        when(sysCodeTypeRepository.findByCodeTypeIgnoreCase(CodeType.VOUCHER_REDEMPTION_CODE.name()))
                .thenReturn(Optional.empty());
        when(sysCodeTypeRepository.findByCodeTypeIgnoreCase(CodeType.GAME_TX.name()))
                .thenReturn(Optional.empty());
        when(sequenceBatchPort.allocateNextBatch("seq_code_voucher")).thenReturn(1L);
        when(sequenceBatchPort.allocateNextBatch("seq_code_game_tx")).thenReturn(1L);

        String voucherCode = codeGeneratorService.generateCode(
                CodeType.VOUCHER_REDEMPTION_CODE, Map.of("scope", "DELI50"));
        String gameTxCode = codeGeneratorService.generateCode(
                CodeType.GAME_TX, Map.of("kind", "reward"));

        assertTrue(voucherCode.startsWith("DELI50-"));
        assertTrue(voucherCode.endsWith("-000001"));
        assertTrue(gameTxCode.startsWith("GTRX_REWARD_"));
        assertTrue(gameTxCode.endsWith("_000001"));
    }

    @Test
    void shouldPreviewCodeWithoutConsumingSequenceValues() {
        when(sysCodeTypeRepository.findByCodeTypeIgnoreCase(CodeType.PAYMENT_HOLD.name()))
                .thenReturn(Optional.empty());

        String preview = codeGeneratorService.previewCode(
                CodeType.PAYMENT_HOLD.name(),
                SysCodeTypeDto.builder()
                        .staticPrefix("HLDX")
                        .formatTemplate("{prefix}-{scope}-{seq:4}")
                        .build(),
                Map.of("scope", "POS01"));

        assertEquals("HLDX-POS01-0001", preview);
        verifyNoInteractions(sequenceBatchPort);
    }

    @Test
    void shouldUpdateConfigCacheImmediatelyWhenCmsUpdatesCodeType() {
        String todayUtc = DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneOffset.UTC).format(Instant.now());
        SysCodeTypeEntity existing = SysCodeTypeEntity.builder()
                .id(4L)
                .codeType(CodeType.CLEARING_DISPUTE.name())
                .staticPrefix("DISPUTE")
                .formatTemplate("{prefix}_{date}_{seq:6}")
                .dateFormat("yyyyMMdd")
                .seqPadding(6)
                .seqName("seq_code_dispute")
                .batchAllocationSize(50)
                .status(CommonStatus.ACTIVE)
                .build();

        when(sysCodeTypeRepository.findByCodeTypeIgnoreCase(CodeType.CLEARING_DISPUTE.name()))
                .thenReturn(Optional.of(existing));
        when(sysCodeTypeRepository.save(any(SysCodeTypeEntity.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        lenient().when(sequenceBatchPort.allocateNextBatch("seq_code_dispute")).thenReturn(1L);

        codeGeneratorService.updateCodeType(
                CodeType.CLEARING_DISPUTE.name(),
                SysCodeTypeDto.builder()
                        .staticPrefix("DSP")
                        .formatTemplate("{prefix}-{date}-{seq:5}")
                        .status(1)
                        .build());

        String generated = codeGeneratorService.generateCode(CodeType.CLEARING_DISPUTE);
        assertEquals("DSP-" + todayUtc + "-00001", generated);
        verify(sysCodeTypeRepository, times(1)).findByCodeTypeIgnoreCase(CodeType.CLEARING_DISPUTE.name());
    }
}
