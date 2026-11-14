package com.natcash.loyalty.codegeneration.port;

/**
 * Cổng cấp phát khối số thứ tự (Sequence Block) từ PostgreSQL Sequence.
 */
public interface SequenceBatchPort {

    /**
     * Lấy giá trị nextval tiếp theo từ PostgreSQL Sequence (tăng theo bước INCREMENT BY 50).
     */
    long allocateNextBatch(String seqName);
}
