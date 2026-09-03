-- ==============================================================================
-- FLYWAY MIGRATION V15: ADD SYSTEM AUDIT LOGS SCHEMA & INITIAL ENTERPRISE SEED
-- Hệ Sinh Thái Khách Hàng Thân Thiết Liên Minh & Cổng Game Đa Thuê Bao (micro-loyalty)
-- Cơ sở dữ liệu: PostgreSQL 15+ (loyalty_db)
-- ==============================================================================

-- 1. BẢNG NHẬT KÝ HOẠT ĐỘNG & KIỂM TOÁN HỆ THỐNG (SYSTEM_AUDIT_LOGS)
CREATE TABLE IF NOT EXISTS system_audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL DEFAULT 'TENANT_NATCASH',
    module VARCHAR(50) NOT NULL,                -- TIER, POLICY, CAMPAIGN, VOUCHER, GAMEHUB, PARTNER, CLEARING, AUTH, SYSTEM
    table_name VARCHAR(100) NOT NULL,          -- loyalty_tiers, loyalty_acceptance_policies, loyalty_games, loyalty_vouchers...
    operation VARCHAR(50) NOT NULL,            -- INSERT, UPDATE, DELETE, SETTLEMENT, LOCK, UNLOCK, LOGIN
    entity_id VARCHAR(100) NOT NULL,           -- Khóa chính hoặc mã định danh của đối tượng bị tác động
    actor_username VARCHAR(100) NOT NULL,      -- Username người thực hiện thao tác
    actor_role VARCHAR(100),                   -- SUPER_ADMIN, FINANCE_AUDITOR, OPERATOR...
    client_ip VARCHAR(100),                   -- Địa chỉ IP của máy trạm
    user_agent VARCHAR(500),                   -- Thông tin thiết bị / trình duyệt
    before_data JSONB,                         -- Snapshot dữ liệu trước khi sửa (JSONB)
    after_data JSONB,                          -- Snapshot dữ liệu sau khi sửa (JSONB)
    description TEXT,                          -- Diễn giải nghiệp vụ của hành động
    status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, FAILED
    execution_time_ms BIGINT DEFAULT 0,        -- Thời gian thực thi (ms)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. CHỈ MỤC TỐI ƯU HÓA HIỆU NĂNG TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_audit_tenant_created ON system_audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_table_op ON system_audit_logs(table_name, operation);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON system_audit_logs(actor_username);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON system_audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_module ON system_audit_logs(module);

