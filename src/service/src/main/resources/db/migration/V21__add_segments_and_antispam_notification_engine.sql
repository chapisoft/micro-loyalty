-- ==============================================================================
-- FLYWAY MIGRATION V21: CUSTOMER SEGMENTS & ANTI-SPAM NOTIFICATION ENGINE
-- Hệ Sinh Thái Khách Hàng Thân Thiết Liên Minh & Cổng Game Đa Thuê Bao (micro-loyalty)
-- Cơ sở dữ liệu: PostgreSQL 15+ (loyalty_db)
-- ==============================================================================

-- 1. BẢNG 7 PHÂN KHÚC KHÁCH HÀNG ĐỘNG (CUSTOMER_SEGMENTS)
CREATE TABLE IF NOT EXISTS customer_segments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    segment_code VARCHAR(50) NOT NULL, -- NEW_CUSTOMER, LOW_ACTIVITY, HIGH_VALUE, SINGLE_SERVICE, WIN_BACK, PARTNER_SHOPPER, GENERAL
    segment_name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    member_count INT NOT NULL DEFAULT 0,
    banner_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_calculated_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_segment UNIQUE (tenant_id, segment_code)
);

-- 2. BẢNG THÀNH VIÊN PHÂN KHÚC (CUSTOMER_SEGMENT_MEMBERS)
CREATE TABLE IF NOT EXISTS customer_segment_members (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    segment_id BIGINT NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
    segment_code VARCHAR(50) NOT NULL,
    external_user_id VARCHAR(100) NOT NULL,
    score NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_segment_member UNIQUE (tenant_id, segment_code, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_segment_members_user ON customer_segment_members(tenant_id, external_user_id);

-- 3. BẢNG TÙY CHỌN NHẬN THÔNG BÁO & OPT-OUT TIẾP THỊ (USER_NOTIFICATION_PREFERENCES)
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    external_user_id VARCHAR(100) NOT NULL,
    opt_out_marketing BOOLEAN NOT NULL DEFAULT FALSE,
    allow_push BOOLEAN NOT NULL DEFAULT TRUE,
    allow_sms BOOLEAN NOT NULL DEFAULT TRUE,
    allow_in_app BOOLEAN NOT NULL DEFAULT TRUE,
    preferred_locale VARCHAR(10) NOT NULL DEFAULT 'ht',
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_notif_pref UNIQUE (tenant_id, external_user_id)
);

-- 4. BẢNG KỊCH BẢN GỢI NHẮC ĐA NGÔN NGỮ 3 BÊN (REMINDER_SCENARIOS - CN-04)
CREATE TABLE IF NOT EXISTS reminder_scenarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    scenario_code VARCHAR(80) NOT NULL,
    scenario_name VARCHAR(255) NOT NULL,
    target_segment VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    channel VARCHAR(30) NOT NULL DEFAULT 'PUSH_NOTIFICATION',
    trigger_event VARCHAR(80) NOT NULL,
    title_vi VARCHAR(255),
    title_en VARCHAR(255),
    title_fr VARCHAR(255),
    title_ht VARCHAR(255),
    body_vi TEXT,
    body_en TEXT,
    body_fr TEXT,
    body_ht TEXT,
    deep_link VARCHAR(300),
    cooldown_hours INT NOT NULL DEFAULT 24,
    is_marketing BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_reminder_scenario UNIQUE (tenant_id, scenario_code)
);

-- 5. BẢNG TRUNG TÂM CẢNH BÁO HỆ THỐNG (SYSTEM_ALERTS - CN-05)
CREATE TABLE IF NOT EXISTS system_alerts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    alert_code VARCHAR(80) NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- BUDGET_80, BUDGET_100, WEBHOOK_DEADLETTER, CLEARING_DISPUTE, SECURITY_KEY_EXPIRING
    severity VARCHAR(20) NOT NULL DEFAULT 'WARNING', -- INFO, WARNING, CRITICAL
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    source_ref VARCHAR(100),
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_alerts_tenant ON system_alerts(tenant_id, acknowledged, created_at DESC);

