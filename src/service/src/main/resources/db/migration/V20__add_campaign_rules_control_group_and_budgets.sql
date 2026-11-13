-- ==============================================================================
-- FLYWAY MIGRATION V20: CAMPAIGN 4-LAYER RULES, CONTROL GROUPS, MONTHLY BUDGETS & REFERRALS
-- Hệ Sinh Thái Khách Hàng Thân Thiết Liên Minh & Cổng Game Đa Thuê Bao (micro-loyalty)
-- Cơ sở dữ liệu: PostgreSQL 15+ (loyalty_db)
-- ==============================================================================

-- 1. BẢNG CẤU HÌNH LUẬT CHIẾN DỊCH 4 TẦNG WHEN – IF – THEN – LIMITS (CAMPAIGN_RULE_CONDITIONS)
CREATE TABLE IF NOT EXISTS campaign_rule_conditions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    campaign_code VARCHAR(100) NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    mission_category VARCHAR(50) NOT NULL DEFAULT 'TX_COUNT', -- FIRST_TX, SPEND_TIERED, TX_COUNT, STREAK, CHECKIN_7D, WIN_BACK, PARTNER_PURCHASE, CROSS_SELL, REFERRAL
    when_event JSONB NOT NULL DEFAULT '{}'::jsonb,
    if_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    then_rewards JSONB NOT NULL DEFAULT '{}'::jsonb,
    limits_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    sponsor_type VARCHAR(50) NOT NULL DEFAULT 'NATCASH',
    partner_id BIGINT REFERENCES loyalty_partners(id) ON DELETE SET NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAUSED_BUDGET_EXCEEDED, INACTIVE, DRAFT
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_campaign_rule_code UNIQUE (tenant_id, campaign_code)
);

CREATE INDEX IF NOT EXISTS idx_campaign_rules_tenant_status
    ON campaign_rule_conditions(tenant_id, status, start_date, end_date);

