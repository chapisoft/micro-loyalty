-- =====================================================================================
-- V38: Master Data Voucher Categories, Mission Rules Description & Seed Data (Figma 18/11)
--  * Adds description column on loyalty_campaign_milestones so Mission Rules come from DB/CMS
--  * Seeds VOUCHER_CATEGORY group + 7 voucher categories in cfg_general_categories (Zero-Hardcode)
--  * Populates category_code & usage_type on existing vouchers where NULL
--  * Seeds 3 FREE_COLLECT vouchers (including Platinum-tier gated) & 2 COINS vouchers
--  * Seeds LOYALTY_CHECKIN_REWARDS in system_parameters if not already set
--  * Seeds Fuel up 3 times & Monthly spending missions with rules description & sample progress
-- Dialect: PostgreSQL 15+
-- =====================================================================================

-- 0. Add description column on loyalty_campaign_milestones (CMS Mission Rules)
ALTER TABLE loyalty_campaign_milestones
    ADD COLUMN IF NOT EXISTS description TEXT;

-- 1. Seed VOUCHER_CATEGORY Master Data in cfg_general_categories (Zero-Hardcode Filter & Store chips)
WITH seed_tenants AS (
    SELECT code AS tenant_id FROM tenants
    UNION SELECT 'SYSTEM'
    UNION SELECT 'DEFAULT'
    UNION SELECT 'NATCASH'
    UNION SELECT 'TENANT_NATCASH'
    UNION SELECT 'TENANT_DELIMART'
    UNION SELECT 'TENANT_MICRO_CRM'
)
INSERT INTO cfg_general_categories (tenant_id, category_type, code, name, display_order, status, description)
SELECT t.tenant_id, 'CATEGORY_GROUP', 'VOUCHER_CATEGORY', 'Voucher Category', 25, 1,
       'Categories displayed in Loyalty Vouchers Store and Filter sheet'
FROM seed_tenants t
ON CONFLICT ON CONSTRAINT pk_cfg_general_categories DO NOTHING;

WITH seed_tenants AS (
    SELECT code AS tenant_id FROM tenants
    UNION SELECT 'SYSTEM'
    UNION SELECT 'DEFAULT'
    UNION SELECT 'NATCASH'
    UNION SELECT 'TENANT_NATCASH'
    UNION SELECT 'TENANT_DELIMART'
    UNION SELECT 'TENANT_MICRO_CRM'
)
INSERT INTO cfg_general_categories (tenant_id, category_type, code, name, display_order, status, description, metadata)
SELECT t.tenant_id, 'VOUCHER_CATEGORY', c.code, c.name, c.display_order, 1, c.description, c.metadata
FROM seed_tenants t
CROSS JOIN (VALUES
    ('FOOD_DRINK',    'Food & drink',    1, 'Restaurants, coffee shops and beverages',          '{"icon":"FOOD_DRINK"}'),
    ('GROCERY',       'Grocery',         2, 'Supermarkets, fresh produce and convenience',       '{"icon":"GROCERY"}'),
    ('FUEL',          'Fuel',            3, 'Fuel stations and energy partners',                 '{"icon":"FUEL"}'),
    ('TELECOM',       'Telecom & data',  4, 'Mobile data packs, top-up and telecom services',   '{"icon":"TELECOM"}'),
    ('ENTERTAINMENT', 'Entertainment',   5, 'Streaming, cinema, music and digital leisure',      '{"icon":"ENTERTAINMENT"}'),
    ('HEALTH_BEAUTY', 'Health & beauty', 6, 'Pharmacies, wellness and personal care',            '{"icon":"HEALTH_BEAUTY"}'),
    ('SHOPPING',      'Shopping',        7, 'Retail stores, fashion and general merchandise',    '{"icon":"SHOPPING"}')
) AS c(code, name, display_order, description, metadata)
ON CONFLICT ON CONSTRAINT pk_cfg_general_categories DO NOTHING;

