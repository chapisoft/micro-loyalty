-- ==============================================================================
-- FLYWAY MIGRATION V42: POOLED CLEARING BREAKDOWNS, MULTI-VOUCHER HOLDS & SPONSORSHIP SPLIT
-- Cơ sở dữ liệu: PostgreSQL 15+ (loyalty_db)
-- ==============================================================================

-- 1. CẤU HÌNH NGUỒN TÀI TRỢ & TỶ LỆ ĐỒNG TÀI TRỢ TRÊN VOUCHER
ALTER TABLE loyalty_vouchers
    ADD COLUMN IF NOT EXISTS sponsor_type VARCHAR(30) NOT NULL DEFAULT 'NATCASH',
    ADD COLUMN IF NOT EXISTS natcash_share_percent NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS partner_share_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00;

UPDATE loyalty_vouchers
SET sponsor_type = 'PARTNER',
    natcash_share_percent = 0.00,
    partner_share_percent = 100.00
WHERE partner_id IS NOT NULL
  AND sponsor_type = 'NATCASH'
  AND natcash_share_percent = 100.00
  AND partner_share_percent = 0.00;

-- 2. GẮN ĐƠN VỊ TÀI TRỢ TRỰC TIẾP TRÊN TỪNG LÔ COIN FIFO
ALTER TABLE point_expiration_buckets
    ADD COLUMN IF NOT EXISTS funding_partner_id BIGINT REFERENCES loyalty_partners(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS sponsor_type VARCHAR(30) NOT NULL DEFAULT 'NATCASH';

CREATE INDEX IF NOT EXISTS idx_point_buckets_sponsor
    ON point_expiration_buckets(tenant_id, funding_partner_id, sponsor_type);

-- 3. MỞ RỘNG PHIÊN TẠM GIỮ HỖ TRỢ NHIỀU MÃ VOUCHER & CHI NHÁNH
ALTER TABLE loyalty_payment_holds
    ADD COLUMN IF NOT EXISTS voucher_codes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS branch_code VARCHAR(80);

-- 4. MỞ RỘNG BẢNG GIAO DỊCH BÙ TRỪ CHO MÔ HÌNH VÍ CHUNG W_LOYALTY_POOL & ĐỐI SOÁT 3 BÊN
ALTER TABLE clearing_transactions
    ADD COLUMN IF NOT EXISTS bill_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS wallet_paid_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS point_discount_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS voucher_discount_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS branch_code VARCHAR(80),
    ADD COLUMN IF NOT EXISTS core_tx_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS core_pool_deducted_amount NUMERIC(18, 2),
    ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMPTZ;

UPDATE clearing_transactions
SET point_discount_amount = fiat_amount
WHERE point_discount_amount = 0.00
  AND voucher_discount_amount = 0.00
  AND fiat_amount > 0.00;

CREATE INDEX IF NOT EXISTS idx_clearing_tx_recon_status
    ON clearing_transactions(tenant_id, reconciliation_status, status);
CREATE INDEX IF NOT EXISTS idx_clearing_tx_core_tx
    ON clearing_transactions(tenant_id, core_tx_id);

-- 5. BẢNG BÓC TÁCH CHI TIẾT NGUỒN TÀI TRỢ TRÊN TỪNG GIAO DỊCH (VOUCHER + COIN FIFO)
CREATE TABLE IF NOT EXISTS clearing_transaction_breakdowns (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    clearing_tx_id BIGINT NOT NULL REFERENCES clearing_transactions(id) ON DELETE CASCADE,
    transaction_code VARCHAR(100) NOT NULL,
    hold_code VARCHAR(100),
    source_type VARCHAR(30) NOT NULL, -- VOUCHER | LOYALTY_COIN
    source_ref VARCHAR(120),
    bucket_id BIGINT REFERENCES point_expiration_buckets(id) ON DELETE SET NULL,
    redemption_id BIGINT,
    sponsor_type VARCHAR(30) NOT NULL DEFAULT 'NATCASH', -- NATCASH | PARTNER | CO_FUNDED
    funding_partner_id BIGINT REFERENCES loyalty_partners(id) ON DELETE SET NULL,
    share_ratio NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    points_consumed NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    exchange_rate NUMERIC(10, 4) NOT NULL DEFAULT 1.0000,
    payable_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    reverted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clearing_bd_tx_id
    ON clearing_transaction_breakdowns(tenant_id, clearing_tx_id);
CREATE INDEX IF NOT EXISTS idx_clearing_bd_tx_code
    ON clearing_transaction_breakdowns(tenant_id, transaction_code);
CREATE INDEX IF NOT EXISTS idx_clearing_bd_hold_code
    ON clearing_transaction_breakdowns(tenant_id, hold_code);
CREATE INDEX IF NOT EXISTS idx_clearing_bd_sponsor
    ON clearing_transaction_breakdowns(tenant_id, funding_partner_id, sponsor_type, reverted);

-- 6. MỞ RỘNG BẢNG LÔ THANH TOÁN BÙ TRỪ HỖ TRỢ CHIỀU BƠM BÙ 035404 & DUYỆT MAKER-CHECKER
ALTER TABLE clearing_payment_batches
    ADD COLUMN IF NOT EXISTS batch_direction VARCHAR(30) NOT NULL DEFAULT 'MERCHANT_SETTLEMENT',
    ADD COLUMN IF NOT EXISTS sponsor_payable_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS core_settlement_tx_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS approval_request_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_payment_batches_direction
    ON clearing_payment_batches(tenant_id, batch_direction, status);
