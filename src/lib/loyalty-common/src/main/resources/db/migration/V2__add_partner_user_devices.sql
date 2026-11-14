-- ====================================================================================================
-- FLYWAY MIGRATION SCRIPT: V2__add_partner_user_devices.sql
-- MỤC TIÊU: Quản lý thiết bị đa thuê bao (Multi-tenant Device Registry) & Token đẩy tin FCM/APNs
-- HỆ QUẢN TRỊ CƠ SỞ DỮ LIỆU: PostgreSQL 15+
-- ====================================================================================================

CREATE TABLE IF NOT EXISTS partner_user_devices (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    partner_code VARCHAR(50) NOT NULL,
    external_user_id VARCHAR(100) NOT NULL,
    device_id VARCHAR(150) NOT NULL,
    fcm_token TEXT NOT NULL,
    device_type VARCHAR(20) NOT NULL DEFAULT 'ANDROID',
    app_version VARCHAR(30),
    language VARCHAR(10) NOT NULL DEFAULT 'vi',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_partner_user_device UNIQUE (tenant_id, partner_code, external_user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_device_user ON partner_user_devices(tenant_id, partner_code, external_user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_partner_device_token ON partner_user_devices(fcm_token);
