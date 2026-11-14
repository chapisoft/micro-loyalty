-- ==============================================================================
-- FLYWAY MIGRATION V3: Bổ sung bảng đối soát thanh toán bù trừ tài chính
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clearing_transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    transaction_code VARCHAR(100) NOT NULL UNIQUE,
    issuer_partner_id BIGINT NOT NULL,
    redeemer_partner_id BIGINT NOT NULL,
    external_user_id VARCHAR(100) NOT NULL,
    points_redeemed DECIMAL(18,2) NOT NULL,
    fiat_amount DECIMAL(18,2) NOT NULL,
    exchange_rate DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clearing_tenant_status ON clearing_transactions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_clearing_issuer ON clearing_transactions(issuer_partner_id);
CREATE INDEX IF NOT EXISTS idx_clearing_redeemer ON clearing_transactions(redeemer_partner_id);
CREATE INDEX IF NOT EXISTS idx_clearing_created_at ON clearing_transactions(created_at);
