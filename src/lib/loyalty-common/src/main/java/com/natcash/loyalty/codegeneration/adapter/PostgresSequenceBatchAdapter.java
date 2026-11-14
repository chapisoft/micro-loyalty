package com.natcash.loyalty.codegeneration.adapter;

import com.natcash.loyalty.codegeneration.port.SequenceBatchPort;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.util.MessageUtils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Adapter truy vấn PostgreSQL Sequence (SELECT nextval(...)) phục vụ cấp phát khối Hi-Lo.
 */
@Slf4j
@Component
public class PostgresSequenceBatchAdapter implements SequenceBatchPort {

    private static final Pattern SAFE_SEQ_NAME_PATTERN = Pattern.compile("^seq_code_[a-z0-9_]+$");

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public PostgresSequenceBatchAdapter(@Autowired(required = false) JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public long allocateNextBatch(String seqName) {
        if (seqName == null || !SAFE_SEQ_NAME_PATTERN.matcher(seqName.trim()).matches()) {
            throw new LoyaltyException(
                    ErrorCode.VALIDATION_ERROR,
                    MessageUtils.getMessage("admin.codetype.invalid_sequence", seqName));
        }
        if (jdbcTemplate == null) {
            throw new LoyaltyException(
                    ErrorCode.SYSTEM_ERROR,
                    MessageUtils.getMessage("error.system_error"));
        }
        String sanitized = seqName.trim();
        Long nextVal = jdbcTemplate.queryForObject("SELECT nextval('" + sanitized + "')", Long.class);
        if (nextVal == null) {
            throw new LoyaltyException(
                    ErrorCode.SYSTEM_ERROR,
                    MessageUtils.getMessage("error.system_error"));
        }
        log.debug("[SEQ-BATCH-ALLOCATED] seqName={}, baseValue={}", sanitized, nextVal);
        return nextVal;
    }
}
