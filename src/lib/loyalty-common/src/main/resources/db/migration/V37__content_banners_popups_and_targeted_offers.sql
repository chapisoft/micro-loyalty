-- =====================================================================================
-- V37: Banners, Startup Popup Rules & Targeted Offers (Figma 18/11 · CN-06 · Plan GĐ 5)
--  * content_banners       : Placement-based banners with i18n JSON, deep link, segment & schedule
--  * popup_rules           : Priority-ordered startup popups (max 1/open, 24h cooldown, 08:00-20:00)
--  * popup_impression_logs : Tracks 24h popup cooldown per user
--  * targeted_offers       : Segment-targeted offers dispatched to Inbox + Push
-- Dialect: PostgreSQL 15+
-- =====================================================================================

CREATE TABLE IF NOT EXISTS content_banners (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id     VARCHAR(50)  NOT NULL,
    placement     VARCHAR(40)  NOT NULL DEFAULT 'LOYALTY_HOME',
    title         VARCHAR(255) NOT NULL,
    subtitle      VARCHAR(500),
    cta_label     VARCHAR(100),
    image_url     VARCHAR(500),
    deep_link     VARCHAR(300),
    segment_code  VARCHAR(80)  NOT NULL DEFAULT 'ALL',
    i18n_json     TEXT,
    display_order INTEGER      NOT NULL DEFAULT 1,
    start_date    TIMESTAMPTZ,
    end_date      TIMESTAMPTZ,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_banners_lookup
    ON content_banners(tenant_id, placement, status, display_order);

CREATE TABLE IF NOT EXISTS popup_rules (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id         VARCHAR(50)  NOT NULL,
    rule_code         VARCHAR(60)  NOT NULL,
    popup_type        VARCHAR(40)  NOT NULL,
    priority          INTEGER      NOT NULL DEFAULT 1,
    threshold_days    INTEGER,
    title             VARCHAR(255) NOT NULL,
    body              VARCHAR(500),
    cta_label         VARCHAR(100),
    deep_link         VARCHAR(300),
    segment_code      VARCHAR(80)  NOT NULL DEFAULT 'ALL',
    window_start_hour INTEGER      NOT NULL DEFAULT 8,
    window_end_hour   INTEGER      NOT NULL DEFAULT 20,
    cooldown_hours    INTEGER      NOT NULL DEFAULT 24,
    enabled           BOOLEAN      NOT NULL DEFAULT TRUE,
    status            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_popup_rules_tenant_code UNIQUE (tenant_id, rule_code)
);

CREATE INDEX IF NOT EXISTS idx_popup_rules_priority
    ON popup_rules(tenant_id, enabled, status, priority);

CREATE TABLE IF NOT EXISTS popup_impression_logs (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id        VARCHAR(50)  NOT NULL,
    external_user_id VARCHAR(100) NOT NULL,
    rule_code        VARCHAR(60)  NOT NULL,
    shown_at         TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_popup_impressions_user
    ON popup_impression_logs(tenant_id, external_user_id, shown_at DESC);

CREATE TABLE IF NOT EXISTS targeted_offers (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id    VARCHAR(50)  NOT NULL,
    offer_code   VARCHAR(80)  NOT NULL,
    title        VARCHAR(255) NOT NULL,
    body         TEXT         NOT NULL,
    segment_code VARCHAR(80)  NOT NULL DEFAULT 'ALL',
    voucher_code VARCHAR(100),
    channels     VARCHAR(120) NOT NULL DEFAULT 'INBOX,PUSH',
    deep_link    VARCHAR(300),
    valid_until  TIMESTAMPTZ,
    sent_count   INTEGER      NOT NULL DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    status       VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_targeted_offers_tenant
    ON targeted_offers(tenant_id, status, created_at DESC);

-- Seed default startup popup priority rules (Figma 18/11 CN-06)
WITH seed_tenants AS (
    SELECT code AS tenant_id FROM tenants
    UNION SELECT 'NATCASH'
    UNION SELECT 'TENANT_NATCASH'
    UNION SELECT 'TENANT_DELIMART'
)
INSERT INTO popup_rules (
    tenant_id, rule_code, popup_type, priority, threshold_days, title, body, cta_label, deep_link,
    segment_code, window_start_hour, window_end_hour, cooldown_hours, enabled, status
)
SELECT t.tenant_id, r.rule_code, r.popup_type, r.priority, r.threshold_days, r.title, r.body, r.cta_label, r.deep_link,
       'ALL', 8, 20, 24, TRUE, 'ACTIVE'
FROM seed_tenants t
CROSS JOIN (VALUES
    ('REWARD_READY',     'REWARD_READY',     1, NULL, 'You have a reward to claim', 'Your mission reward is ready to claim.',                   'Claim reward', '/missions'),
    ('VOUCHER_EXPIRING', 'VOUCHER_EXPIRING', 2, 3,    'Your voucher expires soon',  'Use your voucher before it expires.',                      'Use voucher',  '/my-vouchers'),
    ('MISSION_ENDING',   'MISSION_ENDING',   3, 2,    'A mission ends soon',        'Complete your mission before the deadline to earn coins.', 'See mission',  '/missions'),
    ('CAMPAIGN_PROMO',   'CAMPAIGN_POPUP',   4, NULL, 'Special offer this week',    'Collect free vouchers and double coins at partner stores.', 'Explore now',  '/rewards')
) AS r(rule_code, popup_type, priority, threshold_days, title, body, cta_label, deep_link)
ON CONFLICT (tenant_id, rule_code) DO NOTHING;

-- Seed default Loyalty Home banner
WITH seed_tenants AS (
    SELECT code AS tenant_id FROM tenants
    UNION SELECT 'NATCASH'
    UNION SELECT 'TENANT_NATCASH'
    UNION SELECT 'TENANT_DELIMART'
)
INSERT INTO content_banners (
    tenant_id, placement, title, subtitle, cta_label, deep_link, segment_code, display_order, status
)
SELECT t.tenant_id, 'LOYALTY_HOME',
       'Double coins at Delimart this week',
       'Pay with Natcash at the counter and earn 2x coins on groceries.',
       'See vouchers', '/rewards', 'ALL', 1, 'ACTIVE'
FROM seed_tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM content_banners b WHERE b.tenant_id = t.tenant_id AND b.placement = 'LOYALTY_HOME'
);