-- 6. BẢNG THÔNG BÁO DÀNH RIÊNG CHO ĐỐI TÁC (PARTNER_NOTIFICATIONS - CN-08)
CREATE TABLE IF NOT EXISTS partner_notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    partner_id BIGINT NOT NULL REFERENCES loyalty_partners(id) ON DELETE CASCADE,
    notif_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(300),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partner_notif_lookup ON partner_notifications(tenant_id, partner_id, is_read);

-- 7. BẢNG HỘP THƯ HỘI VIÊN (USER_INBOX_MESSAGES - CN-02)
CREATE TABLE IF NOT EXISTS user_inbox_messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    external_user_id VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'PROMOTION',
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    deep_link VARCHAR(300),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_inbox_lookup ON user_inbox_messages(tenant_id, external_user_id, created_at DESC);

-- 8. SEED 7 PHÂN KHÚC KHÁCH HÀNG CHUẨN HAITI/NATCASH CHO TẤT CẢ TENANT CHÍNH
INSERT INTO customer_segments (
    tenant_id, segment_code, segment_name, description, criteria_json, member_count, banner_config, last_calculated_at, status
)
SELECT
    t.tenant_id,
    s.segment_code,
    s.segment_name,
    s.description,
    s.criteria_json::jsonb,
    s.member_count,
    s.banner_config::jsonb,
    CURRENT_TIMESTAMP,
    'ACTIVE'
FROM (VALUES ('TENANT_NATCASH'), ('TENANT_DELIMART'), ('TENANT_MICRO_CRM')) AS t(tenant_id)
CROSS JOIN (
    VALUES
    ('NEW_CUSTOMER', 'Khách Hàng Mới (0-30 ngày)', 'Hội viên vừa định danh eKYC trong 30 ngày gần nhất', '{"maxDaysSinceCreated": 30, "minTxCount": 0}', 1420, '{"themeColor": "#0284C7", "cta": "Nhận thưởng giao dịch đầu", "highlightModule": "MISSIONS"}'),
    ('LOW_ACTIVITY', 'Khách Hàng Ít Giao Dịch', 'Hội viên có 1-2 giao dịch trong 30 ngày qua', '{"minTx30d": 1, "maxTx30d": 2}', 3850, '{"themeColor": "#D97706", "cta": "Chơi vòng quay nhận thêm điểm", "highlightModule": "GAMES"}'),
    ('HIGH_VALUE', 'Hội Viên Giá Trị Cao (VIP)', 'Hội viên Hạng Bạch Kim / Kim Cương hoặc >= 5.000 điểm', '{"minTierPoints": 5000}', 640, '{"themeColor": "#7C3AED", "cta": "Đặc quyền hoàn tiền VIP", "highlightModule": "TIERS"}'),
    ('SINGLE_SERVICE', 'Khách Hàng Dùng Đơn Dịch Vụ', 'Chỉ sử dụng 1 loại dịch vụ (ví dụ chỉ nạp thẻ hoặc chuyển tiền)', '{"distinctServices": 1}', 5120, '{"themeColor": "#059669", "cta": "Thanh toán điện EDH nhận 200 Coin", "highlightModule": "CROSS_SELL"}'),
    ('WIN_BACK', 'Khách Hàng Nguy Cơ Rời Bỏ', 'Không phát sinh giao dịch trong 45 ngày gần nhất', '{"inactiveDays": 45}', 2190, '{"themeColor": "#DC2626", "cta": "Quay lại nhận Voucher 50 HTG", "highlightModule": "VOUCHERS"}'),
    ('PARTNER_SHOPPER', 'Khách Hàng Mua Sắm Đối Tác', 'Thường xuyên tích/tiêu điểm tại POS siêu thị và cửa hàng liên minh', '{"minPartnerTx": 2}', 1890, '{"themeColor": "#EA580C", "cta": "Khám phá điểm chấp nhận gần bạn", "highlightModule": "PARTNERS"}'),
    ('GENERAL', 'Hội Viên Phổ Thông', 'Nhóm hội viên tiêu chuẩn còn lại trong hệ sinh thái', '{"default": true}', 8450, '{"themeColor": "#1E3A8A", "cta": "Tích Natcash Coin mỗi ngày", "highlightModule": "HOME"}')
) AS s(segment_code, segment_name, description, criteria_json, member_count, banner_config)
ON CONFLICT (tenant_id, segment_code) DO NOTHING;

