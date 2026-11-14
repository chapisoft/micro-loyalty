-- ==============================================================================
-- FLYWAY MIGRATION V10: Ma Trận Giải Thưởng Động & Cấu Hình Chi Tiết Cổng Game
-- ==============================================================================

-- 1. BẢNG QUẢN LÝ MA TRẬN GIẢI THƯỞNG ĐỘNG CHO TỪNG GAME (LOYALTY_GAME_PRIZES)
CREATE TABLE IF NOT EXISTS loyalty_game_prizes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    game_code VARCHAR(50) NOT NULL,
    prize_code VARCHAR(50) NOT NULL,
    prize_name VARCHAR(100) NOT NULL,
    prize_type VARCHAR(50) NOT NULL DEFAULT 'POINTS',
    prize_value DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    probability_weight INT NOT NULL DEFAULT 10,
    color_code VARCHAR(30),
    icon_symbol VARCHAR(50),
    display_order INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_game_prize UNIQUE (tenant_id, game_code, prize_code)
);

CREATE INDEX IF NOT EXISTS idx_game_prizes_tenant_game ON loyalty_game_prizes(tenant_id, game_code);
CREATE INDEX IF NOT EXISTS idx_game_prizes_status ON loyalty_game_prizes(status);

-- 2. KHỞI TẠO MA TRẬN GIẢI THƯỞNG CHO TỪNG GAME CỦA TENANT_NATCASH

-- 2.1. Vé Cào May Mắn (SCRATCH_CARD)
INSERT INTO loyalty_game_prizes (tenant_id, game_code, prize_code, prize_name, prize_type, prize_value, probability_weight, color_code, icon_symbol, display_order)
VALUES
    ('TENANT_NATCASH', 'SCRATCH_CARD', 'SCRATCH_GOLD', '3 Hòm Vàng Đại Thắng', 'POINTS', 100.00, 40, '#F59E0B', '👑', 1),
    ('TENANT_NATCASH', 'SCRATCH_CARD', 'SCRATCH_SILVER', '3 Đồng Bạc Thịnh Vượng', 'POINTS', 50.00, 30, '#94A3B8', '🪙', 2),
    ('TENANT_NATCASH', 'SCRATCH_CARD', 'SCRATCH_BRONZE', '3 Ngôi Sao Đồng', 'POINTS', 20.00, 20, '#D97706', '⭐', 3),
    ('TENANT_NATCASH', 'SCRATCH_CARD', 'SCRATCH_CONSOLATION', 'Điểm May Mắn Khích Lệ', 'POINTS', 5.00, 10, '#64748B', '✨', 4)
ON CONFLICT (tenant_id, game_code, prize_code) DO NOTHING;

-- 2.2. Sút Phạt Đền 11m (PENALTY_SHOOTOUT)
INSERT INTO loyalty_game_prizes (tenant_id, game_code, prize_code, prize_name, prize_type, prize_value, probability_weight, color_code, icon_symbol, display_order)
VALUES
    ('TENANT_NATCASH', 'PENALTY_SHOOTOUT', 'PENALTY_GOAL', 'Bàn Thắng Tuyệt Phẩm', 'POINTS', 80.00, 70, '#10B981', '⚽', 1),
    ('TENANT_NATCASH', 'PENALTY_SHOOTOUT', 'PENALTY_POST', 'Bóng Dội Xà Ngang', 'POINTS', 20.00, 15, '#F59E0B', '⚡', 2),
    ('TENANT_NATCASH', 'PENALTY_SHOOTOUT', 'PENALTY_SAVED', 'Thủ Môn Cản Phá An Ủi', 'POINTS', 10.00, 15, '#EF4444', '🧤', 3)
ON CONFLICT (tenant_id, game_code, prize_code) DO NOTHING;

