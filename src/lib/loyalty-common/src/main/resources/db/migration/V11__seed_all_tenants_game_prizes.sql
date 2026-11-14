-- ==============================================================================
-- FLYWAY MIGRATION V11: Seed Game Catalog & Prize Matrix For All Tenants
-- ==============================================================================

-- 1. KHỞI TẠO 8 TỰA GAME CHO TENANT_DELIMART & TENANT_MICRO_CRM
INSERT INTO loyalty_games (tenant_id, game_code, game_name, category, price_per_turn, free_turns_daily, daily_budget_limit, allow_points_spin, description, status)
VALUES
    ('TENANT_DELIMART', 'SCRATCH_CARD', 'Vé Cào May Mắn Siêu Tốc', 'INSTANT_WIN', 20.00, 1, 50000.00, TRUE, 'Cào 3 ô trúng liền tay, rinh ngay tiền thưởng ví và điểm thưởng Loyalty!', 'ACTIVE'),
    ('TENANT_DELIMART', 'PENALTY_SHOOTOUT', 'Sút Phạt Đền Cuồng Nhiệt', 'SPORTS_CHALLENGE', 30.00, 1, 60000.00, TRUE, 'Đấu trường penalty đỉnh cao 11m, ghi bàn hạ gục thủ môn nhận quà khủng!', 'ACTIVE'),
    ('TENANT_DELIMART', 'TREASURE_CHEST', 'Mở Rương Báu Vùng Biển Caribe', 'LUCKY_CHEST', 25.00, 1, 50000.00, TRUE, 'Chọn 1 trong các rương cổ chứa ngọc bích, tiền vàng và giải Nổ Hũ tuần!', 'ACTIVE'),
    ('TENANT_DELIMART', 'TOWER_CLIMB', 'Tháp Kho Báu May Mắn', 'ADVENTURE_RISK', 30.00, 1, 70000.00, TRUE, 'Leo tháp 5 tầng kịch tính, chọn leo tiếp nhân thưởng x50 hoặc dừng bảo toàn!', 'ACTIVE'),
    ('TENANT_DELIMART', 'PLINKO_DROP', 'Thả Bi Ziczac May Mắn', 'PHYSICS_LUCK', 20.00, 1, 40000.00, TRUE, 'Thả bóng qua mê cung bàn đinh neon, rớt hộc đáy nhân thưởng lên tới x100!', 'ACTIVE'),
    ('TENANT_DELIMART', 'GOLDEN_EGG', 'Đập Trứng Vàng May Mắn', 'SMASH_EGG', 15.00, 1, 30000.00, TRUE, '1 chạm gõ vỡ trứng vàng nhận phong bao lì xì tiền ví tức thì!', 'ACTIVE'),
    ('TENANT_DELIMART', 'LUCKY_DICE', 'Lắc Cốc Xúc Xắc Tài Lộc', 'DICE_BOARD', 20.00, 1, 40000.00, TRUE, 'Lắc 3 viên xúc xắc may mắn, tiến bước trên đường đua thám hiểm nhận quà!', 'ACTIVE'),
    ('TENANT_DELIMART', 'TRIVIA_QUIZ', 'Đố Vui Trí Tuệ Săn Quà', 'KNOWLEDGE', 10.00, 1, 30000.00, TRUE, 'Thử tài hiểu biết về hệ sinh thái tích điểm đổi quà nhận ngàn điểm thưởng!', 'ACTIVE'),

    ('TENANT_MICRO_CRM', 'SCRATCH_CARD', 'Vé Cào May Mắn Siêu Tốc', 'INSTANT_WIN', 20.00, 1, 50000.00, TRUE, 'Cào 3 ô trúng liền tay, rinh ngay tiền thưởng ví và điểm thưởng Loyalty!', 'ACTIVE'),
    ('TENANT_MICRO_CRM', 'PENALTY_SHOOTOUT', 'Sút Phạt Đền Cuồng Nhiệt', 'SPORTS_CHALLENGE', 30.00, 1, 60000.00, TRUE, 'Đấu trường penalty đỉnh cao 11m, ghi bàn hạ gục thủ môn nhận quà khủng!', 'ACTIVE'),
    ('TENANT_MICRO_CRM', 'TREASURE_CHEST', 'Mở Rương Báu Vùng Biển Caribe', 'LUCKY_CHEST', 25.00, 1, 50000.00, TRUE, 'Chọn 1 trong các rương cổ chứa ngọc bích, tiền vàng và giải Nổ Hũ tuần!', 'ACTIVE'),
    ('TENANT_MICRO_CRM', 'TOWER_CLIMB', 'Tháp Kho Báu May Mắn', 'ADVENTURE_RISK', 30.00, 1, 70000.00, TRUE, 'Leo tháp 5 tầng kịch tính, chọn leo tiếp nhân thưởng x50 hoặc dừng bảo toàn!', 'ACTIVE'),
    ('TENANT_MICRO_CRM', 'PLINKO_DROP', 'Thả Bi Ziczac May Mắn', 'PHYSICS_LUCK', 20.00, 1, 40000.00, TRUE, 'Thả bóng qua mê cung bàn đinh neon, rớt hộc đáy nhân thưởng lên tới x100!', 'ACTIVE'),
    ('TENANT_MICRO_CRM', 'GOLDEN_EGG', 'Đập Trứng Vàng May Mắn', 'SMASH_EGG', 15.00, 1, 30000.00, TRUE, '1 chạm gõ vỡ trứng vàng nhận phong bao lì xì tiền ví tức thì!', 'ACTIVE'),
    ('TENANT_MICRO_CRM', 'LUCKY_DICE', 'Lắc Cốc Xúc Xắc Tài Lộc', 'DICE_BOARD', 20.00, 1, 40000.00, TRUE, 'Lắc 3 viên xúc xắc may mắn, tiến bước trên đường đua thám hiểm nhận quà!', 'ACTIVE'),
    ('TENANT_MICRO_CRM', 'TRIVIA_QUIZ', 'Đố Vui Trí Tuệ Săn Quà', 'KNOWLEDGE', 10.00, 1, 30000.00, TRUE, 'Thử tài hiểu biết về hệ sinh thái tích điểm đổi quà nhận ngàn điểm thưởng!', 'ACTIVE')