-- Seed kịch bản nhắc 3 bên
INSERT INTO reminder_scenarios (
    tenant_id, scenario_code, scenario_name, target_segment, channel, trigger_event,
    title_vi, title_en, title_fr, title_ht,
    body_vi, body_en, body_fr, body_ht,
    deep_link, cooldown_hours, is_marketing, status
) VALUES
(
    'TENANT_NATCASH', 'SCN_TIER_80_PCT', 'Nhắc Sắp Thăng Hạng (80%)', 'HIGH_VALUE', 'PUSH_NOTIFICATION', 'TIER_UPGRADE_NUDGE',
    'Bạn sắp lên hạng mới!', 'Almost at your next tier!', 'Bientôt au niveau supérieur !', 'Ou prèske monte nan pwochen nivo a!',
    'Chỉ cần thêm 20% điểm để mở khóa đặc quyền VIP Natcash.', 'Only 20% more points needed to unlock VIP Natcash benefits.', 'Plus que 20 % de points pour débloquer vos avantages VIP.', 'Ou bezwen sèlman 20% pwen ankò pou debloke avantaj VIP Natcash.',
    '/loyalty/tiers', 24, FALSE, 'ACTIVE'
),
(
    'TENANT_NATCASH', 'SCN_WINBACK_VOUCHER', 'Kích Hoạt Lại Hội Viên Ngủ Đông', 'WIN_BACK', 'PUSH_NOTIFICATION', 'INACTIVE_REMINDER',
    'Voucher 50 HTG đang chờ bạn', 'A 50 HTG Voucher is waiting', 'Un bon de 50 HTG vous attend', 'Yon koupon 50 HTG ap tann ou',
    'Quay lại thanh toán bằng Ví Natcash để nhận ngay ưu đãi 50 HTG.', 'Come back and pay with Natcash Wallet to claim 50 HTG off.', 'Revenez payer avec Natcash pour profiter de 50 HTG offerts.', 'Tounen vin peye ak Natcash pou jwenn 50 HTG rabè touswit.',
    '/loyalty/vouchers', 72, TRUE, 'ACTIVE'
)
ON CONFLICT (tenant_id, scenario_code) DO NOTHING;

-- Seed cảnh báo hệ thống & thông báo đối tác & hộp thư hội viên
INSERT INTO system_alerts (tenant_id, alert_code, alert_type, severity, title, message, source_ref, acknowledged)
SELECT 'TENANT_NATCASH', 'ALT_BUDGET_80_COFUND', 'BUDGET_80', 'WARNING',
       'Quỹ đồng tài trợ đối tác đã đạt 82% hạn mức tháng 11/2026',
       'Ngân sách PARTNER_CO_FUND đã tiêu thụ 205.000 / 250.000 HTG (82%). Cần rà soát kế hoạch gia hạn.',
       'PARTNER_CO_FUND', FALSE
WHERE NOT EXISTS (SELECT 1 FROM system_alerts WHERE alert_code = 'ALT_BUDGET_80_COFUND');

INSERT INTO partner_notifications (tenant_id, partner_id, notif_type, title, message, action_url, is_read)
SELECT p.tenant_id, p.id, 'SETTLEMENT_READY',
       'Bảng kê đối soát kỳ 2026-11 đã sẵn sàng xác nhận',
       'Lô thanh toán PAY-202611-' || p.id || ' đã được tổng hợp. Vui lòng xác nhận trong vòng 3 ngày làm việc.',
       '/partner-portal/settlements', FALSE
FROM loyalty_partners p
WHERE p.partner_code IN ('NATCOM_TELCO', 'DELIMART')
  AND NOT EXISTS (SELECT 1 FROM partner_notifications pn WHERE pn.partner_id = p.id);

INSERT INTO user_inbox_messages (tenant_id, external_user_id, category, title, body, deep_link, is_read)
SELECT 'TENANT_NATCASH', '50937123456', 'PROMOTION',
       'Chào mừng bạn đến với Hạng Vàng Natcash',
       'Bạn đang sở hữu 2.500 Natcash Coin. Khám phá khóa học Money Smart để nhận thêm tới 100 Coin!',
       '/loyalty/games/learning', FALSE
WHERE NOT EXISTS (SELECT 1 FROM user_inbox_messages WHERE external_user_id = '50937123456');
