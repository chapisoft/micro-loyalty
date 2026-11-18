-- =====================================================================================
-- V36: Game points (pts) & Monthly Leaderboard Prizes/Payouts (Figma 18/11 · GM-01 & GM-10)
--  * Game points (pts) are non-spendable, reset monthly, separate from Natcash Coins.
--  * Sources have daily caps (MINI_GAME, LEARNING_LESSON, DAILY_CHALLENGE, CHECKIN_STREAK, LUCKY_GAME_PARTICIPATION).
--  * Buying extra plays with coins NEVER earns game pts.
--  * Boards: ALL · LEARNING · MINI_GAMES.
--  * Monthly close job locks results and creates PENDING_APPROVAL payouts (QT-04 dual approval).
-- Dialect: PostgreSQL 15+
-- =====================================================================================

ALTER TABLE game_monthly_leaderboards
    ADD COLUMN IF NOT EXISTS board_type VARCHAR(30) NOT NULL DEFAULT 'ALL';

ALTER TABLE game_monthly_leaderboards
    DROP CONSTRAINT IF EXISTS uq_game_leaderboard;

ALTER TABLE game_monthly_leaderboards
    ADD CONSTRAINT uq_game_leaderboard_board
    UNIQUE (tenant_id, leaderboard_month, board_type, external_user_id);

CREATE INDEX IF NOT EXISTS idx_game_leaderboard_board_rank
    ON game_monthly_leaderboards(tenant_id, leaderboard_month, board_type, total_score DESC);

CREATE TABLE IF NOT EXISTS game_point_rules (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id          VARCHAR(50)  NOT NULL,
    source_code        VARCHAR(50)  NOT NULL,
    board_type         VARCHAR(30)  NOT NULL DEFAULT 'ALL',
    formula_type       VARCHAR(30)  NOT NULL DEFAULT 'FIXED',
    base_pts           INTEGER      NOT NULL DEFAULT 10,
    score_divisor      INTEGER      NOT NULL DEFAULT 1,
    max_pts_per_action INTEGER      NOT NULL DEFAULT 200,
    daily_cap_pts      INTEGER      NOT NULL DEFAULT 500,
    status             VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    description        VARCHAR(500),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_game_point_rules_tenant_source UNIQUE (tenant_id, source_code)
);

