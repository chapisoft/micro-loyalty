-- ==============================================================================
-- FLYWAY MIGRATION V5: Bổ sung các bảng Cổng Game và Vòng quay may mắn
-- ==============================================================================

-- 1. BẢNG VÒNG QUAY MAY MẮN (LOYALTY_LUCKY_WHEELS)
CREATE TABLE IF NOT EXISTS loyalty_lucky_wheels (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    wheel_code VARCHAR(100) NOT NULL,
    wheel_name VARCHAR(255) NOT NULL,
    price_per_spin DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    free_spins_daily INT NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_loyalty_wheel UNIQUE (tenant_id, wheel_code)
);

CREATE INDEX IF NOT EXISTS idx_wheels_tenant ON loyalty_lucky_wheels(tenant_id);

-- 2. BẢNG PHẦN THƯỞNG VÒNG QUAY (LOYALTY_WHEEL_PRIZES)
CREATE TABLE IF NOT EXISTS loyalty_wheel_prizes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wheel_id BIGINT NOT NULL REFERENCES loyalty_lucky_wheels(id) ON DELETE CASCADE,
    prize_name VARCHAR(255) NOT NULL,
    prize_type VARCHAR(50) NOT NULL,
    prize_value DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    probability_weight INT NOT NULL DEFAULT 10,
    daily_budget_limit DECIMAL(18,2),
    display_order INT NOT NULL DEFAULT 1,
    color_code VARCHAR(30),
    icon_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wheel_prizes_wheel ON loyalty_wheel_prizes(wheel_id);

-- 3. BẢNG CỔNG GAME HTML5 (LOYALTY_GAMES)
CREATE TABLE IF NOT EXISTS loyalty_games (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    game_code VARCHAR(100) NOT NULL,
    game_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price_per_turn DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    free_turns_daily INT NOT NULL DEFAULT 1,
    game_url VARCHAR(500),
    icon_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_loyalty_game UNIQUE (tenant_id, game_code)
);

CREATE INDEX IF NOT EXISTS idx_games_tenant ON loyalty_games(tenant_id);

-- 4. BẢNG PHIÊN CHƠI GAME (LOYALTY_GAME_SESSIONS)
CREATE TABLE IF NOT EXISTS loyalty_game_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    external_user_id VARCHAR(100) NOT NULL,
    game_id BIGINT NOT NULL REFERENCES loyalty_games(id) ON DELETE CASCADE,
    session_token VARCHAR(100) NOT NULL UNIQUE,
    turns_allocated INT NOT NULL DEFAULT 1,
    turns_used INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'INITIATED',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON loyalty_game_sessions(tenant_id, external_user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_token ON loyalty_game_sessions(session_token);