-- 2.3. Mở Rương Báu Caribe (TREASURE_CHEST)
INSERT INTO loyalty_game_prizes (tenant_id, game_code, prize_code, prize_name, prize_type, prize_value, probability_weight, color_code, icon_symbol, display_order)
VALUES
    ('TENANT_NATCASH', 'TREASURE_CHEST', 'CHEST_JACKPOT', 'Nổ Hũ Ngọc Bích Đại Vương', 'POINTS', 200.00, 20, '#06B6D4', '💎', 1),
    ('TENANT_NATCASH', 'TREASURE_CHEST', 'CHEST_GOLD', 'Rương Vàng Cổ Đại', 'POINTS', 80.00, 40, '#F59E0B', '💰', 2),
    ('TENANT_NATCASH', 'TREASURE_CHEST', 'CHEST_SILVER', 'Rương Bạc Bí Ẩn', 'POINTS', 40.00, 30, '#94A3B8', '🏆', 3),
    ('TENANT_NATCASH', 'TREASURE_CHEST', 'CHEST_TRAP', 'Rương Bẫy Thám Hiểm', 'POINTS', 10.00, 10, '#64748B', '🗝️', 4)
ON CONFLICT (tenant_id, game_code, prize_code) DO NOTHING;

-- 2.4. Tháp Kho Báu May Mắn (TOWER_CLIMB)
INSERT INTO loyalty_game_prizes (tenant_id, game_code, prize_code, prize_name, prize_type, prize_value, probability_weight, color_code, icon_symbol, display_order)
VALUES
    ('TENANT_NATCASH', 'TOWER_CLIMB', 'TOWER_F1', 'Tầng 1 (Nhân x1.5)', 'MULTIPLIER', 1.50, 20, '#8B5CF6', '🏰', 1),
    ('TENANT_NATCASH', 'TOWER_CLIMB', 'TOWER_F2', 'Tầng 2 (Nhân x2.5)', 'MULTIPLIER', 2.50, 20, '#A855F7', '🏰', 2),
    ('TENANT_NATCASH', 'TOWER_CLIMB', 'TOWER_F3', 'Tầng 3 (Nhân x5.0)', 'MULTIPLIER', 5.00, 20, '#C084FC', '🏰', 3),
    ('TENANT_NATCASH', 'TOWER_CLIMB', 'TOWER_F4', 'Tầng 4 (Nhân x10.0)', 'MULTIPLIER', 10.00, 20, '#E879F9', '🏰', 4),
    ('TENANT_NATCASH', 'TOWER_CLIMB', 'TOWER_F5', 'Đỉnh Tháp (Nhân x50.0)', 'MULTIPLIER', 50.00, 20, '#F43F5E', '👑', 5)
ON CONFLICT (tenant_id, game_code, prize_code) DO NOTHING;

-- 2.5. Thả Bi Ziczac Plinko (PLINKO_DROP)
INSERT INTO loyalty_game_prizes (tenant_id, game_code, prize_code, prize_name, prize_type, prize_value, probability_weight, color_code, icon_symbol, display_order)
VALUES
    ('TENANT_NATCASH', 'PLINKO_DROP', 'PLINKO_BIN_0', 'Hộc Siêu Cực Biên x10', 'MULTIPLIER', 10.00, 5, '#EC4899', '🔥', 1),
    ('TENANT_NATCASH', 'PLINKO_DROP', 'PLINKO_BIN_1', 'Hộc Cận Biên x5', 'MULTIPLIER', 5.00, 10, '#8B5CF6', '⚡', 2),
    ('TENANT_NATCASH', 'PLINKO_DROP', 'PLINKO_BIN_2', 'Hộc Khá x2', 'MULTIPLIER', 2.00, 15, '#3B82F6', '✨', 3),
    ('TENANT_NATCASH', 'PLINKO_DROP', 'PLINKO_BIN_3', 'Hộc Trung Bình x1', 'MULTIPLIER', 1.00, 20, '#06B6D4', '⭐', 4),
    ('TENANT_NATCASH', 'PLINKO_DROP', 'PLINKO_BIN_4', 'Hộc Tâm x0.5', 'MULTIPLIER', 0.50, 20, '#64748B', '⚪', 5),
    ('TENANT_NATCASH', 'PLINKO_DROP', 'PLINKO_BIN_5', 'Hộc Trung Bình x1', 'MULTIPLIER', 1.00, 20, '#06B6D4', '⭐', 6),
    ('TENANT_NATCASH', 'PLINKO_DROP', 'PLINKO_BIN_6', 'Hộc Khá x2', 'MULTIPLIER', 2.00, 15, '#3B82F6', '✨', 7),
    ('TENANT_NATCASH', 'PLINKO_DROP', 'PLINKO_BIN_7', 'Hộc Cận Biên x5', 'MULTIPLIER', 5.00, 10, '#8B5CF6', '⚡', 8),
    ('TENANT_NATCASH', 'PLINKO_DROP', 'PLINKO_BIN_8', 'Hộc Siêu Cực Biên x10', 'MULTIPLIER', 10.00, 5, '#EC4899', '🔥', 9)
