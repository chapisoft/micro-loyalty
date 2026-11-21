-- =====================================================================================
-- V41: Tham số cấu hình mã voucher động (6-8 ký tự nén từ chuỗi cấu trúc ký cặp khóa)
--  * VOUCHER_DYNAMIC_CODE_TTL_SECONDS: mặc định 300 giây (5 phút)
--  * VOUCHER_DYNAMIC_CODE_LENGTH: mặc định 8 ký tự (Crockford Base32, hỗ trợ 6-8 ký tự)
-- Dialect: PostgreSQL 15+
-- =====================================================================================

WITH seed_tenants AS (
    SELECT code AS tenant_id FROM tenants
    UNION SELECT 'NATCASH'
    UNION SELECT 'TENANT_NATCASH'
    UNION SELECT 'TENANT_DELIMART'
    UNION SELECT 'TENANT_MICRO_CRM'
)
INSERT INTO system_parameters (tenant_id, param_key, param_name, param_value, value_type, group_code, allowed_values, description, status)
SELECT t.tenant_id, v.param_key, v.param_name, v.param_value, v.value_type, v.group_code, NULL, v.description, 'ACTIVE'
FROM seed_tenants t
CROSS JOIN (VALUES
    ('VOUCHER_DYNAMIC_CODE_TTL_SECONDS', 'Thời gian hiệu lực mã sử dụng voucher động (giây)', '300', 'INTEGER', 'POLICY',
     'Thời gian sống của chuỗi mã động 6-8 ký tự khi người dùng bấm sử dụng voucher (mặc định 300 giây = 5 phút)'),
    ('VOUCHER_DYNAMIC_CODE_LENGTH', 'Độ dài mã sử dụng voucher động (6-8 ký tự)', '8', 'INTEGER', 'POLICY',
     'Số ký tự của mã voucher động nén theo chuẩn Crockford Base32 (hỗ trợ từ 6 đến 8 ký tự, khuyến nghị 8 ký tự)')
) AS v(param_key, param_name, param_value, value_type, group_code, description)
WHERE NOT EXISTS (
    SELECT 1 FROM system_parameters sp WHERE sp.tenant_id = t.tenant_id AND sp.param_key = v.param_key
);