ON CONFLICT (tenant_id, game_code) DO NOTHING;

-- 2. KHỞI TẠO MA TRẬN GIẢI THƯỞNG CHO TENANT_DELIMART
INSERT INTO loyalty_game_prizes (tenant_id, game_code, prize_code, prize_name, prize_type, prize_value, probability_weight, color_code, icon_symbol, display_order)
VALUES
    ('TENANT_DELIMART', 'SCRATCH_CARD', 'SCRATCH_GOLD', '3 Hòm Vàng Đại Thắng', 'POINTS', 100.00, 40, '#F59E0B', '👑', 1),
    ('TENANT_DELIMART', 'SCRATCH_CARD', 'SCRATCH_SILVER', '3 Đồng Bạc Thịnh Vượng', 'POINTS', 50.00, 30, '#94A3B8', '🪙', 2),
    ('TENANT_DELIMART', 'SCRATCH_CARD', 'SCRATCH_BRONZE', '3 Ngôi Sao Đồng', 'POINTS', 20.00, 20, '#D97706', '⭐', 3),
    ('TENANT_DELIMART', 'SCRATCH_CARD', 'SCRATCH_CONSOLATION', 'Điểm May Mắn Khích Lệ', 'POINTS', 5.00, 10, '#64748B', '✨', 4),

    ('TENANT_DELIMART', 'PENALTY_SHOOTOUT', 'PENALTY_GOAL', 'Bàn Thắng Tuyệt Phẩm', 'POINTS', 80.00, 70, '#10B981', '⚽', 1),
    ('TENANT_DELIMART', 'PENALTY_SHOOTOUT', 'PENALTY_POST', 'Bóng Dội Xà Ngang', 'POINTS', 20.00, 15, '#F59E0B', '⚡', 2),
    ('TENANT_DELIMART', 'PENALTY_SHOOTOUT', 'PENALTY_SAVED', 'Thủ Môn Cản Phá An Ủi', 'POINTS', 10.00, 15, '#EF4444', '🧤', 3),

    ('TENANT_DELIMART', 'TREASURE_CHEST', 'CHEST_JACKPOT', 'Nổ Hũ Ngọc Bích Đại Vương', 'POINTS', 200.00, 20, '#06B6D4', '💎', 1),
    ('TENANT_DELIMART', 'TREASURE_CHEST', 'CHEST_GOLD', 'Rương Vàng Cổ Đại', 'POINTS', 80.00, 40, '#F59E0B', '💰', 2),
    ('TENANT_DELIMART', 'TREASURE_CHEST', 'CHEST_SILVER', 'Rương Bạc Bí Ẩn', 'POINTS', 40.00, 30, '#94A3B8', '🏆', 3),
    ('TENANT_DELIMART', 'TREASURE_CHEST', 'CHEST_TRAP', 'Rương Bẫy Thám Hiểm', 'POINTS', 10.00, 10, '#64748B', '🗝️', 4),

    ('TENANT_DELIMART', 'TOWER_CLIMB', 'TOWER_F1', 'Tầng 1 (Nhân x1.5)', 'MULTIPLIER', 1.50, 20, '#8B5CF6', '🏰', 1),
    ('TENANT_DELIMART', 'TOWER_CLIMB', 'TOWER_F2', 'Tầng 2 (Nhân x2.5)', 'MULTIPLIER', 2.50, 20, '#A855F7', '🏰', 2),
    ('TENANT_DELIMART', 'TOWER_CLIMB', 'TOWER_F3', 'Tầng 3 (Nhân x5.0)', 'MULTIPLIER', 5.00, 20, '#C084FC', '🏰', 3),
    ('TENANT_DELIMART', 'TOWER_CLIMB', 'TOWER_F4', 'Tầng 4 (Nhân x10.0)', 'MULTIPLIER', 10.00, 20, '#E879F9', '🏰', 4),
    ('TENANT_DELIMART', 'TOWER_CLIMB', 'TOWER_F5', 'Đỉnh Tháp Kim Cương (Nhân x50.0)', 'MULTIPLIER', 50.00, 20, '#F43F5E', '👑', 5),

    ('TENANT_DELIMART', 'PLINKO_DROP', 'PLINKO_JACKPOT', 'Hộc Đáy Kim Cương x10', 'MULTIPLIER', 10.00, 10, '#F59E0B', '💎', 1),
    ('TENANT_DELIMART', 'PLINKO_DROP', 'PLINKO_HIGH', 'Hộc Đáy Vàng x5', 'MULTIPLIER', 5.00, 20, '#EC4899', '🔥', 2),
    ('TENANT_DELIMART', 'PLINKO_DROP', 'PLINKO_MID', 'Hộc Đáy Bạc x2', 'MULTIPLIER', 2.00, 30, '#8B5CF6', '✨', 3),
    ('TENANT_DELIMART', 'PLINKO_DROP', 'PLINKO_BASE', 'Hộc Đáy Cơ Bản x1', 'MULTIPLIER', 1.00, 40, '#64748B', '⚪', 4),

    ('TENANT_DELIMART', 'GOLDEN_EGG', 'EGG_GOD_OF_WEALTH', 'Trứng Vàng Thần Tài', 'POINTS', 150.00, 15, '#F59E0B', '👑', 1),
    ('TENANT_DELIMART', 'GOLDEN_EGG', 'EGG_BLOOMING', 'Trứng Vàng Nở Hoa', 'POINTS', 75.00, 25, '#EC4899', '🌸', 2),
    ('TENANT_DELIMART', 'GOLDEN_EGG', 'EGG_RED_PACKET', 'Trứng Vàng Lì Xì', 'POINTS', 35.00, 35, '#EF4444', '🧧', 3),
    ('TENANT_DELIMART', 'GOLDEN_EGG', 'EGG_CHICK', 'Trứng Gà Con Khởi Đầu', 'POINTS', 15.00, 25, '#F97316', '🐣', 4),

    ('TENANT_DELIMART', 'LUCKY_DICE', 'DICE_TRIPLE', 'Siêu Bộ Ba Đồng Nhất', 'POINTS', 300.00, 10, '#F59E0B', '🎲', 1),
    ('TENANT_DELIMART', 'LUCKY_DICE', 'DICE_STRAIGHT', 'Bộ Sảnh Tiến Liên Hoàn', 'POINTS', 150.00, 20, '#8B5CF6', '🏆', 2),
    ('TENANT_DELIMART', 'LUCKY_DICE', 'DICE_PAIR', 'Cặp Đôi Song Hỷ', 'POINTS', 60.00, 30, '#06B6D4', '⭐', 3),
    ('TENANT_DELIMART', 'LUCKY_DICE', 'DICE_SUM', 'Điểm Theo Tổng Nút', 'POINTS', 20.00, 40, '#64748B', '✨', 4),

    ('TENANT_DELIMART', 'TRIVIA_QUIZ', 'QUIZ_PERFECT', 'Quán Quân 5/5 Câu Đúng', 'POINTS', 150.00, 25, '#F59E0B', '🏆', 1),
    ('TENANT_DELIMART', 'TRIVIA_QUIZ', 'QUIZ_GREAT', 'Xuất Sắc 4/5 Câu Đúng', 'POINTS', 100.00, 35, '#8B5CF6', '⭐', 2),
    ('TENANT_DELIMART', 'TRIVIA_QUIZ', 'QUIZ_PASS', 'Đạt Chuẩn 3/5 Câu Đúng', 'POINTS', 50.00, 25, '#06B6D4', '✨', 3),
    ('TENANT_DELIMART', 'TRIVIA_QUIZ', 'QUIZ_TRY', 'Khích Lệ Tham Gia', 'POINTS', 10.00, 15, '#64748B', '💡', 4)
ON CONFLICT (tenant_id, game_code, prize_code) DO NOTHING;
