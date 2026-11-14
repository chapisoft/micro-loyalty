package com.natcash.loyalty.codegeneration.service;

import com.natcash.loyalty.codegeneration.port.SequenceBatchPort;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Bộ cấp phát số thứ tự Hi-Lo trong bộ nhớ RAM theo chuẩn DIP.
 * Mỗi lần gọi PostgreSQL nextval chỉ thực hiện 1 lần cho cả lô batchSize (mặc định 50 mã),
 * các mã tiếp theo được cấp phát hoàn toàn trong RAM mà không cần truy vấn DB.
 */
@Slf4j
@Component
public class PostgresSequenceAllocator {

    private static final int MAX_HI_LO_BATCH_SIZE = 50;

    private final SequenceBatchPort sequenceBatchPort;
    private final ConcurrentHashMap<String, SequenceBuffer> buffers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicLong> fallbackCounters = new ConcurrentHashMap<>();

    @Autowired
    public PostgresSequenceAllocator(@Autowired(required = false) SequenceBatchPort sequenceBatchPort) {
        this.sequenceBatchPort = sequenceBatchPort;
    }

    public long nextSequence(String seqName, int batchSize) {
        if (sequenceBatchPort == null) {
            return fallbackCounters.computeIfAbsent(seqName, k -> new AtomicLong(0)).incrementAndGet();
        }
        int effectiveBatch = Math.max(1, Math.min(batchSize, MAX_HI_LO_BATCH_SIZE));
        SequenceBuffer buffer = buffers.computeIfAbsent(seqName, k -> new SequenceBuffer());
        try {
            return buffer.nextValue(sequenceBatchPort, seqName, effectiveBatch);
        } catch (Exception ex) {
            log.warn("[SEQ-ALLOCATOR-FALLBACK] Unable to allocate Postgres sequence '{}', using in-memory counter: {}",
                    seqName, ex.getMessage());
            return fallbackCounters.computeIfAbsent(seqName, k -> new AtomicLong(0)).incrementAndGet();
        }
    }

    private static final class SequenceBuffer {
        private long nextVal = 0L;
        private long maxVal = -1L;

        synchronized long nextValue(SequenceBatchPort port, String seqName, int batchSize) {
            if (nextVal > maxVal) {
                long base = port.allocateNextBatch(seqName);
                this.nextVal = base;
                this.maxVal = base + batchSize - 1L;
            }
            return nextVal++;
        }
    }
}
