-- ==============================================================================
-- FLYWAY MIGRATION V4: Bổ sung các trường đồng bộ cho hệ thống gợi nhắc thông minh
-- ==============================================================================

-- 1. Bổ sung trường cho loyalty_communication_logs
ALTER TABLE loyalty_communication_logs ADD COLUMN IF NOT EXISTS external_user_id VARCHAR(100);
ALTER TABLE loyalty_communication_logs ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE loyalty_communication_logs ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE loyalty_communication_logs ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE loyalty_communication_logs ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE loyalty_communication_logs ALTER COLUMN account_id DROP NOT NULL;

-- 2. Bổ sung trường cho loyalty_engagement_triggers
ALTER TABLE loyalty_engagement_triggers ADD COLUMN IF NOT EXISTS message_template_vi TEXT;
ALTER TABLE loyalty_engagement_triggers ADD COLUMN IF NOT EXISTS message_template_en TEXT;
ALTER TABLE loyalty_engagement_triggers ADD COLUMN IF NOT EXISTS deep_link_url VARCHAR(500);
