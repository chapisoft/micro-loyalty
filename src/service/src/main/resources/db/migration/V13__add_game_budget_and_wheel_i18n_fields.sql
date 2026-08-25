-- V13__add_game_budget_and_wheel_i18n_fields.sql
-- Bổ sung hạn mức ngân sách Ngày / Tuần / Tháng và hiển thị đa ngôn ngữ, hình ảnh nan quạt

-- 1. BẢNG Ô THƯỞNG VÒNG QUAY (LOYALTY_WHEEL_PRIZES)
ALTER TABLE loyalty_wheel_prizes
    ADD COLUMN IF NOT EXISTS weekly_budget_limit DECIMAL(18,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS monthly_budget_limit DECIMAL(18,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS daily_max_winners INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS weekly_max_winners INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS monthly_max_winners INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS name_vi VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS name_en VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS name_ht VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS bg_image_url VARCHAR(500) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS icon_symbol VARCHAR(50) DEFAULT '🎁';

-- 2. BẢNG MA TRẬN GIẢI THƯỞNG CÁC TRÒ CHƠI (LOYALTY_GAME_PRIZES)
ALTER TABLE loyalty_game_prizes
    ADD COLUMN IF NOT EXISTS daily_budget_limit DECIMAL(18,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS weekly_budget_limit DECIMAL(18,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS monthly_budget_limit DECIMAL(18,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS daily_max_winners INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS weekly_max_winners INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS monthly_max_winners INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS name_vi VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS name_en VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS name_ht VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS bg_image_url VARCHAR(500) DEFAULT NULL;

-- 3. CẬP NHẬT DỮ LIỆU ĐA NGÔN NGỮ & BIỂU TƯỢNG CHO CÁC Ô VÒNG QUAY HIỆN CÓ
UPDATE loyalty_wheel_prizes
SET 
    name_vi = COALESCE(name_vi, prize_name),
    name_en = CASE 
        WHEN prize_type = 'POINTS' THEN CONCAT(prize_value::text, ' Bonus Points')
        WHEN prize_type = 'TURNS' THEN CONCAT(prize_value::text, ' Extra Turns')
        WHEN prize_type = 'VOUCHER' THEN 'Voucher 50 HTG'
        WHEN prize_type = 'CASHBACK' THEN '100 HTG Cashback'
        ELSE 'Lucky Next Time'
    END,
    name_fr = CASE 
        WHEN prize_type = 'POINTS' THEN CONCAT(prize_value::text, ' Points Bonus')
        WHEN prize_type = 'TURNS' THEN CONCAT(prize_value::text, ' Tours Gratuits')
        WHEN prize_type = 'VOUCHER' THEN 'Bon 50 HTG'
        WHEN prize_type = 'CASHBACK' THEN '100 HTG Remboursement'
        ELSE 'Bonne Chance'
    END,
    name_ht = CASE 
        WHEN prize_type = 'POINTS' THEN CONCAT(prize_value::text, ' Pwen Kado')
        WHEN prize_type = 'TURNS' THEN CONCAT(prize_value::text, ' Chans Anplis')
        WHEN prize_type = 'VOUCHER' THEN 'Koupon 50 HTG'
        WHEN prize_type = 'CASHBACK' THEN '100 HTG Kachbek'
        ELSE 'Bon Chans Pwochenn Fwa'
    END,
    icon_symbol = CASE 
        WHEN prize_type = 'POINTS' THEN '⭐'
        WHEN prize_type = 'TURNS' THEN '⚡'
        WHEN prize_type = 'VOUCHER' THEN '🎟️'
        WHEN prize_type = 'CASHBACK' THEN '💵'
        ELSE '🍀'
    END
WHERE name_vi IS NULL OR icon_symbol IS NULL;

-- 4. CẬP NHẬT DỮ LIỆU ĐA NGÔN NGỮ CHO CÁC GIẢI THƯỞNG GAME HIỆN CÓ
UPDATE loyalty_game_prizes
SET 
    name_vi = COALESCE(name_vi, prize_name),
    name_en = CASE 
        WHEN prize_type = 'POINTS' THEN CONCAT(prize_value::text, ' Points')
        WHEN prize_type = 'TURNS' THEN CONCAT(prize_value::text, ' Free Turns')
        WHEN prize_type = 'VOUCHER' THEN 'Voucher Discount'
        ELSE 'Try Again'
    END,
    name_fr = CASE 
        WHEN prize_type = 'POINTS' THEN CONCAT(prize_value::text, ' Points')
        WHEN prize_type = 'TURNS' THEN CONCAT(prize_value::text, ' Tours Gratuits')
        WHEN prize_type = 'VOUCHER' THEN 'Bon de Réduction'
        ELSE 'Réessayez'
    END,
    name_ht = CASE 
        WHEN prize_type = 'POINTS' THEN CONCAT(prize_value::text, ' Pwen')
        WHEN prize_type = 'TURNS' THEN CONCAT(prize_value::text, ' Chans Grati')
        WHEN prize_type = 'VOUCHER' THEN 'Koupon Rabè'
        ELSE 'Eseye Ankò'
    END
WHERE name_vi IS NULL;
