-- ==============================================================================
-- FLYWAY MIGRATION V19: 4-LEVEL PARTNER HIERARCHY, API KEY ROTATION & PAYMENT BATCHES
-- Hệ Sinh Thái Khách Hàng Thân Thiết Liên Minh & Cổng Game Đa Thuê Bao (micro-loyalty)
-- Cơ sở dữ liệu: PostgreSQL 15+ (loyalty_db)
-- ==============================================================================

-- 1. BẢNG CHI NHÁNH & ĐIỂM THANH TOÁN (PARTNER_BRANCHES - HỖ TRỢ CẢ NATCASH LM-02 VÀ PARTNER LM-08)
CREATE TABLE IF NOT EXISTS partner_branches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    partner_id BIGINT REFERENCES loyalty_partners(id) ON DELETE CASCADE,
    branch_code VARCHAR(80) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    payment_point_code VARCHAR(80),
    is_natcash_own BOOLEAN NOT NULL DEFAULT FALSE,
    province VARCHAR(100),
    address VARCHAR(500),
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    phone_number VARCHAR(30),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_partner_branch UNIQUE (tenant_id, branch_code)
);

CREATE INDEX IF NOT EXISTS idx_partner_branches_tenant_partner ON partner_branches(tenant_id, partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_branches_natcash ON partner_branches(tenant_id, is_natcash_own);

-- 2. BẢNG NHÓM SẢN PHẨM ĐỐI TÁC (PARTNER_PRODUCT_GROUPS)
CREATE TABLE IF NOT EXISTS partner_product_groups (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    partner_id BIGINT NOT NULL REFERENCES loyalty_partners(id) ON DELETE CASCADE,
    group_code VARCHAR(80) NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    description TEXT,
    earn_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    max_burn_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_partner_product_group UNIQUE (tenant_id, partner_id, group_code)
);

CREATE INDEX IF NOT EXISTS idx_partner_product_groups_partner ON partner_product_groups(tenant_id, partner_id);

-- 3. BẢNG DANH MỤC SẢN PHẨM ĐỐI TÁC (PARTNER_PRODUCTS)
CREATE TABLE IF NOT EXISTS partner_products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    partner_id BIGINT NOT NULL REFERENCES loyalty_partners(id) ON DELETE CASCADE,
    product_group_id BIGINT REFERENCES partner_product_groups(id) ON DELETE SET NULL,
    sku_code VARCHAR(80) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_partner_product UNIQUE (tenant_id, partner_id, sku_code)
);

CREATE INDEX IF NOT EXISTS idx_partner_products_group ON partner_products(product_group_id);

-- 4. BẢNG TÀI KHOẢN NHÂN VIÊN ĐỐI TÁC (PARTNER_STAFF_ACCOUNTS)
CREATE TABLE IF NOT EXISTS partner_staff_accounts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    partner_id BIGINT NOT NULL REFERENCES loyalty_partners(id) ON DELETE CASCADE,
    branch_id BIGINT REFERENCES partner_branches(id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(30),
    role_code VARCHAR(50) NOT NULL DEFAULT 'PARTNER_CASHIER', -- PARTNER_OWNER, PARTNER_BRANCH_MANAGER, PARTNER_CASHIER
    password_hash VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_partner_staff_username UNIQUE (tenant_id, username)
);

CREATE INDEX IF NOT EXISTS idx_partner_staff_partner ON partner_staff_accounts(tenant_id, partner_id);

