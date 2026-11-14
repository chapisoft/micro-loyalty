-- =====================================================================================
-- V26: Khởi tạo CSDL quản trị người dùng, vai trò, phân quyền & tham số hệ thống
-- Loại bỏ kho lưu trữ tạm trên RAM (ConcurrentHashMap) và dữ liệu mật khẩu hardcode
-- =====================================================================================

-- 1. BẢNG QUYỀN HẠN HỆ THỐNG (SYSTEM_PERMISSIONS)
CREATE TABLE IF NOT EXISTS system_permissions (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        VARCHAR(100) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    module      VARCHAR(100) NOT NULL,
    action      VARCHAR(50)  NOT NULL DEFAULT 'ALL',
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG VAI TRÒ HỆ THỐNG (SYSTEM_ROLES)
CREATE TABLE IF NOT EXISTS system_roles (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id   VARCHAR(64)  NOT NULL,
    code        VARCHAR(100) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    is_system   BOOLEAN      NOT NULL DEFAULT FALSE,
    status      VARCHAR(32)  NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_system_roles_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_system_roles_tenant ON system_roles(tenant_id);

-- 3. BẢNG LIÊN KẾT VAI TRÒ - QUYỀN HẠN (SYSTEM_ROLE_PERMISSIONS)
CREATE TABLE IF NOT EXISTS system_role_permissions (
    role_id       BIGINT NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES system_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. BẢNG NGƯỜI DÙNG QUẢN TRỊ & CỔNG ĐỐI TÁC (SYSTEM_USERS)
CREATE TABLE IF NOT EXISTS system_users (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id             VARCHAR(64)  NOT NULL,
    username              VARCHAR(100) NOT NULL UNIQUE,
    password_hash         VARCHAR(255) NOT NULL,
    full_name             VARCHAR(255) NOT NULL,
    email                 VARCHAR(255) NOT NULL,
    phone                 VARCHAR(50),
    avatar_url            VARCHAR(500),
    partner_id            BIGINT,
    partner_code          VARCHAR(64),
    status                VARCHAR(32)  NOT NULL DEFAULT 'ACTIVE',
    failed_login_attempts INTEGER      NOT NULL DEFAULT 0,
    last_login_at         TIMESTAMPTZ,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_users_tenant ON system_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_users_partner ON system_users(partner_id);

-- 5. BẢNG LIÊN KẾT NGƯỜI DÙNG - VAI TRÒ (SYSTEM_USER_ROLES)
CREATE TABLE IF NOT EXISTS system_user_roles (
    user_id BIGINT NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 6. BẢNG THAM SỐ CẤU HÌNH HỆ THỐNG (SYSTEM_PARAMETERS)
CREATE TABLE IF NOT EXISTS system_parameters (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id   VARCHAR(64)  NOT NULL,
    param_key   VARCHAR(128) NOT NULL,
    param_value TEXT         NOT NULL,
    value_type  VARCHAR(32)  NOT NULL DEFAULT 'STRING',
    group_code  VARCHAR(64)  NOT NULL DEFAULT 'GENERAL',
    description TEXT,
    status      VARCHAR(32)  NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_system_params_tenant_key UNIQUE (tenant_id, param_key)
);

CREATE INDEX IF NOT EXISTS idx_system_params_tenant ON system_parameters(tenant_id);

-- =====================================================================================
-- SEED DỮ LIỆU KHỞI TẠO CHUẨN (IDEMPOTENT)
-- =====================================================================================

INSERT INTO system_permissions (code, name, description, module, action, is_active)
VALUES
    ('USER_MGMT',         'Quản lý Người Dùng',          'Quản trị danh sách và trạng thái tài khoản CMS',              'USER',     'ALL',  TRUE),
    ('ROLE_MGMT',         'Quản lý Vai Trò',             'Quản trị vai trò và phân quyền hệ thống',                   'ROLE',     'ALL',  TRUE),
    ('POLICY_MGMT',       'Quản lý Chính Sách',          'Cấu hình tỷ lệ tích điểm và hạn mức tiêu điểm',             'POLICY',   'ALL',  TRUE),
    ('VOUCHER_MGMT',      'Quản lý Voucher',             'Phát hành và điều phối kho mã ưu đãi',                      'VOUCHER',  'ALL',  TRUE),
    ('GAME_MGMT',         'Quản lý GameHub',             'Vận hành minigame, vòng quay may mắn và giải thưởng',       'GAME',     'ALL',  TRUE),
    ('CLEARING_MGMT',     'Quyết Toán Bù Trừ',           'Đối soát ba chiều và tạo lô thanh toán đối tác',           'CLEARING', 'ALL',  TRUE),
    ('AUDIT_LOG_VIEW',    'Xem Nhật Ký Kiểm Toán',       'Tra cứu lịch sử thao tác và dấu vết kiểm toán hệ thống',    'AUDIT',    'READ', TRUE),
    ('SYSTEM_PARAM_MGMT', 'Cấu Hình Tham Số',            'Quản lý tham số vận hành lõi của nền tảng',                 'SYSTEM',   'ALL',  TRUE),
    ('PARTNER_PORTAL',    'Truy Cập Cổng Đối Tác',       'Quản trị chi nhánh, nhân sự và đối soát trên Partner Portal','PARTNER', 'ALL',  TRUE)
ON CONFLICT (code) DO NOTHING;

-- Seed các vai trò chuẩn cho toàn bộ thuê bao hiện có + NATCASH mặc định
WITH seed_tenants AS (
    SELECT code AS tenant_id FROM tenants
    UNION
    SELECT 'NATCASH' AS tenant_id
    UNION
    SELECT 'TENANT_NATCASH' AS tenant_id
    UNION
    SELECT 'TENANT_DELIMART' AS tenant_id
    UNION
    SELECT 'TENANT_MICRO_CRM' AS tenant_id
)
INSERT INTO system_roles (tenant_id, code, name, description, is_system, status)
SELECT
    t.tenant_id,
    r.code,
    r.name,
    r.description,
    r.is_system,
    'ACTIVE'
FROM seed_tenants t
CROSS JOIN (VALUES
    ('SUPER_ADMIN',      'Quản Trị Tối Cao',              'Toàn quyền quản trị toàn bộ hệ sinh thái Loyalty & GameHub',        TRUE),
    ('LOYALTY_ADMIN',    'Quản Trị Vận Hành Loyalty',     'Quản trị vận hành chương trình khách hàng thân thiết & chiến dịch', TRUE),
    ('OPERATOR',         'Quản Trị Vận Hành',             'Vận hành minigame, chiến dịch điểm thưởng và voucher',               TRUE),
    ('CAMPAIGN_MANAGER', 'Quản Trị Chiến Dịch',           'Thiết lập cột mốc, phân khúc và kịch bản gợi nhắc hội viên',         FALSE),
    ('FINANCE_AUDITOR',  'Kiểm Toán & Đối Soát Tài Chính','Quyết toán kết chuyển kỳ bù trừ và đối soát liên minh',            TRUE),
    ('PARTNER_MANAGER',  'Quản Lý Đối Tác Liên Minh',     'Điều phối hồ sơ đối tác, chi nhánh và đề xuất ưu đãi',              FALSE),
    ('PARTNER_ADMIN',    'Quản Trị Viên Đối Tác',         'Quản trị vận hành doanh nghiệp trên Cổng Đối Tác',                  TRUE),
    ('CUSTOMER_SUPPORT', 'Chăm Sóc Khách Hàng',           'Tra cứu hồ sơ 360 hội viên và xử lý hỗ trợ giao dịch',              FALSE)
) AS r(code, name, description, is_system)
ON CONFLICT ON CONSTRAINT uq_system_roles_tenant_code DO NOTHING;

-- Gán quyền mặc định cho các vai trò
INSERT INTO system_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM system_roles r
JOIN system_permissions p ON (
    r.code IN ('SUPER_ADMIN', 'LOYALTY_ADMIN')
    OR (r.code IN ('OPERATOR', 'CAMPAIGN_MANAGER') AND p.code IN ('POLICY_MGMT', 'VOUCHER_MGMT', 'GAME_MGMT'))
    OR (r.code = 'FINANCE_AUDITOR' AND p.code IN ('CLEARING_MGMT', 'AUDIT_LOG_VIEW'))
    OR (r.code = 'PARTNER_MANAGER' AND p.code IN ('POLICY_MGMT', 'VOUCHER_MGMT', 'CLEARING_MGMT', 'PARTNER_PORTAL'))
    OR (r.code = 'PARTNER_ADMIN' AND p.code = 'PARTNER_PORTAL')
    OR (r.code = 'CUSTOMER_SUPPORT' AND p.code IN ('AUDIT_LOG_VIEW', 'VOUCHER_MGMT'))
)
ON CONFLICT DO NOTHING;

-- Seed tài khoản quản trị hệ thống & đối tác mặc định (mật khẩu được lưu dưới dạng băm SHA-256)
DO $$
DECLARE
    v_default_hash    VARCHAR(255) := '{sha256}ad89b64d66caa8e30e5d5ce4a9763f4ecc205814c412175f3e2c50027471426d';
    v_delimart_id     BIGINT;
    v_delimart_tenant VARCHAR(64);
BEGIN
    INSERT INTO system_users (tenant_id, username, password_hash, full_name, email, phone, status)
    VALUES
        ('TENANT_NATCASH', 'admin',           v_default_hash, 'Quản Trị Viên Hệ Thống',      'admin@mid.io.vn',    '+84988888888', 'ACTIVE'),
        ('TENANT_NATCASH', 'loyalty_admin',   v_default_hash, 'Nguyễn Văn Vận Hành',          'operator@mid.io.vn', '+84977777777', 'ACTIVE'),
        ('TENANT_NATCASH', 'campaign_mgr',    v_default_hash, 'Lê Minh Chiến Dịch',           'campaign@mid.io.vn', '+84966666661', 'ACTIVE'),
        ('TENANT_NATCASH', 'finance_auditor', v_default_hash, 'Trần Thị Đối Soát',            'finance@mid.io.vn',  '+84966666666', 'ACTIVE'),
        ('TENANT_NATCASH', 'support_user',    v_default_hash, 'Phạm Hỗ Trợ Hội Viên',         'support@mid.io.vn',  '+84955555555', 'ACTIVE')
    ON CONFLICT (username) DO NOTHING;

    SELECT id, tenant_id
    INTO v_delimart_id, v_delimart_tenant
    FROM loyalty_partners
    WHERE partner_code = 'DELIMART'
    ORDER BY CASE WHEN tenant_id = 'TENANT_DELIMART' THEN 0 ELSE 1 END, id ASC
    LIMIT 1;

    IF v_delimart_id IS NOT NULL THEN
        INSERT INTO system_users (tenant_id, username, password_hash, full_name, email, phone, partner_id, partner_code, status)
        VALUES
            (v_delimart_tenant, 'delimart',      v_default_hash, 'Quản Trị Viên Delimart', 'partner@delimart.ht',       '+50937000001', v_delimart_id, 'DELIMART', 'ACTIVE'),
            (v_delimart_tenant, 'partner',       v_default_hash, 'Cổng Đối Tác Delimart',  'portal@delimart.ht',        '+50937000002', v_delimart_id, 'DELIMART', 'ACTIVE'),
            (v_delimart_tenant, 'partner_admin', v_default_hash, 'Điều Hành Delimart',     'partner-admin@delimart.ht', '+50937000003', v_delimart_id, 'DELIMART', 'ACTIVE')
        ON CONFLICT (username) DO NOTHING;
    END IF;

    -- Gán vai trò cho tài khoản quản trị hệ thống & đối tác
    INSERT INTO system_user_roles (user_id, role_id)
    SELECT u.id, r.id
    FROM system_users u
    JOIN system_roles r ON r.tenant_id = u.tenant_id AND (
        (u.username = 'admin'           AND r.code = 'SUPER_ADMIN')
        OR (u.username = 'loyalty_admin'   AND r.code IN ('LOYALTY_ADMIN', 'OPERATOR'))
        OR (u.username = 'campaign_mgr'    AND r.code = 'CAMPAIGN_MANAGER')
        OR (u.username = 'finance_auditor' AND r.code = 'FINANCE_AUDITOR')
        OR (u.username = 'support_user'    AND r.code = 'CUSTOMER_SUPPORT')
        OR (u.username IN ('delimart', 'partner', 'partner_admin') AND r.code = 'PARTNER_ADMIN')
    )
    ON CONFLICT DO NOTHING;

    -- Làm sạch bản ghi trùng tài khoản owner_delimart ở tenant phụ NATCASH và đồng bộ mật khẩu hash cho nhân viên đối tác
    DELETE FROM partner_staff_accounts
    WHERE tenant_id = 'NATCASH' AND username = 'owner_delimart';

    UPDATE partner_staff_accounts
    SET password_hash = v_default_hash
    WHERE password_hash IS NULL OR TRIM(password_hash) = '';
END $$;

-- Seed bộ tham số hệ thống chuẩn cho toàn bộ thuê bao
WITH seed_tenants AS (
    SELECT code AS tenant_id FROM tenants
    UNION
    SELECT 'NATCASH' AS tenant_id
    UNION
    SELECT 'TENANT_NATCASH' AS tenant_id
    UNION
    SELECT 'TENANT_DELIMART' AS tenant_id
    UNION
    SELECT 'TENANT_MICRO_CRM' AS tenant_id
)
INSERT INTO system_parameters (tenant_id, param_key, param_value, value_type, group_code, description, status)
SELECT
    t.tenant_id,
    v.param_key,
    v.param_value,
    v.value_type,
    v.group_code,
    v.description,
    'ACTIVE'
FROM seed_tenants t
CROSS JOIN (VALUES
    ('LOYALTY_POINT_EXCHANGE_RATE_HTG',    '1.0',  'DECIMAL', 'LOYALTY',  'Tỷ giá quy đổi điểm thưởng sang tiền tệ thanh toán (1 Điểm = 1 HTG)'),
    ('REWARD_WALLET_DYNAMIC_QR_TTL_SECONDS','60',  'INTEGER', 'WALLET',   'Thời gian sống (TTL) của mã QR động thanh toán Ví Phần Thưởng tại POS'),
    ('REDISSON_LOCK_BURN_TIMEOUT_MS',      '3000', 'INTEGER', 'SECURITY', 'Thời gian chờ khóa phân tán Redisson RLock chống tiêu điểm kép'),
    ('HMAC_DRIFT_TOLERANCE_SECONDS',       '300',  'INTEGER', 'SECURITY', 'Dung sai lệch thời gian chữ ký số bảo mật HMAC-SHA256 (±300 giây)'),
    ('TIER_EVALUATION_CYCLE_MONTHS',       '12',   'INTEGER', 'TIER',     'Chu kỳ tự động đánh giá thăng hạng và hạ hạng hội viên (12 tháng)'),
    ('GAME_LUCKY_DRAW_FREE_DAILY_TURNS',   '2',    'INTEGER', 'GAMEHUB',  'Số lượt quay thưởng GameHub miễn phí mỗi ngày cho hội viên'),
    ('MAX_DAILY_BURN_PERCENTAGE',          '50',   'INTEGER', 'POLICY',   'Tỷ lệ khấu trừ điểm tối đa trên tổng giá trị hóa đơn (50%)'),
    ('MIN_BURN_POINTS_TRANSACTION',        '10',   'INTEGER', 'POLICY',   'Số điểm tối thiểu trong một giao dịch tiêu điểm')
) AS v(param_key, param_value, value_type, group_code, description)
ON CONFLICT ON CONSTRAINT uq_system_params_tenant_key DO NOTHING;
