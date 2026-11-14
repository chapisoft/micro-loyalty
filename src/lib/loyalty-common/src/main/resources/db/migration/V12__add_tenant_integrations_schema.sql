-- =========================================================================================
-- V12: THIẾT KẾ CẤU HÌNH TÍCH HỢP ĐA THUÊ BAO (MULTI-TENANT INTEGRATIONS SCHEMA)
-- Hỗ trợ cấu hình Cổng Ngân hàng / Ví và Cổng SMS riêng biệt cho từng Tenant (SaaS & On-Premise)
-- =========================================================================================

CREATE TABLE IF NOT EXISTS loyalty_tenant_integrations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    integration_type VARCHAR(50) NOT NULL, -- 'PAYMENT_GATEWAY', 'SMS_BRANDNAME', 'EMAIL_GATEWAY'
    provider_code VARCHAR(50) NOT NULL,    -- 'NATCASH', 'TWILIO', 'NATCOM_VAS', 'VIETCOMBANK', 'GENERIC_REST'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    endpoint_url VARCHAR(500) NOT NULL,
    auth_type VARCHAR(50) NOT NULL DEFAULT 'NONE', -- 'API_KEY', 'BEARER_TOKEN', 'BASIC_AUTH', 'HMAC_SHA256', 'NONE'
    auth_credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
    additional_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_integration_type UNIQUE (tenant_id, integration_type)
);

CREATE INDEX IF NOT EXISTS idx_tenant_integrations_lookup ON loyalty_tenant_integrations(tenant_id, is_active);

-- Seed cấu hình mặc định cho các đối tác mẫu:
-- 1. Tenant Natcash: Dùng Core Ví Natcash và SMS Natcom
INSERT INTO loyalty_tenant_integrations (tenant_id, integration_type, provider_code, is_active, endpoint_url, auth_type, auth_credentials, additional_params)
VALUES 
('TENANT_NATCASH', 'PAYMENT_GATEWAY', 'NATCASH', TRUE, 'http://10.228.37.65:8080/api/v1/wallet/deduct', 'API_KEY', '{"apiKey":"NC_PROD_KEY_SECRET"}'::jsonb, '{"timeoutMs":3000}'::jsonb),
('TENANT_NATCASH', 'SMS_BRANDNAME', 'NATCOM_VAS', TRUE, 'http://10.228.33.70:9725/vasp/Service.asmx', 'BASIC_AUTH', '{"username":"gwhaiti","password":"gwhaiti"}'::jsonb, '{"brandname":"NATCASH","shortCode":"202"}'::jsonb)
ON CONFLICT (tenant_id, integration_type) DO NOTHING;

-- 2. Tenant Siêu Thị Delimart: Dùng Cổng REST chung và SMS Twilio Quốc Tế
INSERT INTO loyalty_tenant_integrations (tenant_id, integration_type, provider_code, is_active, endpoint_url, auth_type, auth_credentials, additional_params)
VALUES 
('TENANT_DELIMART', 'PAYMENT_GATEWAY', 'GENERIC_REST', TRUE, 'https://api.delimart.ht/v1/co-pay', 'BEARER_TOKEN', '{"token":"DELIMART_BANK_TOKEN_2026"}'::jsonb, '{"currency":"HTG","timeoutMs":5000}'::jsonb),
('TENANT_DELIMART', 'SMS_BRANDNAME', 'TWILIO', TRUE, 'https://api.twilio.com/2010-04-01/Accounts', 'BASIC_AUTH', '{"accountSid":"AC_DELIMART_TWILIO","authToken":"AUTH_DELI_SECRET"}'::jsonb, '{"brandname":"DELIMART","fromNumber":"+18005550199"}'::jsonb)
ON CONFLICT (tenant_id, integration_type) DO NOTHING;
