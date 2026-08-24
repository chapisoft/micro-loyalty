-- ==============================================================================
-- FLYWAY MIGRATION SCRIPT: V6__seed_initial_enterprise_data.sql
-- Nạp Dữ Liệu Hạt Giống Chuẩn Hóa Khởi Đầu Cho Hệ Sinh Thái micro-loyalty
-- Cơ sở dữ liệu: PostgreSQL 15+ (loyalty_db)
-- ==============================================================================

-- 1. SEED TENANTS
INSERT INTO tenants (code, name, api_key, secret_key, webhook_url, status)
VALUES 
('TENANT_DELIMART', 'Hệ Sinh Thái Bán Lẻ Delimart & Natcash', 'API_KEY_DELIMART_2026', 'SECRET_KEY_DELIMART_XYZ', 'http://api.mid.io.vn/webhook', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- 2. SEED PARTNERS
INSERT INTO loyalty_partners (tenant_id, partner_code, partner_name, partner_type, api_key, secret_key, status)
VALUES 
('TENANT_DELIMART', 'DELIMART', 'Siêu Thị Delimart Supermarket', 'RETAIL', 'KEY_PARTNER_DELIMART', 'SEC_DELIMART_888', 'ACTIVE'),
('TENANT_DELIMART', 'NATCOM', 'Tổng Công Ty Viễn Thông Natcom', 'TELECOM', 'KEY_PARTNER_NATCOM', 'SEC_NATCOM_999', 'ACTIVE'),
('TENANT_DELIMART', 'RINGME', 'Cổng Dịch Vụ Số Ringme Entertainment', 'F_AND_B', 'KEY_PARTNER_RINGME', 'SEC_RINGME_777', 'ACTIVE'),
('TENANT_DELIMART', 'NATCASH_WALLET', 'Ví Điện Tử Natcash Haïti', 'BANKING', 'KEY_PARTNER_NATCASH', 'SEC_NATCASH_666', 'ACTIVE')
ON CONFLICT (tenant_id, partner_code) DO NOTHING;

-- 3. SEED LOYALTY TIERS
INSERT INTO loyalty_tiers (tenant_id, code, name, tier_level, min_points, point_multiplier, free_daily_turns, description, status)
VALUES 
('TENANT_DELIMART', 'SILVER', 'Hạng Bạc', 1, 0.00, 1.00, 1, 'Hạng hội viên khởi đầu khi đăng ký tài khoản', 'ACTIVE'),
('TENANT_DELIMART', 'GOLD', 'Hạng Vàng', 2, 1000.00, 1.20, 2, 'Tích lũy từ 1.000 điểm trong chu kỳ 12 tháng', 'ACTIVE'),
('TENANT_DELIMART', 'PLATINUM', 'Hạng Bạch Kim', 3, 5000.00, 1.50, 3, 'Tích lũy từ 5.000 điểm trong chu kỳ 12 tháng', 'ACTIVE'),
('TENANT_DELIMART', 'DIAMOND', 'Hạng Kim Cương', 4, 20000.00, 2.00, 5, 'Hội viên VIP đặc quyền cao cấp nhất', 'ACTIVE')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- 4. SEED ACCEPTANCE POLICIES
INSERT INTO loyalty_acceptance_policies (tenant_id, partner_id, point_exchange_rate, max_burn_percentage, min_burn_points, max_burn_points_per_day, status)
SELECT 
    'TENANT_DELIMART',
    p.id,
    1.0000,
    50.00,
    10.00,
    10000.00,
    'ACTIVE'
FROM loyalty_partners p
WHERE p.tenant_id = 'TENANT_DELIMART' AND p.partner_code = 'DELIMART'
ON CONFLICT (tenant_id, partner_id) DO NOTHING;

-- 5. SEED VOUCHERS
INSERT INTO loyalty_vouchers (tenant_id, partner_id, voucher_code, title, description, discount_type, discount_value, min_bill_amount, total_quantity, available_quantity, point_cost, start_date, end_date, status)
SELECT 
    'TENANT_DELIMART',
    p.id,
    'DELIMART-50K-9X8Z',
    'Phiếu Giảm 50 HTG Tại Siêu Thị Delimart',
    'Áp dụng tại tất cả các điểm bán của Delimart trên toàn quốc.',
    'FIXED_AMOUNT',
    50.00,
    200.00,
    1000,
    950,
    50.00,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '90 days',
    'ACTIVE'
FROM loyalty_partners p WHERE p.partner_code = 'DELIMART'
ON CONFLICT (tenant_id, voucher_code) DO NOTHING;

INSERT INTO loyalty_vouchers (tenant_id, partner_id, voucher_code, title, description, discount_type, discount_value, min_bill_amount, total_quantity, available_quantity, point_cost, start_date, end_date, status)
SELECT 
    'TENANT_DELIMART',
    p.id,
    'NATCOM-10PCT-7B2C',
    'Chiết Khấu 10% Khi Nạp Tiền Natcom',
    'Áp dụng khi nạp thẻ điện thoại hoặc đăng ký gói cước 4G Natcom.',
    'PERCENTAGE',
    10.00,
    100.00,
    5000,
    4800,
    30.00,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '90 days',
    'ACTIVE'
FROM loyalty_partners p WHERE p.partner_code = 'NATCOM'
ON CONFLICT (tenant_id, voucher_code) DO NOTHING;

INSERT INTO loyalty_vouchers (tenant_id, partner_id, voucher_code, title, description, discount_type, discount_value, min_bill_amount, total_quantity, available_quantity, point_cost, start_date, end_date, status)
SELECT 
    'TENANT_DELIMART',
    p.id,
    'DELIMART-20K-1A4F',
    'Phiếu Giảm 20 HTG Mua Sắm Bánh Kẹo',
    'Áp dụng cho ngành hàng thực phẩm & đồ uống tại Delimart.',
    'FIXED_AMOUNT',
    20.00,
    100.00,
    2000,
    1920,
    20.00,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '90 days',
    'ACTIVE'
FROM loyalty_partners p WHERE p.partner_code = 'DELIMART'
ON CONFLICT (tenant_id, voucher_code) DO NOTHING;

-- 6. SEED CAMPAIGN MILESTONES
INSERT INTO loyalty_campaign_milestones (tenant_id, campaign_code, campaign_name, milestone_step, target_metric, target_value, reward_points, start_date, end_date, status)
VALUES 
('TENANT_DELIMART', 'GOLDEN_WEEK', 'Tuần Lễ Vàng Mua Sắm', 1, 'TRANSACTION_COUNT', 1.00, 20.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE'),
('TENANT_DELIMART', 'GOLDEN_WEEK', 'Tuần Lễ Vàng Mua Sắm', 2, 'BILL_AMOUNT', 500.00, 100.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE'),
('TENANT_DELIMART', 'GOLDEN_WEEK', 'Tuần Lễ Vàng Mua Sắm', 3, 'BILL_AMOUNT', 200.00, 50.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE'),
('TENANT_DELIMART', 'GOLDEN_WEEK', 'Tuần Lễ Vàng Mua Sắm', 4, 'TRANSACTION_COUNT', 3.00, 300.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE')
ON CONFLICT (tenant_id, campaign_code, milestone_step) DO NOTHING;

-- 7. SEED HTML5 GAMES & LUCKY WHEEL PRIZES
INSERT INTO loyalty_lucky_wheels (tenant_id, wheel_code, wheel_name, price_per_spin, free_spins_daily, status)
VALUES 
('TENANT_DELIMART', 'LUCKY_WHEEL', 'Vòng Quay Tri Ân Khách Hàng', 20.00, 1, 'ACTIVE')
ON CONFLICT (tenant_id, wheel_code) DO NOTHING;

INSERT INTO loyalty_games (tenant_id, game_code, game_name, category, price_per_turn, free_turns_daily, status)
VALUES 
('TENANT_DELIMART', 'QUIZ_MASTER', 'Đố Vui Trúng Điểm Thưởng', 'QUIZ', 10.00, 1, 'ACTIVE'),
('TENANT_DELIMART', 'FARM_DELI', 'Nông Trại Điểm Thưởng Delimart', 'DAILY_CHECKIN', 0.00, 1, 'ACTIVE'),
('TENANT_DELIMART', 'VOUCHER_STORE', 'Kho Phiếu Ưu Đãi Liên Minh', 'SCRATCH_CARD', 0.00, 1, 'ACTIVE')
ON CONFLICT (tenant_id, game_code) DO NOTHING;

INSERT INTO loyalty_wheel_prizes (wheel_id, prize_name, prize_type, prize_value, probability_weight, daily_budget_limit, display_order, color_code, status)
SELECT 
    w.id,
    p.prize_name,
    p.prize_type,
    p.prize_value,
    p.probability_weight,
    p.daily_budget_limit,
    p.display_order,
    p.color_code,
    p.status
FROM loyalty_lucky_wheels w
CROSS JOIN (
    VALUES 
    ('100 Điểm Thưởng', 'POINTS', 100.00, 30, 5000.00, 1, '#FFB800', 'ACTIVE'),
    ('Voucher 50 HTG', 'VOUCHER', 50.00, 20, 2000.00, 2, '#FF5C5C', 'ACTIVE'),
    ('Chúc May Mắn', 'NO_LUCK', 0.00, 25, 0.00, 3, '#3BC9DB', 'ACTIVE'),
    ('200 Điểm Thưởng', 'POINTS', 200.00, 10, 3000.00, 4, '#4D96FF', 'ACTIVE'),
    ('500 HTG Tiền Mặt', 'CASHBACK', 500.00, 5, 1000.00, 5, '#6BCB77', 'ACTIVE'),
    ('Thêm 1 Lượt Quay', 'TURNS', 1.00, 10, 100.00, 6, '#FFA07A', 'ACTIVE')
) AS p(prize_name, prize_type, prize_value, probability_weight, daily_budget_limit, display_order, color_code, status)
WHERE w.wheel_code = 'LUCKY_WHEEL' AND w.tenant_id = 'TENANT_DELIMART'
AND NOT EXISTS (
    SELECT 1 FROM loyalty_wheel_prizes wp WHERE wp.wheel_id = w.id AND wp.display_order = p.display_order
);

-- 8. SEED DEMO ACCOUNT (NC-84988888888)
INSERT INTO loyalty_accounts (tenant_id, external_user_id, phone_number, full_name, tier_id, current_points, tier_points, status)
SELECT 
    'TENANT_DELIMART',
    '84988888888',
    '84988888888',
    'Khách Hàng Thân Thiết VIP',
    t.id,
    1250.00,
    3850.00,
    'ACTIVE'
FROM loyalty_tiers t
WHERE t.tenant_id = 'TENANT_DELIMART' AND t.code = 'GOLD'
ON CONFLICT (tenant_id, external_user_id) DO NOTHING;

-- 9. SEED DEMO ACCOUNT (Hoàn tất)

-- 10. SEED POINT LEDGER ENTRIES FOR DEMO ACCOUNT
INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, description)
SELECT 
    'TENANT_DELIMART',
    a.id,
    150.00,
    1250.00,
    'EARN',
    'POS_TX_123',
    'Tích điểm mua sắm tại Siêu thị Delimart'
FROM loyalty_accounts a WHERE a.external_user_id = '84988888888'
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, description)
SELECT 
    'TENANT_DELIMART',
    a.id,
    100.00,
    1100.00,
    'EARN',
    'SPIN_TX_456',
    'Trúng thưởng Vòng Quay May Mắn Tri Ân'
FROM loyalty_accounts a WHERE a.external_user_id = '84988888888'
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, description)
SELECT 
    'TENANT_DELIMART',
    a.id,
    -200.00,
    1000.00,
    'BURN',
    'BURN_TX_890',
    'Trừ điểm thanh toán tại quầy thu ngân Delimart'
FROM loyalty_accounts a WHERE a.external_user_id = '84988888888'
ON CONFLICT DO NOTHING;

-- 11. SEED USER VOUCHER REDEMPTIONS
INSERT INTO loyalty_voucher_redemptions (tenant_id, account_id, voucher_id, redemption_code, status, expires_at)
SELECT 
    'TENANT_DELIMART',
    a.id,
    v.id,
    'DELIMART-50K-9X8Z',
    'ACTIVE',
    CURRENT_TIMESTAMP + INTERVAL '30 days'
FROM loyalty_accounts a, loyalty_vouchers v
WHERE a.external_user_id = '84988888888' AND v.voucher_code = 'DELIMART-50K-9X8Z'
ON CONFLICT (redemption_code) DO NOTHING;

INSERT INTO loyalty_voucher_redemptions (tenant_id, account_id, voucher_id, redemption_code, status, expires_at)
SELECT 
    'TENANT_DELIMART',
    a.id,
    v.id,
    'NATCOM-10PCT-7B2C',
    'ACTIVE',
    CURRENT_TIMESTAMP + INTERVAL '30 days'
FROM loyalty_accounts a, loyalty_vouchers v
WHERE a.external_user_id = '84988888888' AND v.voucher_code = 'NATCOM-10PCT-7B2C'
ON CONFLICT (redemption_code) DO NOTHING;

INSERT INTO loyalty_voucher_redemptions (tenant_id, account_id, voucher_id, redemption_code, status, expires_at)
SELECT 
    'TENANT_DELIMART',
    a.id,
    v.id,
    'DELIMART-20K-1A4F',
    'ACTIVE',
    CURRENT_TIMESTAMP + INTERVAL '30 days'
FROM loyalty_accounts a, loyalty_vouchers v
WHERE a.external_user_id = '84988888888' AND v.voucher_code = 'DELIMART-20K-1A4F'
ON CONFLICT (redemption_code) DO NOTHING;