CREATE TABLE IF NOT EXISTS game_point_ledger (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id         VARCHAR(50)  NOT NULL,
    external_user_id  VARCHAR(100) NOT NULL,
    source_code       VARCHAR(50)  NOT NULL,
    board_type        VARCHAR(30)  NOT NULL DEFAULT 'ALL',
    game_code         VARCHAR(100),
    reference_code    VARCHAR(120),
    pts_awarded       INTEGER      NOT NULL,
    earned_date       DATE         NOT NULL,
    leaderboard_month VARCHAR(10)  NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_point_ledger_daily
    ON game_point_ledger(tenant_id, external_user_id, source_code, earned_date);

CREATE INDEX IF NOT EXISTS idx_game_point_ledger_month
    ON game_point_ledger(tenant_id, leaderboard_month, board_type, external_user_id);

CREATE TABLE IF NOT EXISTS leaderboard_prizes (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id     VARCHAR(50)    NOT NULL,
    board_type    VARCHAR(30)    NOT NULL DEFAULT 'ALL',
    rank_from     INTEGER        NOT NULL,
    rank_to       INTEGER        NOT NULL,
    prize_type    VARCHAR(30)    NOT NULL,
    prize_label   VARCHAR(255)   NOT NULL,
    prize_value   DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    voucher_code  VARCHAR(100),
    sponsor_name  VARCHAR(200),
    status        VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_prizes_board
    ON leaderboard_prizes(tenant_id, board_type, status, rank_from);

CREATE TABLE IF NOT EXISTS leaderboard_payouts (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id         VARCHAR(50)    NOT NULL,
    leaderboard_month VARCHAR(10)    NOT NULL,
    board_type        VARCHAR(30)    NOT NULL DEFAULT 'ALL',
    external_user_id  VARCHAR(100)   NOT NULL,
    display_name      VARCHAR(255),
    rank_position     INTEGER        NOT NULL,
    total_pts         INTEGER        NOT NULL DEFAULT 0,
    prize_id          BIGINT,
    prize_label       VARCHAR(255),
    prize_type        VARCHAR(30),
    prize_value       DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    approval_status   VARCHAR(30)    NOT NULL DEFAULT 'PENDING_APPROVAL',
    approved_by       VARCHAR(100),
    approved_at       TIMESTAMPTZ,
    notified_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_leaderboard_payout UNIQUE (tenant_id, leaderboard_month, board_type, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_payouts_status
    ON leaderboard_payouts(tenant_id, leaderboard_month, approval_status);

-- Seed default game point rules (Figma 18/11)
WITH seed_tenants AS (
    SELECT code AS tenant_id FROM tenants
    UNION SELECT 'NATCASH'
    UNION SELECT 'TENANT_NATCASH'
    UNION SELECT 'TENANT_DELIMART'
)
INSERT INTO game_point_rules (
    tenant_id, source_code, board_type, formula_type, base_pts, score_divisor, max_pts_per_action, daily_cap_pts, status, description
)
SELECT t.tenant_id, r.source_code, r.board_type, r.formula_type, r.base_pts, r.score_divisor, r.max_pts_per_action, r.daily_cap_pts, 'ACTIVE', r.description
FROM seed_tenants t
CROSS JOIN (VALUES
    ('DAILY_CHALLENGE',          'ALL',        'FIXED',          150, 1,  150, 300,  'Daily challenge completed (+150 pts, capped at 300 pts/day)'),
    ('MINI_GAME',                'MINI_GAMES', 'PER_SCORE_UNIT',  20, 10, 200, 600,  'Mini game score converted to pts (score/10, min 20, max 200/play, cap 600 pts/day)'),
    ('LEARNING_LESSON',          'LEARNING',   'PER_SCORE_UNIT',  50, 1,  300, 900,  'Micro-learning lesson completed (100 pts per correct answer, cap 900 pts/day)'),
    ('CHECKIN_STREAK',           'ALL',        'FIXED',           80, 1,   80, 80,   'Daily play/learning streak bonus (+80 pts/day)'),
    ('LUCKY_GAME_PARTICIPATION', 'ALL',        'FIXED',           15, 1,   15, 75,   'Participation pts for wheel/scratch (max 75 pts/day; coin-purchased plays earn 0 pts)')
) AS r(source_code, board_type, formula_type, base_pts, score_divisor, max_pts_per_action, daily_cap_pts, description)
ON CONFLICT (tenant_id, source_code) DO NOTHING;

-- Seed default leaderboard prizes (Figma 18/11 GM-01 & GM-10)
WITH seed_tenants AS (
    SELECT code AS tenant_id FROM tenants
    UNION SELECT 'NATCASH'
    UNION SELECT 'TENANT_NATCASH'
    UNION SELECT 'TENANT_DELIMART'
)
INSERT INTO leaderboard_prizes (
    tenant_id, board_type, rank_from, rank_to, prize_type, prize_label, prize_value, voucher_code, sponsor_name, status
)
SELECT t.tenant_id, p.board_type, p.rank_from, p.rank_to, p.prize_type, p.prize_label, p.prize_value, p.voucher_code, p.sponsor_name, 'ACTIVE'
FROM seed_tenants t
CROSS JOIN (VALUES
    ('ALL', 1,   1,   'VOUCHER',         '10 GB 4G + Voucher 200 HTG',    200.00, 'VCH_LB_TOP1', 'Natcom & Delimart'),
    ('ALL', 2,   2,   'TELCO_DATA',      '5 GB 4G Data Pack',             100.00, NULL,          'Natcom'),
    ('ALL', 3,   3,   'VOUCHER',         'Voucher 100 HTG',               100.00, 'VCH_LB_TOP3', 'Delimart'),
    ('ALL', 4,   100, 'BADGE_AND_TURNS', 'Top 100 Badge + 1 free play/day', 0.00, NULL,          'Natcash Rewards')
) AS p(board_type, rank_from, rank_to, prize_type, prize_label, prize_value, voucher_code, sponsor_name)
WHERE NOT EXISTS (
    SELECT 1 FROM leaderboard_prizes lp
    WHERE lp.tenant_id = t.tenant_id AND lp.board_type = p.board_type AND lp.rank_from = p.rank_from
);
