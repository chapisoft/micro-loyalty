-- ==============================================================================
-- FLYWAY MIGRATION SCRIPT: V1__init_loyalty_core_schema.sql
-- Hệ Sinh Thái Khách Hàng Thân Thiết Liên Minh & Cổng Game Đa Thuê Bao (micro-loyalty)
-- Cơ sở dữ liệu: PostgreSQL 15+ (loyalty_db)
-- ==============================================================================

-- 1. BẢNG THUÊ BAO (TENANTS)
CREATE TABLE IF NOT EXISTS tenants (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(100) NOT NULL UNIQUE,
    secret_key VARCHAR(255) NOT NULL,
    webhook_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);
CREATE INDEX IF NOT EXISTS idx_tenants_api_key ON tenants(api_key);

-- 2. BẢNG ĐỐI TÁC LIÊN MINH (LOYALTY_PARTNERS)
CREATE TABLE IF NOT EXISTS loyalty_partners (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    partner_code VARCHAR(50) NOT NULL,
    partner_name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(50) NOT NULL DEFAULT 'RETAIL', -- RETAIL, TELECOM, BANKING, F_AND_B, FUEL
    api_key VARCHAR(100) NOT NULL,
    secret_key VARCHAR(255) NOT NULL,
    webhook_secret VARCHAR(255),
    webhook_url VARCHAR(500),
    ip_whitelist TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_loyalty_partner UNIQUE (tenant_id, partner_code)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_partners_tenant ON loyalty_partners(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_partners_code ON loyalty_partners(partner_code);
CREATE INDEX IF NOT EXISTS idx_loyalty_partners_api_key ON loyalty_partners(api_key);

-- 3. BẢNG HẠNG HỘI VIÊN (LOYALTY_TIERS)
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL, -- SILVER, GOLD, PLATINUM, DIAMOND
    name VARCHAR(100) NOT NULL,
    tier_level INT NOT NULL DEFAULT 1, -- 1: Silver, 2: Gold, 3: Platinum, 4: Diamond
    min_points NUMERIC(18, 2) NOT NULL DEFAULT 0,
    point_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    free_daily_turns INT NOT NULL DEFAULT 1,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_loyalty_tier UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_tenant ON loyalty_tiers(tenant_id);

-- 4. BẢNG HỒ SƠ HỘI VIÊN & SỔ CÁI ĐIỂM (LOYALTY_ACCOUNTS)
CREATE TABLE IF NOT EXISTS loyalty_accounts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    external_user_id VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30),
    full_name VARCHAR(255),
    date_of_birth DATE,
    tier_id BIGINT REFERENCES loyalty_tiers(id),
    current_points NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    tier_points NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    tier_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_loyalty_account UNIQUE (tenant_id, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_tenant ON loyalty_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_user ON loyalty_accounts(external_user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_phone ON loyalty_accounts(phone_number);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_tier ON loyalty_accounts(tier_id);

-- 5. BẢNG SỔ CÁI ĐIỂM BẤT BIẾN (LOYALTY_POINT_LEDGER)
CREATE TABLE IF NOT EXISTS loyalty_point_ledger (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    account_id BIGINT NOT NULL REFERENCES loyalty_accounts(id),
    point_change NUMERIC(18, 2) NOT NULL,
    balance_after NUMERIC(18, 2) NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- EARN, BURN, REFUND, EXPIRE, ADJUST, CASHBACK
    reference_code VARCHAR(100) NOT NULL,
    partner_id BIGINT REFERENCES loyalty_partners(id),
    description TEXT,
    expired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_tenant ON loyalty_point_ledger(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_account ON loyalty_point_ledger(account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_ref ON loyalty_point_ledger(reference_code);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_created ON loyalty_point_ledger(created_at);

-- 6. BẢNG KHO PHIẾU ƯU ĐÃI ĐIỆN TỬ (LOYALTY_VOUCHERS)
CREATE TABLE IF NOT EXISTS loyalty_vouchers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    partner_id BIGINT REFERENCES loyalty_partners(id),
    voucher_code VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(30) NOT NULL DEFAULT 'FIXED_AMOUNT', -- PERCENTAGE, FIXED_AMOUNT, FREE_ITEM
    discount_value NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    min_bill_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    max_discount_amount NUMERIC(18, 2),
    total_quantity INT NOT NULL DEFAULT 0,
    available_quantity INT NOT NULL DEFAULT 0,
    point_cost NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_loyalty_voucher UNIQUE (tenant_id, voucher_code)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_vouchers_tenant ON loyalty_vouchers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_vouchers_partner ON loyalty_vouchers(partner_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_vouchers_status ON loyalty_vouchers(status);

-- 7. BẢNG LỊCH SỬ ĐỔI & SỬ DỤNG VOUCHER (LOYALTY_VOUCHER_REDEMPTIONS)
CREATE TABLE IF NOT EXISTS loyalty_voucher_redemptions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    account_id BIGINT NOT NULL REFERENCES loyalty_accounts(id),
    voucher_id BIGINT NOT NULL REFERENCES loyalty_vouchers(id),
    redemption_code VARCHAR(100) NOT NULL UNIQUE,
    points_used NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, USED, EXPIRED, CANCELLED
    used_at TIMESTAMPTZ,
    used_partner_id BIGINT REFERENCES loyalty_partners(id),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_tenant ON loyalty_voucher_redemptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_account ON loyalty_voucher_redemptions(account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_voucher ON loyalty_voucher_redemptions(voucher_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_code ON loyalty_voucher_redemptions(redemption_code);

-- 8. BẢNG CỘT MỐC CHIẾN DỊCH (LOYALTY_CAMPAIGN_MILESTONES)
CREATE TABLE IF NOT EXISTS loyalty_campaign_milestones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    campaign_code VARCHAR(100) NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    milestone_step INT NOT NULL DEFAULT 1,
    target_metric VARCHAR(50) NOT NULL, -- BILL_AMOUNT, TRANSACTION_COUNT, EARN_POINTS, GAME_SPINS
    target_value NUMERIC(18, 2) NOT NULL,
    reward_points NUMERIC(18, 2) DEFAULT 0.00,
    reward_voucher_id BIGINT REFERENCES loyalty_vouchers(id),
    reward_game_turns INT DEFAULT 0,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_loyalty_milestone UNIQUE (tenant_id, campaign_code, milestone_step)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_milestones_tenant ON loyalty_campaign_milestones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_milestones_campaign ON loyalty_campaign_milestones(campaign_code);

-- 9. BẢNG TIẾN ĐỘ CỘT MỐC NGƯỜI DÙNG (LOYALTY_USER_MILESTONES)
CREATE TABLE IF NOT EXISTS loyalty_user_milestones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    account_id BIGINT NOT NULL REFERENCES loyalty_accounts(id),
    milestone_id BIGINT NOT NULL REFERENCES loyalty_campaign_milestones(id),
    current_progress NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, CLAIMED
    completed_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_milestone UNIQUE (tenant_id, account_id, milestone_id)
);

CREATE INDEX IF NOT EXISTS idx_user_milestones_account ON loyalty_user_milestones(account_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_milestone ON loyalty_user_milestones(milestone_id);

-- 10. BẢNG CẤU HÌNH GỢI NHẮC THÔNG MINH (LOYALTY_ENGAGEMENT_TRIGGERS)
CREATE TABLE IF NOT EXISTS loyalty_engagement_triggers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL, -- TIER_UPGRADE_NUDGE, POINT_EXPIRATION_ALERT, BIRTHDAY_GREETING, INACTIVE_REMINDER
    threshold_percentage NUMERIC(5, 2), -- Ví dụ: 80% điểm nâng hạng
    days_in_advance INT DEFAULT 0,
    message_template TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'IN_APP', -- IN_APP, PUSH_NOTIFICATION, SMS
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_triggers_tenant ON loyalty_engagement_triggers(tenant_id);

-- 11. BẢNG LƯU VẾT THÔNG ĐIỆP CHỐNG LÀM PHIỀN (LOYALTY_COMMUNICATION_LOGS)
CREATE TABLE IF NOT EXISTS loyalty_communication_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    account_id BIGINT NOT NULL REFERENCES loyalty_accounts(id),
    channel VARCHAR(50) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    message_content TEXT,
    sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'SENT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comm_logs_account_date ON loyalty_communication_logs(account_id, sent_date);

-- 12. BẢNG CHÍNH SÁCH TIÊU ĐIỂM TẠI ĐIỂM BÁN (LOYALTY_ACCEPTANCE_POLICIES)
CREATE TABLE IF NOT EXISTS loyalty_acceptance_policies (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    partner_id BIGINT NOT NULL REFERENCES loyalty_partners(id),
    point_exchange_rate NUMERIC(18, 4) NOT NULL DEFAULT 1.0000, -- 1 điểm = X đồng/USD
    max_burn_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00, -- Tối đa trừ 50% hóa đơn
    min_burn_points NUMERIC(18, 2) NOT NULL DEFAULT 10.00,
    max_burn_points_per_day NUMERIC(18, 2) NOT NULL DEFAULT 10000.00,
    min_tier_id BIGINT REFERENCES loyalty_tiers(id),
    allowed_point_types VARCHAR(100) DEFAULT 'ALL',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_partner_acceptance_policy UNIQUE (tenant_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_acceptance_partner ON loyalty_acceptance_policies(partner_id);

-- 13. BẢNG GIAO DỊCH TIÊU ĐIỂM CHÉO LIÊN MINH (LOYALTY_CROSS_PARTNER_TRANSACTIONS)
CREATE TABLE IF NOT EXISTS loyalty_cross_partner_transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    transaction_code VARCHAR(100) NOT NULL UNIQUE,
    external_user_id VARCHAR(100) NOT NULL,
    issuer_partner_id BIGINT REFERENCES loyalty_partners(id),
    redeemer_partner_id BIGINT NOT NULL REFERENCES loyalty_partners(id),
    points_burned NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    voucher_id_used BIGINT REFERENCES loyalty_vouchers(id),
    bill_amount NUMERIC(18, 2) NOT NULL,
    bill_discount_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    gift_item_id VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, REVERSED, FAILED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cross_tx_tenant ON loyalty_cross_partner_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cross_tx_code ON loyalty_cross_partner_transactions(transaction_code);
CREATE INDEX IF NOT EXISTS idx_cross_tx_redeemer ON loyalty_cross_partner_transactions(redeemer_partner_id);
CREATE INDEX IF NOT EXISTS idx_cross_tx_created ON loyalty_cross_partner_transactions(created_at);

-- 14. BẢNG BÁO CÁO QUYẾT TOÁN BÙ TRỪ ĐA PHƯƠNG (LOYALTY_CLEARINGHOUSE_SETTLEMENTS)
CREATE TABLE IF NOT EXISTS loyalty_clearinghouse_settlements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    partner_id BIGINT NOT NULL REFERENCES loyalty_partners(id),
    period VARCHAR(20) NOT NULL, -- YYYY-MM hoặc YYYY-WW
    total_points_issued NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    total_points_redeemed NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    net_points NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    net_settlement_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, SETTLED, DISPUTED
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_clearinghouse_period UNIQUE (tenant_id, partner_id, period)
);

CREATE INDEX IF NOT EXISTS idx_settlements_partner ON loyalty_clearinghouse_settlements(partner_id);
CREATE INDEX IF NOT EXISTS idx_settlements_period ON loyalty_clearinghouse_settlements(period);

-- 15. BẢNG HỘP THƯ ĐI TRANSACTIONAL OUTBOX (WEBHOOK_OUTBOX)
CREATE TABLE IF NOT EXISTS webhook_outbox (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- TIER_UPGRADED, TIER_DOWNGRADED, POINT_REDEEMED, SETTLEMENT_GENERATED
    payload JSONB NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, PROCESSED, FAILED
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outbox_status_next_retry ON webhook_outbox(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_outbox_tenant ON webhook_outbox(tenant_id);

-- 16. BẢNG THÔNG ĐIỆP CHẾT (WEBHOOK_DEAD_LETTER)
CREATE TABLE IF NOT EXISTS webhook_dead_letter (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    retry_count INT NOT NULL,
    error_message TEXT,
    failed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dead_letter_tenant ON webhook_dead_letter(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dead_letter_failed ON webhook_dead_letter(failed_at);

-- 17. NHÓM BẢNG CỔNG GAME & TRÒ CHƠI (GAMEHUB)

-- 17.1. Đối tác phát triển Game (GAME_PARTNERS)
CREATE TABLE IF NOT EXISTS game_partners (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    revenue_share_rate NUMERIC(5, 2) NOT NULL DEFAULT 70.00, -- 70% doanh thu
    api_key VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_game_partner UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_game_partners_tenant ON game_partners(tenant_id);

-- 17.2. Danh mục Trò chơi (GAMES)
CREATE TABLE IF NOT EXISTS games (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    game_partner_id BIGINT REFERENCES game_partners(id),
    game_code VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'CASUAL', -- CASUAL, PUZZLE, ACTION, LUCKY_DRAW
    icon_url VARCHAR(500),
    banner_url VARCHAR(500),
    game_url VARCHAR(500),
    entry_fee NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    free_turns_per_day INT NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_game_code UNIQUE (tenant_id, game_code)
);

CREATE INDEX IF NOT EXISTS idx_games_tenant ON games(tenant_id);
CREATE INDEX IF NOT EXISTS idx_games_partner ON games(game_partner_id);

-- 17.3. Giao dịch Mua lượt / Vật phẩm In-Game (IN_GAME_TRANSACTIONS)
CREATE TABLE IF NOT EXISTS in_game_transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    transaction_code VARCHAR(100) NOT NULL UNIQUE,
    external_user_id VARCHAR(100) NOT NULL,
    game_id BIGINT NOT NULL REFERENCES games(id),
    item_type VARCHAR(50) NOT NULL DEFAULT 'EXTRA_TURNS', -- EXTRA_TURNS, IN_GAME_ITEM
    amount NUMERIC(18, 2) NOT NULL,
    points_awarded NUMERIC(18, 2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_in_game_tx_user ON in_game_transactions(external_user_id);
CREATE INDEX IF NOT EXISTS idx_in_game_tx_game ON in_game_transactions(game_id);

-- 17.4. Quyết toán Doanh thu Nhà phát triển Game (PARTNER_SETTLEMENTS)
CREATE TABLE IF NOT EXISTS partner_settlements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    game_partner_id BIGINT NOT NULL REFERENCES game_partners(id),
    period VARCHAR(20) NOT NULL,
    total_revenue NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    partner_share_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_game_partner_settlement UNIQUE (tenant_id, game_partner_id, period)
);

-- 17.5. Danh mục Giải thưởng Vòng quay (PRIZES)
CREATE TABLE IF NOT EXISTS prizes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    game_id BIGINT NOT NULL REFERENCES games(id),
    prize_code VARCHAR(50) NOT NULL,
    prize_name VARCHAR(255) NOT NULL,
    prize_type VARCHAR(50) NOT NULL DEFAULT 'POINTS', -- POINTS, VOUCHER, CASHBACK, PHYSICAL_GIFT, NO_LUCK
    prize_value NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    total_stock INT NOT NULL DEFAULT 0,
    remaining_stock INT NOT NULL DEFAULT 0,
    daily_stock_limit INT NOT NULL DEFAULT 0,
    icon_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_prize_code UNIQUE (tenant_id, game_id, prize_code)
);

CREATE INDEX IF NOT EXISTS idx_prizes_game ON prizes(game_id);

-- 17.6. Ma trận Cấu trúc Tỷ lệ Trúng thưởng theo Hạng (PRIZES_STRUCTURE)
CREATE TABLE IF NOT EXISTS prizes_structure (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    game_id BIGINT NOT NULL REFERENCES games(id),
    prize_id BIGINT NOT NULL REFERENCES prizes(id),
    tier_id BIGINT REFERENCES loyalty_tiers(id),
    probability_rate NUMERIC(8, 6) NOT NULL DEFAULT 0.000000, -- Xác suất từ 0.000000 đến 1.000000
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prizes_structure_game ON prizes_structure(game_id);
CREATE INDEX IF NOT EXISTS idx_prizes_structure_prize ON prizes_structure(prize_id);

-- 17.7. Quản lý Lượt chơi của Người dùng (GAMES_TURN)
CREATE TABLE IF NOT EXISTS games_turn (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    external_user_id VARCHAR(100) NOT NULL,
    game_id BIGINT NOT NULL REFERENCES games(id),
    total_turns INT NOT NULL DEFAULT 0,
    available_turns INT NOT NULL DEFAULT 0,
    free_turns_today INT NOT NULL DEFAULT 0,
    last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_game_turn UNIQUE (tenant_id, external_user_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_games_turn_user ON games_turn(external_user_id);
CREATE INDEX IF NOT EXISTS idx_games_turn_game ON games_turn(game_id);

-- 17.8. Kết quả Trúng thưởng Trò chơi (GAMES_RESULTS)
CREATE TABLE IF NOT EXISTS games_results (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    external_user_id VARCHAR(100) NOT NULL,
    game_id BIGINT NOT NULL REFERENCES games(id),
    prize_id BIGINT NOT NULL REFERENCES prizes(id),
    spin_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    prize_awarded BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_games_results_user ON games_results(external_user_id);
CREATE INDEX IF NOT EXISTS idx_games_results_game ON games_results(game_id);
CREATE INDEX IF NOT EXISTS idx_games_results_time ON games_results(spin_time);