-- 2. Backfill category_code & usage_type on existing vouchers when empty
UPDATE loyalty_vouchers
SET category_code = CASE
        WHEN UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%DATA%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%GB%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%MB%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%AIRTIME%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%TOPUP%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%NATCOM%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%TELCO%' THEN 'TELECOM'
        WHEN UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%DELI%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%GROCERY%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%MARKET%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%SUPER%' THEN 'GROCERY'
        WHEN UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%FUEL%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%TOTAL%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%GAS%' THEN 'FUEL'
        WHEN UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%COFFEE%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%FOOD%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%DRINK%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%BAKERY%' THEN 'FOOD_DRINK'
        WHEN UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%CGV%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%RINGME%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%GAME%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%CINEMA%'
          OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%MUSIC%' THEN 'ENTERTAINMENT'
        ELSE 'SHOPPING'
    END
WHERE category_code IS NULL;

UPDATE loyalty_vouchers
SET usage_type = 'ONLINE',
    service_link = COALESCE(service_link, 'natcash://service/topup')
WHERE (UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%DATA%'
   OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%GB%'
   OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%MB%'
   OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%AIRTIME%'
   OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%TOPUP%'
   OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%UTILITY BILL%'
   OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%TELCO%')
  AND usage_type <> 'ONLINE';

UPDATE loyalty_vouchers
SET usage_type = 'NATCASH_STORE'
WHERE (UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%DELI%'
   OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%GROCERY%'
   OR UPPER(COALESCE(voucher_code, '') || ' ' || COALESCE(title, '')) LIKE '%OFF%')
  AND usage_type = 'PARTNER_CODE';

-- 3. Seed FREE_COLLECT & COINS vouchers for TENANT_NATCASH matching Figma Store (VQ-01)
INSERT INTO loyalty_vouchers (
    tenant_id, partner_id, voucher_code, title, description, discount_type, discount_value,
    min_bill_amount, total_quantity, available_quantity, point_cost, start_date, end_date, status,
    acquire_type, usage_type, category_code, audience_role, eligible_tiers, per_customer_limit,
    batch_quantity, batch_period, show_in_free_strip, strip_order, service_link
)
SELECT
    'TENANT_NATCASH',
    (SELECT id FROM loyalty_partners WHERE tenant_id = 'TENANT_NATCASH' AND partner_code = v.partner_code LIMIT 1),
    v.voucher_code, v.title, v.description, v.discount_type, v.discount_value,
    v.min_bill_amount, v.total_quantity, v.available_quantity, v.point_cost,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '180 days', 'ACTIVE',
    v.acquire_type, v.usage_type, v.category_code, 'CUSTOMER', v.eligible_tiers, 1,
    v.batch_quantity, v.batch_period, v.show_in_free_strip, v.strip_order, v.service_link
FROM (VALUES
    ('NAT_FREE_15HTG',      'NATCASH_WALLET', '15 HTG off',  'Valid on bills from 100 HTG at participating stores.', 'FIXED_AMOUNT', 15.00,  100.00, 200, 120, 0.00,  'FREE_COLLECT', 'NATCASH_STORE', 'GROCERY',    NULL,               200, 'WEEKLY', TRUE,  1, NULL),
    ('NAT_FREE_500MB',      'NATCOM_TELCO',   '500 MB data', '3-day data pack · activates directly on your Natcom line.', 'FIXED_AMOUNT', 500.00, 0.00, 150, 86, 0.00,  'FREE_COLLECT', 'ONLINE',        'TELECOM',    NULL,               150, 'WEEKLY', TRUE,  2, 'natcash://service/data'),
    ('NAT_FREE_100HTG_PLT', 'NATCASH_WALLET', '100 HTG off', 'Exclusive for Platinum & Diamond members on bills from 300 HTG.', 'FIXED_AMOUNT', 100.00, 300.00, 100, 45, 0.00, 'FREE_COLLECT', 'NATCASH_STORE', 'GROCERY',    'PLATINUM,DIAMOND', 100, 'WEEKLY', TRUE,  3, NULL),
    ('NAT_COIN_50HTG',      'NATCASH_WALLET', '50 HTG off',  'Bills from 200 HTG at participating partner counters.', 'FIXED_AMOUNT', 50.00,  200.00, 500, 460, 200.00, 'COINS',        'NATCASH_STORE', 'GROCERY',    NULL,               NULL, 'NONE',  FALSE, NULL, NULL),
    ('NAT_COIN_100HTG',     'NATCASH_WALLET', '100 HTG off', 'Bills from 400 HTG at participating partner counters.', 'FIXED_AMOUNT', 100.00, 400.00, 500, 430, 400.00, 'COINS',        'NATCASH_STORE', 'FOOD_DRINK', NULL,               NULL, 'NONE',  FALSE, NULL, NULL)
) AS v(
    voucher_code, partner_code, title, description, discount_type, discount_value, min_bill_amount,
    total_quantity, available_quantity, point_cost, acquire_type, usage_type, category_code,
    eligible_tiers, batch_quantity, batch_period, show_in_free_strip, strip_order, service_link
)
ON CONFLICT (tenant_id, voucher_code) DO NOTHING;

-- 4. Ensure LOYALTY_CHECKIN_REWARDS is seeded in system_parameters (Figma NV-01 / NV-03)
WITH seed_tenants AS (
    SELECT code AS tenant_id FROM tenants
    UNION SELECT 'TENANT_NATCASH'
    UNION SELECT 'TENANT_DELIMART'
)
INSERT INTO system_parameters (tenant_id, param_key, param_name, param_value, value_type, group_code, allowed_values, description, status)
SELECT t.tenant_id, 'LOYALTY_CHECKIN_REWARDS', 'Daily check-in 7-day coin schedule', '[10,20,30,40,50,80,200]', 'JSON', 'GAME', NULL,
       '7-day sequential coin rewards for Daily Check-in mission (day 1 to day 7)', 'ACTIVE'
FROM seed_tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM system_parameters sp WHERE sp.tenant_id = t.tenant_id AND sp.param_key = 'LOYALTY_CHECKIN_REWARDS'
);

