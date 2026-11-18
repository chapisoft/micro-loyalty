-- =====================================================================================
-- V33: Tham số theo quyết định Figma 18/11 (QT-05)
--  * Mã thanh toán tại quầy là mã của KHÁCH, thu ngân quét (không phải QR cửa hàng) -> đổi tên/mô tả, giữ nguyên key.
--  * Tỷ lệ tối đa trả bằng coin trên hóa đơn 50% -> 30% (chỉ đổi giá trị đang để mặc định cũ).
--  * Thêm hạn mức hỏi PIN khi thu ngân quét và yêu cầu eKYC cho voucher miễn phí.
-- Dialect: PostgreSQL 15+
-- =====================================================================================

UPDATE system_parameters
SET param_name  = 'Customer pay code lifetime (seconds)',
    description = 'Lifetime of the customer pay code (QR / barcode) the cashier scans at the POS; each code works once'
WHERE param_key = 'REWARD_WALLET_DYNAMIC_QR_TTL_SECONDS';

UPDATE system_parameters
SET param_value = '30.00',
    description = 'Max share of the bill paid with coins (30%; partners may set lower)'
WHERE param_key = 'MAX_DAILY_BURN_PERCENTAGE'
  AND param_value IN ('50', '50.0', '50.00');

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
    ('PAY_AT_COUNTER_PIN_LIMIT_HTG', 'PIN limit at the counter (HTG)', '2000.00', 'DECIMAL', 'POLICY',
     'Ask for the PIN in the Natcash app above this amount after the cashier scans the customer code'),
    ('FREE_VOUCHER_REQUIRE_EKYC', 'Free vouchers need eKYC', 'true', 'BOOLEAN', 'POLICY',
     'Only verified wallets can collect free vouchers')
) AS v(param_key, param_name, param_value, value_type, group_code, description)
WHERE NOT EXISTS (
    SELECT 1 FROM system_parameters sp WHERE sp.tenant_id = t.tenant_id AND sp.param_key = v.param_key
);
