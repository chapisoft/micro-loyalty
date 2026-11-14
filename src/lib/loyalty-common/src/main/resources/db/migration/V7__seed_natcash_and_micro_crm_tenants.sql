-- ==============================================================================
-- FLYWAY MIGRATION SCRIPT: V7__seed_natcash_and_micro_crm_tenants.sql
-- Khởi Tạo Seed Data Cho 2 Đối Tác & 2 Mô Hình Khác Nhau:
--   1. Mô hình 1: TENANT_NATCASH (Mô hình Ví Điện Tử & Viễn Thông Telco On-Premise)
--   2. Mô hình 2: TENANT_MICRO_CRM (Mô hình SaaS Liên Minh Bán Lẻ & TMĐT Đa Kênh)
-- Cơ sở dữ liệu: PostgreSQL 15+ (loyalty_db)
-- ==============================================================================

-- ==============================================================================
-- PHẦN A: SEED MÔ HÌNH 1 — TENANT_NATCASH (VÍ ĐIỆN TỬ & TELCO ON-PREMISE)
-- ==============================================================================

-- 1. SEED TENANT NATCASH
INSERT INTO tenants (code, name, api_key, secret_key, webhook_url, status)
VALUES 
('TENANT_NATCASH', 'Hệ Thống Ví Điện Tử Natcash & Viễn Thông Natcom', 'API_KEY_NATCASH_ONPREMISE_2026', 'SECRET_KEY_NATCASH_SECURE_999', 'http://10.228.37.65:8085/loyalty/webhook', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- 2. SEED PARTNERS CHO TENANT_NATCASH
INSERT INTO loyalty_partners (tenant_id, partner_code, partner_name, partner_type, api_key, secret_key, status)
VALUES 
('TENANT_NATCASH', 'NATCASH_WALLET', 'Ví Điện Tử Natcash Haïti (Chuyển Tiền & Thanh Toán)', 'BANKING', 'KEY_NATCASH_WALLET', 'SEC_NC_WALLET_01', 'ACTIVE'),
('TENANT_NATCASH', 'NATCOM_TELCO', 'Tổng Công Ty Viễn Thông Natcom (Nạp Thẻ & 4G/5G)', 'TELECOM', 'KEY_NATCOM_TELCO', 'SEC_NC_TELCO_02', 'ACTIVE'),
('TENANT_NATCASH', 'EDH_POWER', 'Tổng Công Ty Điện Lực Quốc Gia Haïti (Électricité d''Haïti)', 'UTILITIES', 'KEY_EDH_POWER', 'SEC_NC_POWER_03', 'ACTIVE'),
('TENANT_NATCASH', 'DINEPA_WATER', 'Tổng Công Ty Cấp Nước Quốc Gia Haïti (DINEPA)', 'UTILITIES', 'KEY_DINEPA_WATER', 'SEC_NC_WATER_04', 'ACTIVE')
ON CONFLICT (tenant_id, partner_code) DO NOTHING;

-- 3. SEED TIERS CHO TENANT_NATCASH
INSERT INTO loyalty_tiers (tenant_id, code, name, tier_level, min_points, point_multiplier, free_daily_turns, description, status)
VALUES 
('TENANT_NATCASH', 'SILVER', 'Hạng Bạc Ví Natcash', 1, 0.00, 1.00, 1, 'Hạng phổ thông khởi đầu khi đăng ký và định danh Ví Natcash', 'ACTIVE'),
('TENANT_NATCASH', 'GOLD', 'Hạng Vàng Thân Thiết', 2, 1000.00, 1.25, 2, 'Khách hàng thanh toán cước và chuyển tiền thường xuyên', 'ACTIVE'),
('TENANT_NATCASH', 'PLATINUM', 'Hạng Bạch Kim VIP', 3, 5000.00, 1.50, 3, 'Khách hàng giao dịch lớn và nạp tiền viễn thông hàng tháng', 'ACTIVE'),
('TENANT_NATCASH', 'DIAMOND', 'Hạng Kim Cương Đặc Quyền', 4, 20000.00, 2.00, 5, 'Hội viên VIP cao cấp nhất hưởng hoàn tiền nạp thẻ 5% trọn đời', 'ACTIVE')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- 4. SEED ACCEPTANCE POLICIES CHO TENANT_NATCASH
INSERT INTO loyalty_acceptance_policies (tenant_id, partner_id, point_exchange_rate, max_burn_percentage, min_burn_points, max_burn_points_per_day, status)
SELECT 'TENANT_NATCASH', p.id, 1.0000, 100.00, 10.00, 20000.00, 'ACTIVE'
FROM loyalty_partners p WHERE p.tenant_id = 'TENANT_NATCASH' AND p.partner_code = 'NATCASH_WALLET'
ON CONFLICT (tenant_id, partner_id) DO NOTHING;

INSERT INTO loyalty_acceptance_policies (tenant_id, partner_id, point_exchange_rate, max_burn_percentage, min_burn_points, max_burn_points_per_day, status)
SELECT 'TENANT_NATCASH', p.id, 1.0000, 100.00, 10.00, 10000.00, 'ACTIVE'
FROM loyalty_partners p WHERE p.tenant_id = 'TENANT_NATCASH' AND p.partner_code = 'NATCOM_TELCO'
ON CONFLICT (tenant_id, partner_id) DO NOTHING;

INSERT INTO loyalty_acceptance_policies (tenant_id, partner_id, point_exchange_rate, max_burn_percentage, min_burn_points, max_burn_points_per_day, status)
SELECT 'TENANT_NATCASH', p.id, 1.0000, 50.00, 20.00, 5000.00, 'ACTIVE'
FROM loyalty_partners p WHERE p.tenant_id = 'TENANT_NATCASH' AND p.partner_code = 'EDH_POWER'
ON CONFLICT (tenant_id, partner_id) DO NOTHING;

-- 5. SEED VOUCHERS CHO TENANT_NATCASH
INSERT INTO loyalty_vouchers (tenant_id, partner_id, voucher_code, title, description, discount_type, discount_value, min_bill_amount, total_quantity, available_quantity, point_cost, start_date, end_date, status)
SELECT 'TENANT_NATCASH', p.id, 'NC-DATA-1GB', 'Đổi 1GB Data 4G Tốc Độ Cao 24 Giờ', 'Áp dụng cho mọi thuê bao Natcom di động trả trước và trả sau.', 'FIXED_AMOUNT', 50.00, 0.00, 10000, 9850, 50.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '180 days', 'ACTIVE'
FROM loyalty_partners p WHERE p.tenant_id = 'TENANT_NATCASH' AND p.partner_code = 'NATCOM_TELCO'
ON CONFLICT (tenant_id, voucher_code) DO NOTHING;

INSERT INTO loyalty_vouchers (tenant_id, partner_id, voucher_code, title, description, discount_type, discount_value, min_bill_amount, total_quantity, available_quantity, point_cost, start_date, end_date, status)
SELECT 'TENANT_NATCASH', p.id, 'NC-CASHBACK-100', 'Hoàn 100 HTG Vào Ví Khi Thanh Toán Hóa Đơn', 'Áp dụng khi thanh toán hóa đơn điện lực EDH hoặc nước DINEPA từ 500 HTG.', 'FIXED_AMOUNT', 100.00, 500.00, 5000, 4890, 80.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '180 days', 'ACTIVE'
FROM loyalty_partners p WHERE p.tenant_id = 'TENANT_NATCASH' AND p.partner_code = 'NATCASH_WALLET'
ON CONFLICT (tenant_id, voucher_code) DO NOTHING;

INSERT INTO loyalty_vouchers (tenant_id, partner_id, voucher_code, title, description, discount_type, discount_value, min_bill_amount, total_quantity, available_quantity, point_cost, start_date, end_date, status)
SELECT 'TENANT_NATCASH', p.id, 'NC-AIRTIME-50', 'Chiết Khấu 10% Cước Nạp Thẻ Điện Thoại', 'Áp dụng khi nạp thẻ điện thoại Natcom từ 100 HTG qua ứng dụng Ví.', 'PERCENTAGE', 10.00, 100.00, 8000, 7820, 30.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '180 days', 'ACTIVE'
FROM loyalty_partners p WHERE p.tenant_id = 'TENANT_NATCASH' AND p.partner_code = 'NATCOM_TELCO'
ON CONFLICT (tenant_id, voucher_code) DO NOTHING;

-- 6. SEED CAMPAIGN MILESTONES CHO TENANT_NATCASH
INSERT INTO loyalty_campaign_milestones (tenant_id, campaign_code, campaign_name, milestone_step, target_metric, target_value, reward_points, start_date, end_date, status)
VALUES 
('TENANT_NATCASH', 'NATCASH_MISSION_2026', 'Thử Thách Giao Dịch Số Natcash', 1, 'TRANSACTION_COUNT', 1.00, 30.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days', 'ACTIVE'),
('TENANT_NATCASH', 'NATCASH_MISSION_2026', 'Thử Thách Giao Dịch Số Natcash', 2, 'BILL_AMOUNT', 500.00, 100.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days', 'ACTIVE'),
('TENANT_NATCASH', 'NATCASH_MISSION_2026', 'Thử Thách Giao Dịch Số Natcash', 3, 'TRANSACTION_COUNT', 3.00, 150.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days', 'ACTIVE'),
('TENANT_NATCASH', 'NATCASH_MISSION_2026', 'Thử Thách Giao Dịch Số Natcash', 4, 'BILL_AMOUNT', 1000.00, 200.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days', 'ACTIVE')
ON CONFLICT (tenant_id, campaign_code, milestone_step) DO NOTHING;

-- 7. SEED HTML5 GAMES & LUCKY WHEEL CHO TENANT_NATCASH
INSERT INTO loyalty_lucky_wheels (tenant_id, wheel_code, wheel_name, price_per_spin, free_spins_daily, status)
VALUES 
('TENANT_NATCASH', 'LUCKY_WHEEL_NATCASH', 'Vòng Quay Tri Ân Khách Hàng Natcash', 20.00, 2, 'ACTIVE')
ON CONFLICT (tenant_id, wheel_code) DO NOTHING;

INSERT INTO loyalty_games (tenant_id, game_code, game_name, category, price_per_turn, free_turns_daily, status)
VALUES 
('TENANT_NATCASH', 'TOPUP_CHALLENGE', 'Đua Top Nạp Thẻ Nhận Vàng', 'DAILY_CHECKIN', 0.00, 1, 'ACTIVE')
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
    ('500 HTG Tiền Mặt Ví', 'CASHBACK', 500.00, 5, 2000.00, 1, '#6BCB77', 'ACTIVE'),
    ('1GB Data 4G Natcom', 'VOUCHER', 50.00, 20, 5000.00, 2, '#FF5C5C', 'ACTIVE'),
    ('Chúc May Mắn Lần Sau', 'NO_LUCK', 0.00, 25, 0.00, 3, '#3BC9DB', 'ACTIVE'),
    ('200 Điểm Thưởng', 'POINTS', 200.00, 15, 3000.00, 4, '#4D96FF', 'ACTIVE'),
    ('100 Điểm Thưởng', 'POINTS', 100.00, 25, 5000.00, 5, '#FFB800', 'ACTIVE'),
    ('Thêm 1 Lượt Quay Free', 'TURNS', 1.00, 10, 100.00, 6, '#FFA07A', 'ACTIVE')
) AS p(prize_name, prize_type, prize_value, probability_weight, daily_budget_limit, display_order, color_code, status)
WHERE w.wheel_code = 'LUCKY_WHEEL_NATCASH' AND w.tenant_id = 'TENANT_NATCASH'
AND NOT EXISTS (
    SELECT 1 FROM loyalty_wheel_prizes wp WHERE wp.wheel_id = w.id AND wp.display_order = p.display_order
);

-- 8. SEED DEMO ACCOUNT CHO TENANT_NATCASH (50937123456 & 84988888888)
INSERT INTO loyalty_accounts (tenant_id, external_user_id, phone_number, full_name, tier_id, current_points, tier_points, status)
SELECT 'TENANT_NATCASH', '50937123456', '50937123456', 'Jean-Baptiste Natcash VIP', t.id, 2500.00, 4200.00, 'ACTIVE'
FROM loyalty_tiers t WHERE t.tenant_id = 'TENANT_NATCASH' AND t.code = 'GOLD'
ON CONFLICT (tenant_id, external_user_id) DO NOTHING;

INSERT INTO loyalty_accounts (tenant_id, external_user_id, phone_number, full_name, tier_id, current_points, tier_points, status)
SELECT 'TENANT_NATCASH', '84988888888', '84988888888', 'Chủ Ví Natcash Thân Thiết', t.id, 1850.00, 3200.00, 'ACTIVE'
FROM loyalty_tiers t WHERE t.tenant_id = 'TENANT_NATCASH' AND t.code = 'GOLD'
ON CONFLICT (tenant_id, external_user_id) DO NOTHING;

-- 9. SEED HOÀN TẤT CHO TENANT_NATCASH

-- 10. SEED POINT LEDGER CHO TENANT_NATCASH
INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, description)
SELECT 'TENANT_NATCASH', a.id, 150.00, 2500.00, 'EARN', 'TOPUP_TX_001', 'Tích điểm nạp tiền cước di động Natcom 500 HTG'
FROM loyalty_accounts a WHERE a.tenant_id = 'TENANT_NATCASH' AND a.external_user_id = '50937123456'
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, description)
SELECT 'TENANT_NATCASH', a.id, 100.00, 2350.00, 'EARN', 'BILL_TX_002', 'Hoàn điểm thanh toán hóa đơn điện lực EDH'
FROM loyalty_accounts a WHERE a.tenant_id = 'TENANT_NATCASH' AND a.external_user_id = '50937123456'
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, description)
SELECT 'TENANT_NATCASH', a.id, -50.00, 2250.00, 'BURN', 'REDEEM_TX_003', 'Đổi điểm nhận gói 1GB Data 4G Natcom'
FROM loyalty_accounts a WHERE a.tenant_id = 'TENANT_NATCASH' AND a.external_user_id = '50937123456'
ON CONFLICT DO NOTHING;

-- 11. SEED VOUCHER REDEMPTIONS CHO TENANT_NATCASH
INSERT INTO loyalty_voucher_redemptions (tenant_id, account_id, voucher_id, redemption_code, status, expires_at)
SELECT 'TENANT_NATCASH', a.id, v.id, 'NC-DATA-1GB-99AA88', 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '30 days'
FROM loyalty_accounts a, loyalty_vouchers v
WHERE a.tenant_id = 'TENANT_NATCASH' AND a.external_user_id = '50937123456' AND v.tenant_id = 'TENANT_NATCASH' AND v.voucher_code = 'NC-DATA-1GB'
ON CONFLICT (redemption_code) DO NOTHING;


-- ==============================================================================
-- PHẦN B: SEED MÔ HÌNH 2 — TENANT_MICRO_CRM (LIÊN MINH BÁN LẺ & TMĐT SAAS)
-- ==============================================================================

-- 1. SEED TENANT MICRO_CRM
INSERT INTO tenants (code, name, api_key, secret_key, webhook_url, status)
VALUES 
('TENANT_MICRO_CRM', 'Nền Tảng Liên Minh Khách Hàng Thân Thiết Micro-CRM', 'API_KEY_MICRO_CRM_SAAS_2026', 'SECRET_KEY_MICRO_CRM_XYZ_888', 'http://api.mid.io.vn/webhook/micro-crm', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- 2. SEED PARTNERS CHO TENANT_MICRO_CRM
INSERT INTO loyalty_partners (tenant_id, partner_code, partner_name, partner_type, api_key, secret_key, status)
VALUES 
('TENANT_MICRO_CRM', 'DELIMART_RETAIL', 'Hệ Thống Siêu Thị Tiện Lợi Delimart', 'RETAIL', 'KEY_CRM_DELIMART', 'SEC_CRM_DELI_01', 'ACTIVE'),
('TENANT_MICRO_CRM', 'FAHASA_BOOKSTORE', 'Nhà Sách Fahasa & Văn Phòng Phẩm Toàn Quốc', 'RETAIL', 'KEY_CRM_FAHASA', 'SEC_CRM_FAHASA_02', 'ACTIVE'),
('TENANT_MICRO_CRM', 'HIGHLANDS_COFFEE', 'Chuỗi Cà Phê & Đồ Uống Highlands Coffee', 'F_AND_B', 'KEY_CRM_HIGHLANDS', 'SEC_CRM_HL_03', 'ACTIVE'),
('TENANT_MICRO_CRM', 'CGV_CINEMAS', 'Cụm Rạp Chiếu Phim Quốc Tế CGV Cinemas', 'ENTERTAINMENT', 'KEY_CRM_CGV', 'SEC_CRM_CGV_04', 'ACTIVE'),
('TENANT_MICRO_CRM', 'RINGME_STREAMING', 'Nền Tảng Phim Ảnh & Giải Trí Số Ringme', 'ENTERTAINMENT', 'KEY_CRM_RINGME', 'SEC_CRM_RINGME_05', 'ACTIVE')
ON CONFLICT (tenant_id, partner_code) DO NOTHING;

-- 3. SEED TIERS CHO TENANT_MICRO_CRM
INSERT INTO loyalty_tiers (tenant_id, code, name, tier_level, min_points, point_multiplier, free_daily_turns, description, status)
VALUES 
('TENANT_MICRO_CRM', 'SILVER', 'Hạng Bạc Thành Viên Mới', 1, 0.00, 1.00, 1, 'Hội viên đăng ký mới qua cổng Webview hoặc ứng dụng TMĐT', 'ACTIVE'),
('TENANT_MICRO_CRM', 'GOLD', 'Hạng Vàng Thân Thiết', 2, 2000.00, 1.30, 2, 'Tích lũy từ 2.000 điểm khi mua sắm tại chuỗi cửa hàng liên minh', 'ACTIVE'),
('TENANT_MICRO_CRM', 'PLATINUM', 'Hạng Bạch Kim Cao Cấp', 3, 10000.00, 1.60, 4, 'Hội viên cao cấp miễn phí giao hàng và quà sinh nhật độc quyền', 'ACTIVE'),
('TENANT_MICRO_CRM', 'DIAMOND', 'Hạng Kim Cương Tinh Hoa', 4, 30000.00, 2.20, 6, 'Đặc quyền chiết khấu trực tiếp 10% tại tất cả các thương hiệu liên minh', 'ACTIVE')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- 4. SEED ACCEPTANCE POLICIES CHO TENANT_MICRO_CRM
INSERT INTO loyalty_acceptance_policies (tenant_id, partner_id, point_exchange_rate, max_burn_percentage, min_burn_points, max_burn_points_per_day, status)
SELECT 'TENANT_MICRO_CRM', p.id, 1.0000, 50.00, 20.00, 15000.00, 'ACTIVE'
FROM loyalty_partners p WHERE p.tenant_id = 'TENANT_MICRO_CRM' AND p.partner_code = 'DELIMART_RETAIL'
ON CONFLICT (tenant_id, partner_id) DO NOTHING;

INSERT INTO loyalty_acceptance_policies (tenant_id, partner_id, point_exchange_rate, max_burn_percentage, min_burn_points, max_burn_points_per_day, status)
SELECT 'TENANT_MICRO_CRM', p.id, 1.0000, 40.00, 10.00, 5000.00, 'ACTIVE'
FROM loyalty_partners p WHERE p.tenant_id = 'TENANT_MICRO_CRM' AND p.partner_code = 'FAHASA_BOOKSTORE'
ON CONFLICT (tenant_id, partner_id) DO NOTHING;

INSERT INTO loyalty_acceptance_policies (tenant_id, partner_id, point_exchange_rate, max_burn_percentage, min_burn_points, max_burn_points_per_day, status)
SELECT 'TENANT_MICRO_CRM', p.id, 1.0000, 50.00, 10.00, 5000.00, 'ACTIVE'
FROM loyalty_partners p WHERE p.tenant_id = 'TENANT_MICRO_CRM' AND p.partner_code = 'HIGHLANDS_COFFEE'
ON CONFLICT (tenant_id, partner_id) DO NOTHING;

INSERT INTO loyalty_acceptance_policies (tenant_id, partner_id, point_exchange_rate, max_burn_percentage, min_burn_points, max_burn_points_per_day, status)
SELECT 'TENANT_MICRO_CRM', p.id, 1.0000, 60.00, 20.00, 10000.00, 'ACTIVE'
FROM loyalty_partners p WHERE p.tenant_id = 'TENANT_MICRO_CRM' AND p.partner_code = 'CGV_CINEMAS'
ON CONFLICT (tenant_id, partner_id) DO NOTHING;

-- 5. SEED VOUCHERS CHO TENANT_MICRO_CRM
INSERT INTO loyalty_vouchers (tenant_id, partner_id, voucher_code, title, description, discount_type, discount_value, min_bill_amount, total_quantity, available_quantity, point_cost, start_date, end_date, status)
SELECT 'TENANT_MICRO_CRM', p.id, 'CRM-DELI-100K', 'Phiếu Mua Sắm 100 HTG Tại Siêu Thị Delimart', 'Áp dụng cho giỏ hàng thực phẩm & đồ uống từ 500 HTG tại Delimart.', 'FIXED_AMOUNT', 100.00, 500.00, 5000, 4920, 100.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '120 days', 'ACTIVE'
FROM loyalty_partners p WHERE p.tenant_id = 'TENANT_MICRO_CRM' AND p.partner_code = 'DELIMART_RETAIL'
ON CONFLICT (tenant_id, voucher_code) DO NOTHING;

INSERT INTO loyalty_vouchers (tenant_id, partner_id, voucher_code, title, description, discount_type, discount_value, min_bill_amount, total_quantity, available_quantity, point_cost, start_date, end_date, status)
SELECT 'TENANT_MICRO_CRM', p.id, 'CRM-FAHASA-20PCT', 'Chiết Khấu 20% Mua Sách & Dụng Cụ Học Tập', 'Áp dụng cho mọi đơn hàng tại hệ thống nhà sách Fahasa toàn quốc.', 'PERCENTAGE', 20.00, 200.00, 3000, 2870, 60.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '120 days', 'ACTIVE'
FROM loyalty_partners p WHERE p.tenant_id = 'TENANT_MICRO_CRM' AND p.partner_code = 'FAHASA_BOOKSTORE'
ON CONFLICT (tenant_id, voucher_code) DO NOTHING;

INSERT INTO loyalty_vouchers (tenant_id, partner_id, voucher_code, title, description, discount_type, discount_value, min_bill_amount, total_quantity, available_quantity, point_cost, start_date, end_date, status)
SELECT 'TENANT_MICRO_CRM', p.id, 'CRM-COFFEE-FREE', 'Miễn Phí 1 Đồ Uống Cỡ Lớn Highlands Coffee', 'Áp dụng đổi tại tất cả cửa hàng Highlands Coffee khi tích đủ 80 điểm.', 'FIXED_AMOUNT', 50.00, 0.00, 4000, 3810, 80.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '120 days', 'ACTIVE'
FROM loyalty_partners p WHERE p.tenant_id = 'TENANT_MICRO_CRM' AND p.partner_code = 'HIGHLANDS_COFFEE'
ON CONFLICT (tenant_id, voucher_code) DO NOTHING;

INSERT INTO loyalty_vouchers (tenant_id, partner_id, voucher_code, title, description, discount_type, discount_value, min_bill_amount, total_quantity, available_quantity, point_cost, start_date, end_date, status)
SELECT 'TENANT_MICRO_CRM', p.id, 'CRM-CGV-2D', 'Giảm 50 HTG Cặp Vé Xem Phim 2D Cuối Tuần', 'Áp dụng mua vé trực tuyến hoặc tại quầy vé CGV Cinemas.', 'FIXED_AMOUNT', 50.00, 150.00, 2000, 1950, 50.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '120 days', 'ACTIVE'
FROM loyalty_partners p WHERE p.tenant_id = 'TENANT_MICRO_CRM' AND p.partner_code = 'CGV_CINEMAS'
ON CONFLICT (tenant_id, voucher_code) DO NOTHING;

-- 6. SEED CAMPAIGN MILESTONES CHO TENANT_MICRO_CRM
INSERT INTO loyalty_campaign_milestones (tenant_id, campaign_code, campaign_name, milestone_step, target_metric, target_value, reward_points, start_date, end_date, status)
VALUES 
('TENANT_MICRO_CRM', 'RETAIL_FEST_2026', 'Lễ Hội Mua Sắm Liên Minh Bán Lẻ', 1, 'TRANSACTION_COUNT', 1.00, 50.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', 'ACTIVE'),
('TENANT_MICRO_CRM', 'RETAIL_FEST_2026', 'Lễ Hội Mua Sắm Liên Minh Bán Lẻ', 2, 'TRANSACTION_COUNT', 2.00, 120.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', 'ACTIVE'),
('TENANT_MICRO_CRM', 'RETAIL_FEST_2026', 'Lễ Hội Mua Sắm Liên Minh Bán Lẻ', 3, 'BILL_AMOUNT', 2000.00, 250.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', 'ACTIVE'),
('TENANT_MICRO_CRM', 'RETAIL_FEST_2026', 'Lễ Hội Mua Sắm Liên Minh Bán Lẻ', 4, 'TRANSACTION_COUNT', 5.00, 400.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', 'ACTIVE')
ON CONFLICT (tenant_id, campaign_code, milestone_step) DO NOTHING;

-- 7. SEED HTML5 GAMES & LUCKY WHEEL CHO TENANT_MICRO_CRM
INSERT INTO loyalty_lucky_wheels (tenant_id, wheel_code, wheel_name, price_per_spin, free_spins_daily, status)
VALUES 
('TENANT_MICRO_CRM', 'LUCKY_WHEEL_CRM', 'Vòng Quay May Mắn Tri Ân Bán Lẻ', 20.00, 2, 'ACTIVE')
ON CONFLICT (tenant_id, wheel_code) DO NOTHING;

INSERT INTO loyalty_games (tenant_id, game_code, game_name, category, price_per_turn, free_turns_daily, status)
VALUES 
('TENANT_MICRO_CRM', 'QUIZ_MASTER', 'Đố Vui Thương Hiệu Nhận Điểm Thưởng', 'QUIZ', 10.00, 1, 'ACTIVE'),
('TENANT_MICRO_CRM', 'FARM_DELI', 'Nông Trại Thu Hoạch Đổi Quà Siêu Thị', 'DAILY_CHECKIN', 0.00, 1, 'ACTIVE')
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
    ('Voucher 100 HTG Delimart', 'VOUCHER', 100.00, 10, 5000.00, 1, '#FFB800', 'ACTIVE'),
    ('Vé Xem Phim CGV 2D', 'VOUCHER', 80.00, 15, 3000.00, 2, '#FF5C5C', 'ACTIVE'),
    ('Chúc May Mắn Lần Sau', 'NO_LUCK', 0.00, 25, 0.00, 3, '#3BC9DB', 'ACTIVE'),
    ('200 Điểm Thưởng Liên Minh', 'POINTS', 200.00, 15, 3000.00, 4, '#4D96FF', 'ACTIVE'),
    ('1 Ly Cà Phê Highlands', 'VOUCHER', 50.00, 20, 2000.00, 5, '#6BCB77', 'ACTIVE'),
    ('Thêm 1 Lượt Quay Free', 'TURNS', 1.00, 15, 100.00, 6, '#FFA07A', 'ACTIVE')
) AS p(prize_name, prize_type, prize_value, probability_weight, daily_budget_limit, display_order, color_code, status)
WHERE w.wheel_code = 'LUCKY_WHEEL_CRM' AND w.tenant_id = 'TENANT_MICRO_CRM'
AND NOT EXISTS (
    SELECT 1 FROM loyalty_wheel_prizes wp WHERE wp.wheel_id = w.id AND wp.display_order = p.display_order
);

-- 8. SEED DEMO ACCOUNT CHO TENANT_MICRO_CRM (84977777777 & CRM_USER_8888)
INSERT INTO loyalty_accounts (tenant_id, external_user_id, phone_number, full_name, tier_id, current_points, tier_points, status)
SELECT 'TENANT_MICRO_CRM', '84977777777', '84977777777', 'Nguyễn Văn Khách Hàng Platinum', t.id, 3450.00, 11500.00, 'ACTIVE'
FROM loyalty_tiers t WHERE t.tenant_id = 'TENANT_MICRO_CRM' AND t.code = 'PLATINUM'
ON CONFLICT (tenant_id, external_user_id) DO NOTHING;

INSERT INTO loyalty_accounts (tenant_id, external_user_id, phone_number, full_name, tier_id, current_points, tier_points, status)
SELECT 'TENANT_MICRO_CRM', 'CRM_USER_8888', '84977777777', 'Trần Thị Hội Viên Gold', t.id, 2100.00, 3500.00, 'ACTIVE'
FROM loyalty_tiers t WHERE t.tenant_id = 'TENANT_MICRO_CRM' AND t.code = 'GOLD'
ON CONFLICT (tenant_id, external_user_id) DO NOTHING;

-- 9. SEED HOÀN TẤT CHO TENANT_MICRO_CRM

-- 10. SEED POINT LEDGER CHO TENANT_MICRO_CRM
INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, description)
SELECT 'TENANT_MICRO_CRM', a.id, 200.00, 3450.00, 'EARN', 'RETAIL_TX_881', 'Tích điểm mua sắm tại Siêu thị Delimart 1.500 HTG'
FROM loyalty_accounts a WHERE a.tenant_id = 'TENANT_MICRO_CRM' AND a.external_user_id = '84977777777'
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, description)
SELECT 'TENANT_MICRO_CRM', a.id, 80.00, 3250.00, 'EARN', 'RETAIL_TX_882', 'Tích điểm mua sách & văn phòng phẩm Fahasa'
FROM loyalty_accounts a WHERE a.tenant_id = 'TENANT_MICRO_CRM' AND a.external_user_id = '84977777777'
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, description)
SELECT 'TENANT_MICRO_CRM', a.id, -100.00, 3170.00, 'BURN', 'REDEEM_TX_883', 'Đổi điểm nhận Phiếu mua sắm Delimart 100 HTG'
FROM loyalty_accounts a WHERE a.tenant_id = 'TENANT_MICRO_CRM' AND a.external_user_id = '84977777777'
ON CONFLICT DO NOTHING;

-- 11. SEED VOUCHER REDEMPTIONS CHO TENANT_MICRO_CRM
INSERT INTO loyalty_voucher_redemptions (tenant_id, account_id, voucher_id, redemption_code, status, expires_at)
SELECT 'TENANT_MICRO_CRM', a.id, v.id, 'CRM-DELI-100K-88BB77', 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '30 days'
FROM loyalty_accounts a, loyalty_vouchers v
WHERE a.tenant_id = 'TENANT_MICRO_CRM' AND a.external_user_id = '84977777777' AND v.tenant_id = 'TENANT_MICRO_CRM' AND v.voucher_code = 'CRM-DELI-100K'
ON CONFLICT (redemption_code) DO NOTHING;

INSERT INTO loyalty_voucher_redemptions (tenant_id, account_id, voucher_id, redemption_code, status, expires_at)
SELECT 'TENANT_MICRO_CRM', a.id, v.id, 'CRM-FAHASA-20PCT-55CC44', 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '30 days'
FROM loyalty_accounts a, loyalty_vouchers v
WHERE a.tenant_id = 'TENANT_MICRO_CRM' AND a.external_user_id = '84977777777' AND v.tenant_id = 'TENANT_MICRO_CRM' AND v.voucher_code = 'CRM-FAHASA-20PCT'
ON CONFLICT (redemption_code) DO NOTHING;