-- 5. Backfill mission rules description on existing seeded missions where NULL
UPDATE loyalty_campaign_milestones
SET description = E'Valid for every eligible Natcash digital transaction during the campaign period.\nEach qualifying transaction automatically advances your milestone progress.\nCoins are credited to your Loyalty account once goals are reached.'
WHERE campaign_code = 'NATCASH_MISSION_2026'
  AND description IS NULL;

-- 6. Seed active multi-step missions for TENANT_NATCASH matching Figma NV-01 / NV-02
INSERT INTO loyalty_campaign_milestones (
    tenant_id, partner_id, campaign_code, campaign_name, description, milestone_step, target_metric,
    target_value, reward_points, start_date, end_date, status, audience_role
)
VALUES
    ('TENANT_NATCASH', NULL, 'FUEL_UP_3X_2026',    'Fuel up 3 times',
     E'Valid for every Natcash payment at all eligible fuel stations nationwide.\nEach payment must be at least 200 HTG.\nCoins reach your Loyalty account within 5 minutes.',
     1, 'TRANSACTION_COUNT', 1.00, 50.00, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '45 days', 'ACTIVE', 'CUSTOMER'),
    ('TENANT_NATCASH', NULL, 'FUEL_UP_3X_2026',    'Fuel up 3 times',
     E'Valid for every Natcash payment at all eligible fuel stations nationwide.\nEach payment must be at least 200 HTG.\nCoins reach your Loyalty account within 5 minutes.',
     2, 'TRANSACTION_COUNT', 2.00, 50.00, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '45 days', 'ACTIVE', 'CUSTOMER'),
    ('TENANT_NATCASH', NULL, 'FUEL_UP_3X_2026',    'Fuel up 3 times',
     E'Valid for every Natcash payment at all eligible fuel stations nationwide.\nEach payment must be at least 200 HTG.\nCoins reach your Loyalty account within 5 minutes.',
     3, 'TRANSACTION_COUNT', 3.00, 50.00, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '45 days', 'ACTIVE', 'CUSTOMER'),
    ('TENANT_NATCASH', NULL, 'MONTHLY_SPEND_2026', 'Monthly spending',
     E'Applies to cumulative Natcash merchant and utility bill payments within the month.\nCancelled or refunded transactions do not count toward spending goals.\nCoins are credited automatically when each spending goal is unlocked.',
     1, 'BILL_AMOUNT', 1000.00, 50.00, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '45 days', 'ACTIVE', 'CUSTOMER'),
    ('TENANT_NATCASH', NULL, 'MONTHLY_SPEND_2026', 'Monthly spending',
     E'Applies to cumulative Natcash merchant and utility bill payments within the month.\nCancelled or refunded transactions do not count toward spending goals.\nCoins are credited automatically when each spending goal is unlocked.',
     2, 'BILL_AMOUNT', 3000.00, 100.00, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '45 days', 'ACTIVE', 'CUSTOMER'),
    ('TENANT_NATCASH', NULL, 'MONTHLY_SPEND_2026', 'Monthly spending',
     E'Applies to cumulative Natcash merchant and utility bill payments within the month.\nCancelled or refunded transactions do not count toward spending goals.\nCoins are credited automatically when each spending goal is unlocked.',
     3, 'BILL_AMOUNT', 5000.00, 200.00, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '45 days', 'ACTIVE', 'CUSTOMER')
