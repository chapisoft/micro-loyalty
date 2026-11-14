-- ==============================================================================
-- FLYWAY MIGRATION V9: Bổ sung Bảng Theme Vòng Quay & Danh Mục 7 Trò Chơi Mới
-- ==============================================================================

-- 1. BẢNG QUẢN LÝ GIAO DIỆN CHỦ ĐỀ VÒNG QUAY (LOYALTY_WHEEL_THEMES)
CREATE TABLE IF NOT EXISTS loyalty_wheel_themes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    theme_code VARCHAR(50) NOT NULL,
    theme_name VARCHAR(100) NOT NULL,
    primary_color VARCHAR(30) NOT NULL DEFAULT '#E65100',
    secondary_color VARCHAR(30) NOT NULL DEFAULT '#FFD54F',
    accent_color VARCHAR(30) NOT NULL DEFAULT '#FFFFFF',
    background_url VARCHAR(500),
    pointer_url VARCHAR(500),
    center_button_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_wheel_theme UNIQUE (tenant_id, theme_code)
);

CREATE INDEX IF NOT EXISTS idx_wheel_themes_tenant ON loyalty_wheel_themes(tenant_id);

-- 2. BỔ SUNG CỘT THEME CHO BẢNG VÒNG QUAY (LOYALTY_LUCKY_WHEELS)
ALTER TABLE loyalty_lucky_wheels ADD COLUMN IF NOT EXISTS active_theme_code VARCHAR(50) NOT NULL DEFAULT 'THEME_DEFAULT';

-- 3. BỔ SUNG CỘT MÔ TẢ VÀ LUẬT CHƠI CHO BẢNG CỔNG GAME (LOYALTY_GAMES)
ALTER TABLE loyalty_games ADD COLUMN IF NOT EXISTS description VARCHAR(500);
ALTER TABLE loyalty_games ADD COLUMN IF NOT EXISTS rules_text TEXT;
ALTER TABLE loyalty_games ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500);

-- 4. KHỞI TẠO DỮ LIỆU GIAO DIỆN CHỦ ĐỀ MẶC ĐỊNH (THEMES)
INSERT INTO loyalty_wheel_themes (tenant_id, theme_code, theme_name, primary_color, secondary_color, accent_color, is_active)
VALUES
    ('TENANT_NATCASH', 'THEME_DEFAULT', 'Tiêu chuẩn Natcash Gold', '#E65100', '#FFD54F', '#FFFFFF', TRUE),
    ('TENANT_NATCASH', 'THEME_KANAVAL', 'Lễ hội Lửa Kanaval Haiti', '#D32F2F', '#FBC02D', '#7B1FA2', FALSE),
    ('TENANT_NATCASH', 'THEME_CARIBBEAN', 'Đêm Biển Đảo Caribe', '#00695C', '#00ACC1', '#80CBC4', FALSE),
    ('TENANT_NATCASH', 'THEME_HOLIDAY', 'Năm Mới & Giáng Sinh Rực Rỡ', '#C2185B', '#E91E63', '#FFF176', FALSE)
ON CONFLICT (tenant_id, theme_code) DO NOTHING;

-- 5. KHỞI TẠO DANH MỤC 7 TỰA TRÒ CHƠI MAY RỦI MỚI CHO TENANT_NATCASH
INSERT INTO loyalty_games (tenant_id, game_code, game_name, category, price_per_turn, free_turns_daily, daily_budget_limit, allow_points_spin, description, status)
VALUES
    ('TENANT_NATCASH', 'SCRATCH_CARD', 'Vé Cào May Mắn Siêu Tốc', 'INSTANT_WIN', 20.00, 1, 50000.00, TRUE, 'Cào 3 ô trúng liền tay, rinh ngay tiền thưởng ví và điểm thưởng Loyalty!', 'ACTIVE'),
    ('TENANT_NATCASH', 'PENALTY_SHOOTOUT', 'Sút Phạt Đền Cuồng Nhiệt', 'SPORTS_CHALLENGE', 30.00, 1, 60000.00, TRUE, 'Đấu trường penalty đỉnh cao 11m, ghi bàn hạ gục thủ môn nhận quà khủng!', 'ACTIVE'),
    ('TENANT_NATCASH', 'TREASURE_CHEST', 'Mở Rương Báu Vùng Biển Caribe', 'LUCKY_CHEST', 25.00, 1, 50000.00, TRUE, 'Chọn 1 trong các rương cổ chứa ngọc bích, tiền vàng và giải Nổ Hũ tuần!', 'ACTIVE'),
    ('TENANT_NATCASH', 'TOWER_CLIMB', 'Tháp Kho Báu May Mắn', 'ADVENTURE_RISK', 30.00, 1, 70000.00, TRUE, 'Leo tháp 5 tầng kịch tính, chọn leo tiếp nhân thưởng x50 hoặc dừng bảo toàn!', 'ACTIVE'),
    ('TENANT_NATCASH', 'PLINKO_DROP', 'Thả Bi Ziczac May Mắn', 'PHYSICS_LUCK', 20.00, 1, 40000.00, TRUE, 'Thả bóng qua mê cung bàn đinh neon, rớt hộc đáy nhân thưởng lên tới x100!', 'ACTIVE'),
    ('TENANT_NATCASH', 'GOLDEN_EGG', 'Đập Trứng Vàng May Mắn', 'SMASH_EGG', 15.00, 1, 30000.00, TRUE, '1 chạm gõ vỡ trứng vàng nhận phong bao lì xì tiền ví tức thì!', 'ACTIVE'),
    ('TENANT_NATCASH', 'LUCKY_DICE', 'Lắc Cốc Xúc Xắc Tài Lộc', 'DICE_BOARD', 20.00, 1, 40000.00, TRUE, 'Lắc 3 viên xúc xắc may mắn, tiến bước trên đường đua thám hiểm nhận quà!', 'ACTIVE')
ON CONFLICT (tenant_id, game_code) DO NOTHING;
