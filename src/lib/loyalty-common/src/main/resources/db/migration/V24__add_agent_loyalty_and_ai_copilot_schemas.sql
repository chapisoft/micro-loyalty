-- ==============================================================================
-- FLYWAY MIGRATION V23: AGENT / SUPER AGENT LOYALTY, PLAYBOOKS & AI COPILOT
-- Hệ Sinh Thái Khách Hàng Thân Thiết Liên Minh & Cổng Game Đa Thuê Bao (micro-loyalty)
-- Cơ sở dữ liệu: PostgreSQL 15+ (loyalty_db)
-- ==============================================================================

-- 1. BẢNG CHƯƠNG TRÌNH ĐẠI LÝ & TỔNG ĐẠI LÝ (AGENT_LOYALTY_PROGRAMS)
CREATE TABLE IF NOT EXISTS agent_loyalty_programs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    agent_code VARCHAR(80) NOT NULL,
    external_user_id VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(30),
    agent_role VARCHAR(30) NOT NULL DEFAULT 'AGENT', -- AGENT, SUPER_AGENT
    super_agent_id BIGINT REFERENCES agent_loyalty_programs(id) ON DELETE SET NULL,
    province VARCHAR(100),
    monthly_customer_target INT NOT NULL DEFAULT 100,
    reward_amount_htg NUMERIC(18, 2) NOT NULL DEFAULT 2000.00,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_agent_code UNIQUE (tenant_id, agent_code)
);

CREATE INDEX IF NOT EXISTS idx_agent_programs_user ON agent_loyalty_programs(tenant_id, external_user_id);
CREATE INDEX IF NOT EXISTS idx_agent_programs_super ON agent_loyalty_programs(super_agent_id);

-- 2. BẢNG KPI ĐẠI LÝ HÀNG THÁNG (AGENT_MONTHLY_KPIS)
CREATE TABLE IF NOT EXISTS agent_monthly_kpis (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    agent_id BIGINT NOT NULL REFERENCES agent_loyalty_programs(id) ON DELETE CASCADE,
    kpi_month VARCHAR(10) NOT NULL, -- YYYY-MM
    ekyc_count INT NOT NULL DEFAULT 0,
    first_tx_count INT NOT NULL DEFAULT 0,
    qualified_customers INT NOT NULL DEFAULT 0,
    target_customers INT NOT NULL DEFAULT 100,
    reward_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    reward_status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, ELIGIBLE, APPROVED, PAID
    reward_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_agent_monthly_kpi UNIQUE (tenant_id, agent_id, kpi_month)
);

-- 3. BẢNG KPI MẠNG LƯỚI TỔNG ĐẠI LÝ (SUPER_AGENT_NETWORK_KPIS)
CREATE TABLE IF NOT EXISTS super_agent_network_kpis (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    super_agent_id BIGINT NOT NULL REFERENCES agent_loyalty_programs(id) ON DELETE CASCADE,
    kpi_month VARCHAR(10) NOT NULL,
    total_sub_agents INT NOT NULL DEFAULT 0,
    qualified_sub_agents INT NOT NULL DEFAULT 0,
    achievement_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    min_rate_required_pct NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    reward_amount NUMERIC(18, 2) NOT NULL DEFAULT 10000.00,
    reward_status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_super_agent_kpi UNIQUE (tenant_id, super_agent_id, kpi_month)
);

-- 4. BẢNG CẨM NANG HỖ TRỢ ĐẠI LÝ (SUPPORT_PLAYBOOKS)
CREATE TABLE IF NOT EXISTS support_playbooks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    playbook_code VARCHAR(80) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    locale VARCHAR(10) NOT NULL DEFAULT 'ht',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_support_playbook UNIQUE (tenant_id, playbook_code)
);

-- 5. BẢNG LƯU VẾT ĐỀ XUẤT CHIẾN DỊCH AI COPILOT (AI_CAMPAIGN_SUGGESTIONS)
CREATE TABLE IF NOT EXISTS ai_campaign_suggestions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    objective VARCHAR(255) NOT NULL,
    target_segment VARCHAR(50),
    budget_cap NUMERIC(18, 2),
    suggested_config JSONB NOT NULL,
    conflicts_detected JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_roi_pct NUMERIC(8, 2),
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. SEED TỔNG ĐẠI LÝ, ĐẠI LÝ TUYẾN DƯỚI, KPI THÁNG & CẨM NANG HỖ TRỢ HAITI
INSERT INTO agent_loyalty_programs (
    tenant_id, agent_code, external_user_id, full_name, phone_number,
    agent_role, province, monthly_customer_target, reward_amount_htg, status
) VALUES
(
    'TENANT_NATCASH', 'SA_PAP_001', '50937000001', 'Jean-Claude Super Agent Ouest', '+50937000001',
    'SUPER_AGENT', 'Ouest', 100, 10000.00, 'ACTIVE'
)
ON CONFLICT (tenant_id, agent_code) DO NOTHING;