ON CONFLICT (tenant_id, campaign_code, milestone_step) DO NOTHING;

-- 7. Seed sample in-progress progress for demo user 84988888888 (idempotent)
INSERT INTO loyalty_user_milestones (tenant_id, account_id, milestone_id, current_progress, status, completed_at, claimed_at)
SELECT 'TENANT_NATCASH', a.id, m.id,
       CASE
           WHEN m.campaign_code = 'FUEL_UP_3X_2026' AND m.milestone_step IN (1, 2) THEN CAST(m.milestone_step AS DECIMAL(18, 2))
           WHEN m.campaign_code = 'FUEL_UP_3X_2026' AND m.milestone_step = 3 THEN 2.00
           WHEN m.campaign_code = 'MONTHLY_SPEND_2026' AND m.milestone_step = 1 THEN 1000.00
           WHEN m.campaign_code = 'MONTHLY_SPEND_2026' THEN 2200.00
           ELSE 0.00
       END,
       CASE
           WHEN m.campaign_code = 'FUEL_UP_3X_2026' AND m.milestone_step IN (1, 2) THEN 'CLAIMED'
           WHEN m.campaign_code = 'MONTHLY_SPEND_2026' AND m.milestone_step = 1 THEN 'CLAIMED'
           ELSE 'IN_PROGRESS'
       END,
       CASE
           WHEN (m.campaign_code = 'FUEL_UP_3X_2026' AND m.milestone_step IN (1, 2))
             OR (m.campaign_code = 'MONTHLY_SPEND_2026' AND m.milestone_step = 1) THEN CURRENT_TIMESTAMP - INTERVAL '2 days'
           ELSE NULL
       END,
       CASE
           WHEN (m.campaign_code = 'FUEL_UP_3X_2026' AND m.milestone_step IN (1, 2))
             OR (m.campaign_code = 'MONTHLY_SPEND_2026' AND m.milestone_step = 1) THEN CURRENT_TIMESTAMP - INTERVAL '2 days'
           ELSE NULL
       END
FROM loyalty_accounts a
JOIN loyalty_campaign_milestones m ON m.tenant_id = a.tenant_id
WHERE a.tenant_id = 'TENANT_NATCASH'
  AND a.external_user_id = '84988888888'
  AND m.campaign_code IN ('FUEL_UP_3X_2026', 'MONTHLY_SPEND_2026')
ON CONFLICT (tenant_id, account_id, milestone_id) DO NOTHING;
