-- ==============================================================================
-- FLYWAY MIGRATION V18: FIFO POINT EXPIRATION BUCKETS & TWO-LEVEL APPROVAL QUEUE
-- Hệ Sinh Thái Khách Hàng Thân Thiết Liên Minh & Cổng Game Đa Thuê Bao (micro-loyalty)
-- Cơ sở dữ liệu: PostgreSQL 15+ (loyalty_db)
-- ==============================================================================

-- 1. BẢNG LÔ ĐIỂM HẾT HẠN THEO NGUYÊN TẮC FIFO (POINT_EXPIRATION_BUCKETS)
CREATE TABLE IF NOT EXISTS point_expiration_buckets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    account_id BIGINT NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
    asset_type VARCHAR(30) NOT NULL DEFAULT 'LOYALTY_COIN', -- TIER_POINT, LOYALTY_COIN
    initial_points NUMERIC(18, 2) NOT NULL,
    remaining_points NUMERIC(18, 2) NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMPTZ NOT NULL,
    source_ref VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DEPLETED, EXPIRED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fifo_buckets_lookup
    ON point_expiration_buckets(tenant_id, account_id, remaining_points, expired_at);
CREATE INDEX IF NOT EXISTS idx_fifo_buckets_expiry
    ON point_expiration_buckets(status, expired_at);

-- 2. BẢNG HÀNG ĐỢI PHÊ DUYỆT HAI CẤP MAKER-CHECKER (APPROVAL_REQUESTS)
CREATE TABLE IF NOT EXISTS approval_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_code VARCHAR(80) NOT NULL UNIQUE,
    tenant_id VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- POLICY, PROGRAM, POINT_ADJUSTMENT, PAYMENT_BATCH, SYSTEM_PARAM, ACCOUNT_LOCK
    target_id VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, ADJUST, LOCK, UNLOCK
    title VARCHAR(255),
    payload_before JSONB,
    payload_after JSONB,
    maker_username VARCHAR(100) NOT NULL,
    checker_username VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    reason TEXT,
    reject_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_tenant_status
    ON approval_requests(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_requests_target
    ON approval_requests(tenant_id, target_type, target_id);

-- 3. MỞ RỘNG BẢNG HẠNG HỘI VIÊN & HỒ SƠ HỘI VIÊN
ALTER TABLE loyalty_tiers
    ADD COLUMN IF NOT EXISTS keep_tier_points NUMERIC(18, 2) NOT NULL DEFAULT 0.00;

ALTER TABLE loyalty_accounts
    ADD COLUMN IF NOT EXISTS cycle_end_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '12 months'),
    ADD COLUMN IF NOT EXISTS tier_locked_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS lock_reason TEXT;

-- Chuẩn hóa ngưỡng nâng hạng (0 / 1.000 / 5.000 / 15.000) & giữ hạng (0 / 800 / 4.000 / 12.000)
UPDATE loyalty_tiers
SET min_points = 0.00, keep_tier_points = 0.00
WHERE code = 'SILVER';

UPDATE loyalty_tiers
SET min_points = 1000.00, keep_tier_points = 800.00
WHERE code = 'GOLD';

UPDATE loyalty_tiers
SET min_points = 5000.00, keep_tier_points = 4000.00
WHERE code = 'PLATINUM';

UPDATE loyalty_tiers
SET min_points = 15000.00, keep_tier_points = 12000.00
WHERE code = 'DIAMOND';

UPDATE loyalty_accounts
SET cycle_end_at = COALESCE(cycle_end_at, CURRENT_TIMESTAMP + INTERVAL '12 months')
WHERE cycle_end_at IS NULL;

-- 4. BACKFILL AN TOÀN 1 LÔ FIFO CHO TOÀN BỘ TÀI KHOẢN CÓ CURRENT_POINTS > 0
INSERT INTO point_expiration_buckets (
    tenant_id, account_id, asset_type, initial_points, remaining_points,
    earned_at, expired_at, source_ref, status
)
SELECT
    a.tenant_id,
    a.id,
    'LOYALTY_COIN',
    a.current_points,
    a.current_points,
    a.created_at,
    CURRENT_TIMESTAMP + INTERVAL '12 months',
    'BACKFILL_V18_' || a.id,
    'ACTIVE'
FROM loyalty_accounts a
WHERE a.current_points > 0
  AND NOT EXISTS (
      SELECT 1 FROM point_expiration_buckets b
      WHERE b.account_id = a.id AND b.tenant_id = a.tenant_id
  );

-- 5. SEED YÊU CẦU PHÊ DUYỆT MẪU CHO HÀNG ĐỢI QT-04
INSERT INTO approval_requests (
    request_code, tenant_id, target_type, target_id, action_type, title,
    payload_before, payload_after, maker_username, checker_username, status, reason, reviewed_at
) VALUES
(
    'APR_202611_001',
    'TENANT_NATCASH',
    'POINT_ADJUSTMENT',
    '50937123456',
    'ADJUST',
    'Bồi hoàn 150 Natcash Coin sự cố giao dịch POS Delmas',
    '{"externalUserId": "50937123456", "currentPoints": 2500.00}'::jsonb,
    '{"externalUserId": "50937123456", "deltaPoints": 150.00, "assetType": "LOYALTY_COIN"}'::jsonb,
    'operator',
    NULL,
    'PENDING',
    'Khách hàng bị treo giao dịch POS-DELMAS-01 cần cộng bù điểm thủ công',
    NULL
),
(
    'APR_202611_002',
    'TENANT_NATCASH',
    'POLICY',
    'NATCASH_WALLET',
    'UPDATE',
    'Điều chỉnh hạn mức tiêu điểm tối đa lên 100% hóa đơn Natcash Pay',
    '{"maxBurnPercentage": 50.00, "pointExchangeRate": 1.0000}'::jsonb,
    '{"maxBurnPercentage": 100.00, "pointExchangeRate": 1.0000}'::jsonb,
    'operator',
    'admin',
    'APPROVED',
    'Áp dụng chiến dịch thanh toán không tiền mặt tháng 11/2026',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
)
ON CONFLICT (request_code) DO NOTHING;