INSERT INTO agent_loyalty_programs (
    tenant_id, agent_code, external_user_id, full_name, phone_number,
    agent_role, super_agent_id, province, monthly_customer_target, reward_amount_htg, status
)
SELECT
    'TENANT_NATCASH', v.agent_code, v.external_user_id, v.full_name, v.phone_number,
    'AGENT', sa.id, v.province, 100, 2000.00, 'ACTIVE'
FROM (
    VALUES
    ('AG_DEL_001', '50937123456', 'Agent Delmas 32 - Marc Antoine', '+50937123456', 'Ouest'),
    ('AG_DEL_002', '50937000002', 'Agent Pétion-Ville - Nadège Louis', '+50937000002', 'Ouest'),
    ('AG_CAP_001', '50937000003', 'Agent Cap-Haïtien - Fritzner Paul', '+50937000003', 'Nord')
) AS v(agent_code, external_user_id, full_name, phone_number, province)
JOIN agent_loyalty_programs sa ON sa.tenant_id = 'TENANT_NATCASH' AND sa.agent_code = 'SA_PAP_001'
ON CONFLICT (tenant_id, agent_code) DO NOTHING;

INSERT INTO agent_monthly_kpis (
    tenant_id, agent_id, kpi_month, ekyc_count, first_tx_count, qualified_customers,
    target_customers, reward_eligible, reward_status, reward_amount
)
SELECT
    a.tenant_id,
    a.id,
    '2026-11',
    CASE a.agent_code WHEN 'AG_DEL_001' THEN 118 WHEN 'AG_DEL_002' THEN 105 ELSE 64 END,
    CASE a.agent_code WHEN 'AG_DEL_001' THEN 104 WHEN 'AG_DEL_002' THEN 101 ELSE 52 END,
    CASE a.agent_code WHEN 'AG_DEL_001' THEN 104 WHEN 'AG_DEL_002' THEN 101 ELSE 52 END,
    100,
    CASE WHEN a.agent_code IN ('AG_DEL_001', 'AG_DEL_002') THEN TRUE ELSE FALSE END,
    CASE WHEN a.agent_code IN ('AG_DEL_001', 'AG_DEL_002') THEN 'ELIGIBLE' ELSE 'IN_PROGRESS' END,
    CASE WHEN a.agent_code IN ('AG_DEL_001', 'AG_DEL_002') THEN 2000.00 ELSE 0.00 END
FROM agent_loyalty_programs a
WHERE a.tenant_id = 'TENANT_NATCASH' AND a.agent_role = 'AGENT'
ON CONFLICT (tenant_id, agent_id, kpi_month) DO NOTHING;

INSERT INTO super_agent_network_kpis (
    tenant_id, super_agent_id, kpi_month, total_sub_agents, qualified_sub_agents,
    achievement_rate_pct, min_rate_required_pct, reward_amount, reward_status
)
SELECT
    sa.tenant_id, sa.id, '2026-11', 3, 2, 66.67, 50.00, 10000.00, 'ELIGIBLE'
FROM agent_loyalty_programs sa
WHERE sa.tenant_id = 'TENANT_NATCASH' AND sa.agent_code = 'SA_PAP_001'
ON CONFLICT (tenant_id, super_agent_id, kpi_month) DO NOTHING;

INSERT INTO support_playbooks (tenant_id, playbook_code, title, category, steps_json, locale, status)
VALUES
(
    'TENANT_NATCASH', 'PB_EKYC_ASSIST', 'Hướng dẫn hỗ trợ khách hàng định danh eKYC và giao dịch đầu', 'ONBOARDING',
    '[{"step":1,"title":"Kiểm tra giấy tờ CIN/Passport","detail":"Chụp rõ 2 mặt giấy tờ bản gốc, không bị lóa sáng"},{"step":2,"title":"Xác thực sinh trắc học","detail":"Hướng dẫn khách hàng nhìn thẳng vào camera trong đủ ánh sáng"},{"step":3,"title":"Thực hiện giao dịch nạp/thanh toán đầu >= 50 HTG","detail":"Giúp khách kích hoạt ngay 100 Natcash Coin chào mừng"}]'::jsonb,
    'vi', 'ACTIVE'
),
(
    'TENANT_NATCASH', 'PB_SUB_AGENT_COACH', 'Kịch bản thúc đẩy đại lý dưới 50% chỉ tiêu tháng', 'NETWORK_COACHING',
    '[{"step":1,"title":"Rà soát điểm bán có lượng eKYC thấp","detail":"Kiểm tra danh sách đại lý có dưới 50 khách/tháng vào ngày 15"},{"step":2,"title":"Cấp tài liệu POSM & mã QR giới thiệu","detail":"Trang bị bảng mã QR tại quầy đại lý"},{"step":3,"title":"Tổ chức ngày hội kích hoạt ví tại chợ địa phương","detail":"Đồng hành cùng đại lý tuyến dưới để đạt ngưỡng 100 khách/tháng"}]'::jsonb,
    'vi', 'ACTIVE'
)
ON CONFLICT (tenant_id, playbook_code) DO NOTHING;