-- 2. BẢNG NHÓM ĐỐI CHỨNG A/B TESTING (CAMPAIGN_CONTROL_GROUPS)
CREATE TABLE IF NOT EXISTS campaign_control_groups (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    campaign_code VARCHAR(100) NOT NULL,
    external_user_id VARCHAR(100) NOT NULL,
    bucket_group VARCHAR(20) NOT NULL, -- TEST, CONTROL
    hash_bucket INT NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_campaign_control_user UNIQUE (tenant_id, campaign_code, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_control_group_lookup
    ON campaign_control_groups(tenant_id, campaign_code, bucket_group);

-- 3. BẢNG QUẢN TRỊ NGÂN SÁCH CHIẾN DỊCH THEO THÁNG (LOYALTY_MONTHLY_BUDGETS)
CREATE TABLE IF NOT EXISTS loyalty_monthly_budgets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    budget_month VARCHAR(10) NOT NULL, -- YYYY-MM
    sponsor_type VARCHAR(50) NOT NULL, -- NATCASH, PARTNER_CO_FUND, PARTNER_SELF, GAMEHUB
    partner_id BIGINT REFERENCES loyalty_partners(id) ON DELETE SET NULL,
    budget_name VARCHAR(255) NOT NULL,
    budget_cap NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    consumed_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    alert_80_sent BOOLEAN NOT NULL DEFAULT FALSE,
    hard_stop_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_monthly_budget UNIQUE (tenant_id, budget_month, sponsor_type)
);

CREATE INDEX IF NOT EXISTS idx_monthly_budgets_lookup
    ON loyalty_monthly_budgets(tenant_id, budget_month, status);

-- 4. BẢNG THEO DÕI GIỚI THIỆU BẠN BÈ & XÁC MINH EKYC (USER_REFERRALS)
CREATE TABLE IF NOT EXISTS user_referrals (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    referrer_user_id VARCHAR(100) NOT NULL,
    referee_user_id VARCHAR(100),
    referee_phone VARCHAR(30),
    referral_code VARCHAR(50) NOT NULL,
    ekyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
    first_tx_completed BOOLEAN NOT NULL DEFAULT FALSE,
    reward_points NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, EKYC_DONE, REWARDED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rewarded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer
    ON user_referrals(tenant_id, referrer_user_id);

-- 5. SEED LUẬT CHIẾN DỊCH, NGÂN SÁCH THÁNG VÀ LƯỢT GIỚI THIỆU MẪU
INSERT INTO campaign_rule_conditions (
    tenant_id, campaign_code, campaign_name, mission_category,
    when_event, if_conditions, then_rewards, limits_config,
    sponsor_type, start_date, end_date, status
) VALUES
(
    'TENANT_NATCASH', 'RULE_FIRST_QR_PAY', 'Thưởng Giao Dịch QR Natcash Đầu Tiên', 'FIRST_TX',
    '{"event": "QR_PAYMENT", "channel": "MOBILE_APP"}'::jsonb,
    '{"segment": "NEW_CUSTOMER", "minAmount": 100}'::jsonb,
    '{"points": 100, "assetType": "LOYALTY_COIN", "gameTurns": 1}'::jsonb,
    '{"maxPerUser": 1, "controlGroupPct": 5}'::jsonb,
    'NATCASH', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '60 days', 'ACTIVE'
),
(
    'TENANT_NATCASH', 'RULE_WEEKLY_TOPUP_STREAK', 'Chuỗi Nạp Thẻ Natcom 3 Tuần Liên Tiếp', 'STREAK',
    '{"event": "TELCO_TOPUP", "channel": "MOBILE_APP"}'::jsonb,
    '{"segment": "GENERAL", "streakWeeks": 3, "minAmount": 250}'::jsonb,
    '{"points": 150, "assetType": "LOYALTY_COIN", "gameTurns": 2}'::jsonb,
    '{"maxPerUser": 2, "controlGroupPct": 5}'::jsonb,
    'PARTNER_CO_FUND', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '60 days', 'ACTIVE'
),
(
    'TENANT_NATCASH', 'RULE_CROSS_SELL_EDH', 'Thanh Toán Hóa Đơn Điện EDH Lần Đầu', 'CROSS_SELL',
    '{"event": "BILL_PAY_UTILITY", "partnerCode": "EDH_POWER"}'::jsonb,
    '{"segment": "SINGLE_SERVICE", "minAmount": 500}'::jsonb,
    '{"points": 200, "assetType": "LOYALTY_COIN"}'::jsonb,
    '{"maxPerUser": 1, "controlGroupPct": 10}'::jsonb,
    'NATCASH', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '60 days', 'ACTIVE'
)
ON CONFLICT (tenant_id, campaign_code) DO NOTHING;

INSERT INTO loyalty_monthly_budgets (
    tenant_id, budget_month, sponsor_type, budget_name, budget_cap, consumed_amount, alert_80_sent, hard_stop_triggered, status
) VALUES
('TENANT_NATCASH', '2026-11', 'NATCASH', 'Ngân sách Loyalty Natcash Tháng 11/2026', 500000.00, 315000.00, FALSE, FALSE, 'ACTIVE'),
('TENANT_NATCASH', '2026-11', 'PARTNER_CO_FUND', 'Quỹ Đồng Tài Trợ Đối Tác Liên Minh 11/2026', 250000.00, 205000.00, TRUE, FALSE, 'ACTIVE'),
('TENANT_NATCASH', '2026-11', 'GAMEHUB', 'Ngân sách Trả Thưởng GameHub & Learning 11/2026', 150000.00, 62400.00, FALSE, FALSE, 'ACTIVE'),
('TENANT_DELIMART', '2026-11', 'NATCASH', 'Ngân sách Loyalty Delimart 11/2026', 300000.00, 95000.00, FALSE, FALSE, 'ACTIVE')
ON CONFLICT (tenant_id, budget_month, sponsor_type) DO NOTHING;

INSERT INTO user_referrals (
    tenant_id, referrer_user_id, referee_user_id, referee_phone, referral_code,
    ekyc_verified, first_tx_completed, reward_points, status, rewarded_at
)
SELECT
    'TENANT_NATCASH', '50937123456', '50938112233', '+50938112233', 'REF-NC-50937',
    TRUE, TRUE, 100.00, 'REWARDED', CURRENT_TIMESTAMP - INTERVAL '2 days'
WHERE NOT EXISTS (
    SELECT 1 FROM user_referrals WHERE tenant_id = 'TENANT_NATCASH' AND referrer_user_id = '50937123456'
);
