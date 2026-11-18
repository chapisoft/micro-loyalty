-- =====================================================================================
-- V34: Voucher "How to get" / "How to use" (CMS VQ-04, Figma 18/11)
--  acquire_type : COINS (Get voucher) | FREE_COLLECT (Collect, no coins) | GIVEN (mission, game, campaign only)
--  usage_type   : NATCASH_STORE (Pay at counter, cashier scans) | PARTNER_CODE (show QR/barcode) | ONLINE (service checkout)
--  Free vouchers come in batches: batch_quantity per batch_period, reserved when collected.
-- Dialect: PostgreSQL 15+
-- =====================================================================================

ALTER TABLE loyalty_vouchers
    ADD COLUMN IF NOT EXISTS acquire_type             VARCHAR(20)  NOT NULL DEFAULT 'COINS',
    ADD COLUMN IF NOT EXISTS usage_type               VARCHAR(20)  NOT NULL DEFAULT 'PARTNER_CODE',
    ADD COLUMN IF NOT EXISTS category_code            VARCHAR(50),
    ADD COLUMN IF NOT EXISTS audience_role            VARCHAR(20)  NOT NULL DEFAULT 'CUSTOMER',
    ADD COLUMN IF NOT EXISTS eligible_tiers           VARCHAR(200),
    ADD COLUMN IF NOT EXISTS per_customer_limit       INTEGER      NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS batch_quantity           INTEGER,
    ADD COLUMN IF NOT EXISTS batch_period             VARCHAR(20)  NOT NULL DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS batch_started_at         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS valid_days_after_collect INTEGER,
    ADD COLUMN IF NOT EXISTS require_ekyc             BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS show_in_free_strip       BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS strip_order              INTEGER,
    ADD COLUMN IF NOT EXISTS service_link             VARCHAR(500),
    ADD COLUMN IF NOT EXISTS branch_scope             VARCHAR(500),
    ADD COLUMN IF NOT EXISTS image_url                VARCHAR(500),
    ADD COLUMN IF NOT EXISTS i18n_json                TEXT;

-- Older vouchers priced at 0 coins were effectively free: mark them as free to collect.
UPDATE loyalty_vouchers SET acquire_type = 'FREE_COLLECT' WHERE point_cost = 0 AND acquire_type = 'COINS';

CREATE INDEX IF NOT EXISTS idx_vouchers_tenant_acquire ON loyalty_vouchers(tenant_id, acquire_type, status);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_account_voucher ON loyalty_voucher_redemptions(account_id, voucher_id);
