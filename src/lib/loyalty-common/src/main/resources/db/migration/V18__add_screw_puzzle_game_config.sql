-- ==============================================================================
-- FLYWAY MIGRATION V17: Bổ sung Cấu hình Trò chơi Tháo Ốc Vít & Xếp Hình Tangram
-- ==============================================================================

INSERT INTO loyalty_games (
    tenant_id,
    game_code,
    game_name,
    category,
    price_per_turn,
    free_turns_daily,
    daily_budget_limit,
    allow_points_spin,
    description,
    rules_text,
    icon_url,
    banner_url,
    game_url,
    game_params,
    status
)
VALUES
    (
        'TENANT_NATCASH',
        'SCREW_PUZZLE',
        'Tháo Ốc Vít Xếp Hình Tangram',
        'PUZZLE',
        20.00,
        1,
        50000.00,
        TRUE,
        'Gỡ ốc vít kim loại, thả rơi các tấm acrylic màu sắc và hoàn thiện các biểu tượng văn hóa Kanaval Haiti để nhận điểm thưởng lớn!',
        '1. Người chơi có 60 giây cho mỗi màn để tháo toàn bộ ốc vít trên các thanh.\n2. Di chuyển ốc vít vào lỗ trống cùng màu hoặc các lỗ chờ dự phòng.\n3. Khi một thanh được tháo hết ốc, thanh sẽ tự động rơi và lắp ghép vào hình tượng Tangram mục tiêu.\n4. Hoàn thành 5 màn liên tiếp để nhận trọn bộ Điểm Thưởng Khủng từ Natcash!',
        '/assets/games/screw-puzzle-icon.png',
        '/assets/games/screw-puzzle-banner.png',
        '/games/screw-puzzle',
        '{
            "targetTimeSeconds": 60,
            "totalStagesPerSession": 5,
            "defaultTheme": "GOLD_CARIBBEAN",
            "stage1Reward": 20,
            "stage2Reward": 40,
            "stage3Reward": 60,
            "stage4Reward": 80,
            "stage5Reward": 100,
            "turnSinglePoints": 50,
            "turnTriplePoints": 120,
            "hintPoints": 20,
            "extraHolePoints": 30
        }'::jsonb,
        'ACTIVE'
    ),
    (
        'TENANT_DELIMART',
        'SCREW_PUZZLE',
        'Tháo Ốc Vít Xếp Hình Tangram Delimart',
        'PUZZLE',
        20.00,
        1,
        50000.00,
        TRUE,
        'Thử thách trí tuệ gỡ ốc vít nhận ngay điểm thưởng mua sắm thả ga tại Siêu thị Delimart!',
        '1. Tháo toàn bộ ốc vít trên các thanh trong 60 giây mỗi màn.\n2. Lắp ráp đủ 5 hình Tangram để rinh điểm thưởng mua hàng tại Delimart.',
        '/assets/games/screw-puzzle-icon.png',
        '/assets/games/screw-puzzle-banner.png',
        '/games/screw-puzzle',
        '{
            "targetTimeSeconds": 60,
            "totalStagesPerSession": 5,
            "defaultTheme": "GOLD_CARIBBEAN",
            "stage1Reward": 20,
            "stage2Reward": 40,
            "stage3Reward": 60,
            "stage4Reward": 80,
            "stage5Reward": 100,
            "turnSinglePoints": 50,
            "turnTriplePoints": 120,
            "hintPoints": 20,
            "extraHolePoints": 30
        }'::jsonb,
        'ACTIVE'
    )
ON CONFLICT (tenant_id, game_code) DO UPDATE SET
    game_name = EXCLUDED.game_name,
    category = EXCLUDED.category,
    price_per_turn = EXCLUDED.price_per_turn,
    free_turns_daily = EXCLUDED.free_turns_daily,
    daily_budget_limit = EXCLUDED.daily_budget_limit,
    allow_points_spin = EXCLUDED.allow_points_spin,
    description = EXCLUDED.description,
    rules_text = EXCLUDED.rules_text,
    game_params = EXCLUDED.game_params,
    status = EXCLUDED.status;
