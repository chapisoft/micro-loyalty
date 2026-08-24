-- ==============================================================================
-- FLYWAY MIGRATION V8: Bổ sung Bảng Lịch Sử Chơi Game, Cấu Hình Chung & Tham Số Chi Tiết
-- ==============================================================================

-- 1. BẢNG LỊCH SỬ CHƠI GAME & KẾT QUẢ PHÂN BỔ PHẦN THƯỞNG (LOYALTY_GAME_PLAY_HISTORY)
CREATE TABLE IF NOT EXISTS loyalty_game_play_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    external_user_id VARCHAR(100) NOT NULL,
    game_code VARCHAR(100) NOT NULL,
    session_token VARCHAR(100),
    transaction_ref VARCHAR(100) NOT NULL UNIQUE,
    score INT NOT NULL DEFAULT 0,
    reward_type VARCHAR(50) NOT NULL DEFAULT 'NO_LUCK', -- POINTS, VOUCHER, CASHBACK, TURNS, NO_LUCK
    reward_value DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    points_awarded DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    voucher_code VARCHAR(100),
    details JSONB,
    status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_history_user ON loyalty_game_play_history(tenant_id, external_user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_game ON loyalty_game_play_history(tenant_id, game_code);
CREATE INDEX IF NOT EXISTS idx_game_history_created ON loyalty_game_play_history(created_at);

-- 2. BỔ SUNG CỘT CẤU HÌNH THAM SỐ VÀO BẢNG CỔNG GAME (LOYALTY_GAMES)
ALTER TABLE loyalty_games ADD COLUMN IF NOT EXISTS daily_budget_limit DECIMAL(18,2) NOT NULL DEFAULT 50000.00;
ALTER TABLE loyalty_games ADD COLUMN IF NOT EXISTS allow_points_spin BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE loyalty_games ADD COLUMN IF NOT EXISTS game_params JSONB;

-- 3. BẢNG CẤU HÌNH CHUNG TOÀN CỔNG GAME (LOYALTY_GAME_HUB_CONFIG)
CREATE TABLE IF NOT EXISTS loyalty_game_hub_config (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL UNIQUE,
    points_per_turn_exchange INT NOT NULL DEFAULT 50,
    golden_hour_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    max_daily_turns_per_user INT NOT NULL DEFAULT 10,
    welcome_banner_text VARCHAR(500) DEFAULT 'Tham gia minigame mỗi ngày nhận quà siêu khủng từ Natcash!',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_hub_config_tenant ON loyalty_game_hub_config(tenant_id);

-- 4. KHỞI TẠO CẤU HÌNH MẪU CHO CÁC TENANT MẶC ĐỊNH
INSERT INTO loyalty_game_hub_config (tenant_id, points_per_turn_exchange, golden_hour_enabled, maintenance_mode, max_daily_turns_per_user, welcome_banner_text)
VALUES
    ('TENANT_NATCASH', 50, TRUE, FALSE, 10, 'Tham gia minigame mỗi ngày nhận quà siêu khủng từ Natcash!'),
    ('TENANT_MICRO_CRM', 30, TRUE, FALSE, 15, 'Săn điểm thưởng cùng hệ sinh thái Micro CRM!'),
    ('TENANT_DELIMART', 20, TRUE, FALSE, 20, 'Vui chơi nhận voucher mua sắm thả ga tại Siêu thị Delimart!')
ON CONFLICT (tenant_id) DO NOTHING;