ON CONFLICT (tenant_id, game_code, prize_code) DO NOTHING;

-- 2.6. Đập Trứng Vàng (GOLDEN_EGG)
INSERT INTO loyalty_game_prizes (tenant_id, game_code, prize_code, prize_name, prize_type, prize_value, probability_weight, color_code, icon_symbol, display_order)
VALUES
    ('TENANT_NATCASH', 'GOLDEN_EGG', 'EGG_MEGA', 'Siêu Trứng Vàng Thần Tài', 'POINTS', 150.00, 15, '#F59E0B', '🐣', 1),
    ('TENANT_NATCASH', 'GOLDEN_EGG', 'EGG_BLOOM', 'Trứng Vàng Nở Hoa Phát Lộc', 'POINTS', 75.00, 35, '#EC4899', '🌸', 2),
    ('TENANT_NATCASH', 'GOLDEN_EGG', 'EGG_RED_PACKET', 'Phong Bao Lì Xì May Mắn', 'POINTS', 35.00, 35, '#EF4444', '🧧', 3),
    ('TENANT_NATCASH', 'GOLDEN_EGG', 'EGG_CHICK', 'Gà Con Khuyến Khích', 'POINTS', 15.00, 15, '#10B981', '🐤', 4)
ON CONFLICT (tenant_id, game_code, prize_code) DO NOTHING;

-- 2.7. Lắc Xúc Xắc Tài Lộc (LUCKY_DICE)
INSERT INTO loyalty_game_prizes (tenant_id, game_code, prize_code, prize_name, prize_type, prize_value, probability_weight, color_code, icon_symbol, display_order)
VALUES
    ('TENANT_NATCASH', 'LUCKY_DICE', 'DICE_TRIPLE', 'Siêu Bộ Ba Đồng Nhất', 'POINTS', 300.00, 10, '#8B5CF6', '🎲', 1),
    ('TENANT_NATCASH', 'LUCKY_DICE', 'DICE_STRAIGHT', 'Sảnh Tiến May Mắn', 'POINTS', 150.00, 20, '#EC4899', '📈', 2),
    ('TENANT_NATCASH', 'LUCKY_DICE', 'DICE_PAIR', 'Đôi Xúc Xắc Tài Lộc', 'POINTS', 60.00, 30, '#F59E0B', '🎯', 3),
    ('TENANT_NATCASH', 'LUCKY_DICE', 'DICE_SUM', 'Tổng Nút Xúc Xắc (x5)', 'POINTS', 35.00, 40, '#10B981', '⭐', 4)
ON CONFLICT (tenant_id, game_code, prize_code) DO NOTHING;

-- 2.8. Đố Vui Nhanh Trí (TRIVIA_QUIZ)
INSERT INTO loyalty_game_prizes (tenant_id, game_code, prize_code, prize_name, prize_type, prize_value, probability_weight, color_code, icon_symbol, display_order)
VALUES
    ('TENANT_NATCASH', 'TRIVIA_QUIZ', 'QUIZ_PERFECT', 'Quán Quân Thông Thái (5/5)', 'POINTS', 150.00, 30, '#3B82F6', '🧠', 1),
    ('TENANT_NATCASH', 'TRIVIA_QUIZ', 'QUIZ_EXCELLENT', 'Xuất Sắc Nhanh Trí (4/5)', 'POINTS', 100.00, 40, '#10B981', '💡', 2),
    ('TENANT_NATCASH', 'TRIVIA_QUIZ', 'QUIZ_GOOD', 'Đạt Chuẩn Thử Thách (3/5)', 'POINTS', 50.00, 30, '#F59E0B', '✨', 3)
ON CONFLICT (tenant_id, game_code, prize_code) DO NOTHING;