-- 5. BẢNG KHÓA API ĐỐI TÁC & XOAY VÒNG GRACE PERIOD (PARTNER_API_KEYS)
CREATE TABLE IF NOT EXISTS partner_api_keys (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    partner_id BIGINT NOT NULL REFERENCES loyalty_partners(id) ON DELETE CASCADE,
    key_name VARCHAR(120) NOT NULL,
    key_prefix VARCHAR(30) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    scopes VARCHAR(255) DEFAULT 'READ,REDEEM,SETTLEMENT',
    expires_at TIMESTAMPTZ,
    grace_expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, GRACE_PERIOD, REVOKED
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partner_api_keys_partner ON partner_api_keys(tenant_id, partner_id, status);

-- 6. BẢNG LÔ THANH TOÁN ĐỐI SOÁT & MDR FEE (CLEARING_PAYMENT_BATCHES)
CREATE TABLE IF NOT EXISTS clearing_payment_batches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    batch_code VARCHAR(80) NOT NULL UNIQUE,
    partner_id BIGINT NOT NULL REFERENCES loyalty_partners(id),
    period VARCHAR(30) NOT NULL,
    gross_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    mdr_fee_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    net_payable_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    excluded_dispute_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    tx_count INT NOT NULL DEFAULT 0,
    confirm_deadline_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    confirmed_by VARCHAR(100),
    paid_at TIMESTAMPTZ,
    bank_ref_code VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_CONFIRM', -- PENDING_CONFIRM, CONFIRMED, DISPUTED, PAID
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clearing_payment_batches_partner ON clearing_payment_batches(tenant_id, partner_id, status);

-- 7. NÂNG CẤP BẢNG CHÍNH SÁCH 4 CẤP & VERSIONING (LOYALTY_ACCEPTANCE_POLICIES)
ALTER TABLE loyalty_acceptance_policies
    DROP CONSTRAINT IF EXISTS uq_partner_acceptance_policy;

ALTER TABLE loyalty_acceptance_policies
    ADD COLUMN IF NOT EXISTS hierarchy_level VARCHAR(30) NOT NULL DEFAULT 'PARTNER',
    ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES partner_branches(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS product_group_id BIGINT REFERENCES partner_product_groups(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS product_id BIGINT REFERENCES partner_products(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS version_no INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_active_version BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_policy_hierarchy
    ON loyalty_acceptance_policies(tenant_id, partner_id, hierarchy_level, is_active_version);

-- 8. SEED CHI NHÁNH, ĐIỂM THANH TOÁN HAITI/NATCASH, NHÓM SẢN PHẨM, NHÂN VIÊN & LÔ THANH TOÁN
INSERT INTO partner_branches (
    tenant_id, partner_id, branch_code, branch_name, payment_point_code, is_natcash_own,
    province, address, latitude, longitude, phone_number, status
)
SELECT
    'TENANT_NATCASH',
    p.id,
    v.branch_code,
    v.branch_name,
    v.payment_point_code,
    v.is_natcash_own,
    v.province,
    v.address,
    v.latitude,
    v.longitude,
    v.phone_number,
    'ACTIVE'
FROM (
    VALUES
    ('NATCASH_WALLET', 'NC_PP_DELMAS32', 'Natcash Hub Delmas 32', 'PP-PAP-001', TRUE, 'Ouest', 'Autoroute de Delmas 32, Port-au-Prince', 18.545000, -72.301000, '+50937001001'),
    ('NATCASH_WALLET', 'NC_PP_PETIONVILLE', 'Natcash Point Pétion-Ville', 'PP-PVL-002', TRUE, 'Ouest', 'Rue Grégoire, Pétion-Ville', 18.512500, -72.285300, '+50937001002'),
    ('NATCASH_WALLET', 'NC_PP_CAPHAITIEN', 'Natcash Center Cap-Haïtien', 'PP-CAP-003', TRUE, 'Nord', 'Boulevard du Carénage, Cap-Haïtien', 19.759200, -72.198100, '+50937001003'),
    ('NATCOM_TELCO', 'NATCOM_BR_CHAMPMARS', 'Natcom Flagship Champ de Mars', 'PP-NTC-101', FALSE, 'Ouest', 'Rue Capois, Champ de Mars, Port-au-Prince', 18.540300, -72.337100, '+50922220001'),
    ('EDH_POWER', 'EDH_BR_CENTRAL', 'EDH Caisse Centrale Port-au-Prince', 'PP-EDH-201', FALSE, 'Ouest', 'Angle Rues Pavée et du Centre, Port-au-Prince', 18.548100, -72.341200, '+50922120001')
) AS v(partner_code, branch_code, branch_name, payment_point_code, is_natcash_own, province, address, latitude, longitude, phone_number)
JOIN loyalty_partners p ON p.tenant_id = 'TENANT_NATCASH' AND p.partner_code = v.partner_code
ON CONFLICT (tenant_id, branch_code) DO NOTHING;

INSERT INTO partner_branches (
    tenant_id, partner_id, branch_code, branch_name, payment_point_code, is_natcash_own,
    province, address, latitude, longitude, phone_number, status
)
SELECT
    'TENANT_DELIMART',
    p.id,
    v.branch_code,
    v.branch_name,
    v.payment_point_code,
    v.is_natcash_own,
    v.province,
    v.address,
    v.latitude,
    v.longitude,
    v.phone_number,
    'ACTIVE'
FROM (
    VALUES
    ('DELIMART', 'DELI_BR_DELMAS', 'Delimart Supermarket Delmas 33', 'PP-DELI-001', FALSE, 'Ouest', 'Delmas 33, Port-au-Prince', 18.546800, -72.297500, '+50928110001'),
    ('DELIMART', 'DELI_BR_PETION', 'Delimart Express Pétion-Ville', 'PP-DELI-002', FALSE, 'Ouest', 'Place Boyer, Pétion-Ville', 18.513800, -72.286900, '+50928110002')
) AS v(partner_code, branch_code, branch_name, payment_point_code, is_natcash_own, province, address, latitude, longitude, phone_number)
JOIN loyalty_partners p ON p.tenant_id = 'TENANT_DELIMART' AND p.partner_code = v.partner_code
ON CONFLICT (tenant_id, branch_code) DO NOTHING;

INSERT INTO partner_product_groups (
    tenant_id, partner_id, group_code, group_name, description, earn_rate_percent, max_burn_percentage, status
)
SELECT
    p.tenant_id,
    p.id,
    v.group_code,
    v.group_name,
    v.description,
    v.earn_rate_percent,
    v.max_burn_percentage,
    'ACTIVE'
FROM loyalty_partners p
CROSS JOIN (
    VALUES
    ('GROCERY_FRESH', 'Thực phẩm tươi sống & Nhu yếu phẩm', 'Áp dụng tích điểm 2% và tiêu điểm tối đa 50% tại quầy', 2.00, 50.00),
    ('TELECOM_DATA', 'Gói cước Data 4G & Nạp thẻ', 'Áp dụng thanh toán 100% bằng Natcash Coin', 1.50, 100.00)
) AS v(group_code, group_name, description, earn_rate_percent, max_burn_percentage)
WHERE p.partner_code IN ('NATCASH_WALLET', 'NATCOM_TELCO', 'DELIMART')
ON CONFLICT (tenant_id, partner_id, group_code) DO NOTHING;

INSERT INTO partner_staff_accounts (
    tenant_id, partner_id, branch_id, username, full_name, email, phone_number, role_code, status
)
SELECT
    p.tenant_id,
    p.id,
    b.id,
    'owner_' || LOWER(p.partner_code),
    'Quản trị ' || p.partner_name,
    LOWER(p.partner_code) || '@partner.natcash.ht',
    '+50937110001',
    'PARTNER_OWNER',
    'ACTIVE'
FROM loyalty_partners p
LEFT JOIN partner_branches b ON b.partner_id = p.id AND b.tenant_id = p.tenant_id
WHERE p.partner_code IN ('NATCASH_WALLET', 'NATCOM_TELCO', 'DELIMART')
ON CONFLICT (tenant_id, username) DO NOTHING;

INSERT INTO partner_api_keys (
    tenant_id, partner_id, key_name, key_prefix, key_hash, scopes, expires_at, status, created_by
)
SELECT
    p.tenant_id,
    p.id,
    'Primary POS Key (' || p.partner_code || ')',
    'nk_live_' || LOWER(SUBSTRING(p.partner_code, 1, 6)),
    'sha256_seeded_' || MD5(p.tenant_id || '_' || p.partner_code),
    'READ,REDEEM,SETTLEMENT',
    CURRENT_TIMESTAMP + INTERVAL '365 days',
    'ACTIVE',
    'admin'
FROM loyalty_partners p
WHERE p.partner_code IN ('NATCASH_WALLET', 'NATCOM_TELCO', 'DELIMART')
  AND NOT EXISTS (
      SELECT 1 FROM partner_api_keys k WHERE k.tenant_id = p.tenant_id AND k.partner_id = p.id
  );

INSERT INTO clearing_payment_batches (
    tenant_id, batch_code, partner_id, period, gross_amount, discount_amount,
    mdr_fee_amount, net_payable_amount, excluded_dispute_codes, tx_count, confirm_deadline_at, status
)
SELECT
    p.tenant_id,
    'PAY-202611-' || p.id,
    p.id,
    '2026-11',
    25000.00,
    1250.00,
    375.00,
    23375.00,
    '["KN-202611-001"]'::jsonb,
    48,
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    'PENDING_CONFIRM'
FROM loyalty_partners p
WHERE p.partner_code IN ('NATCOM_TELCO', 'DELIMART')
ON CONFLICT (batch_code) DO NOTHING;