-- 3. SEED DỮ LIỆU NHẬT KÝ KIỂM TOÁN BAN ĐẦU ĐA THUÊ BAO
-- Cung cấp lịch sử kiểm toán ban đầu cho các đối tác Natcash, Delimart, Micro CRM
INSERT INTO system_audit_logs (
    tenant_id, module, table_name, operation, entity_id, actor_username, actor_role, client_ip, user_agent,
    before_data, after_data, description, status, execution_time_ms, created_at
) VALUES
-- Bản ghi 1: Cập nhật tỷ lệ khấu trừ chính sách tích/tiêu (Natcash)
(
    'TENANT_NATCASH', 'POLICY', 'loyalty_acceptance_policies', 'UPDATE', 'POL_NATCASH_DEFAULT',
    'admin', 'SUPER_ADMIN', '10.228.37.15', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
    '{"maxBurnPercentage": 40.0, "burnRate": 1.0, "status": "ACTIVE"}'::jsonb,
    '{"maxBurnPercentage": 50.0, "burnRate": 1.0, "status": "ACTIVE"}'::jsonb,
    'Nâng tỷ lệ khấu trừ tối đa bằng điểm trên hóa đơn từ 40% lên 50%',
    'SUCCESS', 12, CURRENT_TIMESTAMP - INTERVAL '30 minutes'
),
-- Bản ghi 2: Thêm mới voucher tri ân siêu thị Delimart (Natcash)
(
    'TENANT_NATCASH', 'VOUCHER', 'loyalty_vouchers', 'INSERT', 'VCH_DELI_100',
    'operator', 'OPERATOR', '10.228.37.20', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    NULL,
    '{"voucherCode": "DELI100K", "discountAmount": 100, "totalQuantity": 5000, "status": "ACTIVE"}'::jsonb,
    'Phát hành đợt voucher giảm 100 HTG tại Siêu thị Delimart',
    'SUCCESS', 18, CURRENT_TIMESTAMP - INTERVAL '2 hours'
),
-- Bản ghi 3: Nâng hạn mức ngân sách ngày Vòng quay may mắn (Natcash)
(
    'TENANT_NATCASH', 'GAMEHUB', 'loyalty_games', 'UPDATE', 'LUCKY_WHEEL_NATCASH',
    'operator', 'OPERATOR', '10.228.37.20', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    '{"dailyBudgetLimit": 30000.0, "status": "ACTIVE"}'::jsonb,
    '{"dailyBudgetLimit": 50000.0, "status": "ACTIVE"}'::jsonb,
    'Tăng hạn mức ngân sách trả thưởng ngày cho Vòng quay May Mắn nhân dịp đầu tuần',
    'SUCCESS', 15, CURRENT_TIMESTAMP - INTERVAL '5 hours'
),
-- Bản ghi 4: Chốt kỳ quyết toán bù trừ công nợ liên minh (Natcash)
(
    'TENANT_NATCASH', 'CLEARING', 'clearing_transactions', 'SETTLEMENT', 'BATCH_CLEARING_20260901',
    'finance_auditor', 'FINANCE_AUDITOR', '10.228.37.25', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/127.0.0.0',
    '{"period": "2026-08", "status": "PENDING", "unsettledCount": 142}'::jsonb,
    '{"period": "2026-08", "status": "SETTLED", "totalNetFiat": 84500.0, "settledAt": "2026-09-01T00:00:00Z"}'::jsonb,
    'Thực hiện kết chuyển quyết toán bù trừ tài chính tháng 08/2026 giữa Ví Natcash và các đối tác',
    'SUCCESS', 125, CURRENT_TIMESTAMP - INTERVAL '1 day'
),
-- Bản ghi 5: Cập nhật hệ số nhân điểm Hạng Vàng (Natcash)
(
    'TENANT_NATCASH', 'TIER', 'loyalty_tiers', 'UPDATE', 'TIER_GOLD',
    'admin', 'SUPER_ADMIN', '10.228.37.15', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
    '{"tierCode": "GOLD", "pointMultiplier": 1.25, "maintainPoints": 2000}'::jsonb,
    '{"tierCode": "GOLD", "pointMultiplier": 1.5, "maintainPoints": 2000}'::jsonb,
    'Tăng hệ số nhân điểm tích lũy Hạng Vàng từ 1.25x lên 1.5x',
    'SUCCESS', 10, CURRENT_TIMESTAMP - INTERVAL '2 days'
),
-- Bản ghi 6: Đối tác Siêu thị Delimart - Cấu hình chính sách tích điểm riêng (Delimart)
(
    'TENANT_DELIMART', 'POLICY', 'loyalty_acceptance_policies', 'UPDATE', 'POL_DELIMART_RETAIL',
    'admin', 'SUPER_ADMIN', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    '{"earnRatePercent": 1.0, "maxBurnPercentage": 30.0}'::jsonb,
    '{"earnRatePercent": 2.0, "maxBurnPercentage": 40.0}'::jsonb,
    'Kích cầu mua sắm: Nâng tỷ lệ hoàn điểm lên 2% cho khách mua hàng tại siêu thị',
    'SUCCESS', 14, CURRENT_TIMESTAMP - INTERVAL '4 hours'
),
-- Bản ghi 7: Đối tác Siêu thị Delimart - Thêm thiết bị POS quầy thu ngân (Delimart)
(
    'TENANT_DELIMART', 'SYSTEM', 'partner_user_devices', 'INSERT', 'POS_DELI_L1_005',
    'admin', 'SUPER_ADMIN', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    NULL,
    '{"deviceId": "POS_DELI_L1_005", "posName": "Thu ngân Quầy 5 - Tầng 1", "status": "ACTIVE"}'::jsonb,
    'Đăng ký máy POS thu ngân mới tại Quầy 5 Chi nhánh Delimart Downtown',
    'SUCCESS', 22, CURRENT_TIMESTAMP - INTERVAL '1 day'
),
-- Bản ghi 8: Micro CRM - Cấu hình Webhook URL nhận sự kiện thăng hạng (Micro CRM)
(
    'TENANT_MICRO_CRM', 'PARTNER', 'loyalty_partners', 'UPDATE', 'PARTNER_MICRO_CRM',
    'admin', 'SUPER_ADMIN', '172.18.0.5', 'PostmanRuntime/7.39.0',
    '{"webhookUrl": "http://10.228.37.65:8080/api/webhook"}'::jsonb,
    '{"webhookUrl": "https://api.crm.microtech.com/v1/loyalty-webhook"}'::jsonb,
    'Chuyển đổi Endpoint Webhook sang máy chủ bảo mật HTTPS Production',
    'SUCCESS', 16, CURRENT_TIMESTAMP - INTERVAL '12 hours'
);
