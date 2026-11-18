-- =====================================================================================
-- V35: "Who can join" a mission (CMS NV-05 Rule builder, Figma 18/11)
--  CUSTOMER missions show in the customer webview; AGENT / SUPER_AGENT ones only in the agent webview tabs.
-- Dialect: PostgreSQL 15+
-- =====================================================================================
ALTER TABLE loyalty_campaign_milestones
    ADD COLUMN IF NOT EXISTS audience_role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER';

CREATE INDEX IF NOT EXISTS idx_campaign_milestones_audience ON loyalty_campaign_milestones(tenant_id, audience_role, status);

ALTER TABLE campaign_rule_conditions
    ADD COLUMN IF NOT EXISTS audience_role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER';

CREATE INDEX IF NOT EXISTS idx_campaign_rule_conditions_audience ON campaign_rule_conditions(tenant_id, audience_role, status);
