-- ==============================================================================
-- FLYWAY MIGRATION V14: BỔ SUNG BẢNG TẠM GIỮ ĐIỂM THANH TOÁN, NÂNG CẤP ĐỐI SOÁT & QUẢN LÝ TRANH CHẤP
-- Hệ Sinh Thái Loyalty & GameHub (micro-loyalty)
-- ==============================================================================

-- 1. BẢNG TẠM GIỮ ĐIỂM THANH TOÁN (LOYALTY_PAYMENT_HOLDS) - Luồng 2 bước Authorize & Capture
CREATE TABLE IF NOT EXISTS loyalty_payment_holds (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    hold_code VARCHAR(100) NOT NULL UNIQUE,
    partner_id BIGINT NOT NULL REFERENCES loyalty_partners(id),
    external_user_id VARCHAR(100) NOT NULL,
    partner_order_id VARCHAR(100),
    bill_amount NUMERIC(18, 2) NOT NULL,
    points_held NUMERIC(18, 2) NOT NULL,
    point_discount_amount NUMERIC(18, 2) NOT NULL,
    voucher_code VARCHAR(100),
    voucher_discount_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'HELD', -- HELD, CAPTURED, CANCELLED, EXPIRED
    expires_at TIMESTAMPTZ NOT NULL,
    captured_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_holds_tenant_code ON loyalty_payment_holds(tenant_id, hold_code);
CREATE INDEX IF NOT EXISTS idx_payment_holds_user ON loyalty_payment_holds(tenant_id, external_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_holds_partner ON loyalty_payment_holds(partner_id);
CREATE INDEX IF NOT EXISTS idx_payment_holds_status_expires ON loyalty_payment_holds(status, expires_at);

-- 2. MỞ RỘNG BẢNG CHÍNH SÁCH ĐỐI TÁC (LOYALTY_ACCEPTANCE_POLICIES)
ALTER TABLE loyalty_acceptance_policies
    ADD COLUMN IF NOT EXISTS commission_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS fixed_fee_per_tx NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS max_burn_points_per_tx NUMERIC(18, 2) NOT NULL DEFAULT 5000.00,
    ADD COLUMN IF NOT EXISTS settlement_credit_limit NUMERIC(18, 2) NOT NULL DEFAULT 500000.00,
    ADD COLUMN IF NOT EXISTS settlement_cycle VARCHAR(20) NOT NULL DEFAULT 'DAILY';

-- 3. MỞ RỘNG BẢNG GIAO DỊCH BÙ TRỪ TÀI CHÍNH (CLEARING_TRANSACTIONS)
ALTER TABLE clearing_transactions
    ADD COLUMN IF NOT EXISTS partner_order_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS hold_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS net_payout_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS reconciliation_batch_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS reconciliation_status VARCHAR(30) NOT NULL DEFAULT 'UNMATCHED', -- UNMATCHED, MATCHED, DISPUTED, SETTLED
    ADD COLUMN IF NOT EXISTS dispute_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_clearing_batch_code ON clearing_transactions(reconciliation_batch_code);
CREATE INDEX IF NOT EXISTS idx_clearing_recon_status ON clearing_transactions(tenant_id, reconciliation_status);

-- 4. BẢNG QUẢN LÝ TRANH CHẤP & SAI LỆCH ĐỐI SOÁT (LOYALTY_CLEARING_DISPUTES)
CREATE TABLE IF NOT EXISTS loyalty_clearing_disputes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    dispute_code VARCHAR(100) NOT NULL UNIQUE,
    batch_code VARCHAR(100) NOT NULL,
    clearing_tx_id BIGINT REFERENCES clearing_transactions(id),
    partner_id BIGINT NOT NULL REFERENCES loyalty_partners(id),
    dispute_type VARCHAR(50) NOT NULL, -- MISSING_TX, AMOUNT_MISMATCH, DUPLICATE_TX
    partner_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    loyalty_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    resolved_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- OPEN, IN_REVIEW, RESOLVED, REJECTED
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_disputes_tenant_batch ON loyalty_clearing_disputes(tenant_id, batch_code);
CREATE INDEX IF NOT EXISTS idx_disputes_partner ON loyalty_clearing_disputes(partner_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON loyalty_clearing_disputes(status);
