-- =====================================================================================
-- V40: Seed Daily Check-in in loyalty_games and 7-day Check-in Campaign Milestone (Figma NV-01 / NV-03)
--  * Seeds DAILY_CHECKIN in loyalty_games for TENANT_NATCASH, TENANT_DELIMART, TENANT_MICRO_CRM
--  * Seeds CHECKIN_7D_WEEKLY in loyalty_campaign_milestones for TENANT_NATCASH
-- Dialect: PostgreSQL 15+
-- =====================================================================================

-- 1. Seed DAILY_CHECKIN in loyalty_games so /gamehub/v1/games/submit-result records rewards & streak
INSERT INTO loyalty_games (
    tenant_id, game_code, game_name, category, price_per_turn, free_turns_daily,
    daily_budget_limit, allow_points_spin, description, rules_text, status
)
VALUES
    ('TENANT_NATCASH', 'DAILY_CHECKIN', 'Daily Check-in Streak', 'DAILY_CHECKIN', 0.00, 1, 50000.00, TRUE,
     'Consecutive 7-day check-in rewards and streak coin bonuses',
     'Check in once daily to earn increasing coin rewards up to 200 coins on Day 7.', 'ACTIVE'),
    ('TENANT_DELIMART', 'DAILY_CHECKIN', 'Daily Check-in Streak', 'DAILY_CHECKIN', 0.00, 1, 50000.00, TRUE,
     'Consecutive 7-day check-in rewards and streak coin bonuses',
     'Check in once daily to earn increasing coin rewards up to 200 coins on Day 7.', 'ACTIVE'),
    ('TENANT_MICRO_CRM', 'DAILY_CHECKIN', 'Daily Check-in Streak', 'DAILY_CHECKIN', 0.00, 1, 50000.00, TRUE,
     'Consecutive 7-day check-in rewards and streak coin bonuses',
     'Check in once daily to earn increasing coin rewards up to 200 coins on Day 7.', 'ACTIVE')
ON CONFLICT (tenant_id, game_code) DO NOTHING;

-- 2. Seed CHECKIN_7D_WEEKLY milestone in loyalty_campaign_milestones (Figma NV-01 "Check in 7 days in a row")
INSERT INTO loyalty_campaign_milestones (
    tenant_id, partner_id, campaign_code, campaign_name, description, milestone_step, target_metric,
    target_value, reward_points, start_date, end_date, status, audience_role
)
VALUES
    ('TENANT_NATCASH', NULL, 'CHECKIN_7D_WEEKLY', 'Check in 7 days in a row',
     E'Check in daily via Natcash Loyalty to claim bonus coins.\nReach 7 consecutive days to claim up to 230 coins weekly.\nStreak resets if a day is missed.',
     1, 'TRANSACTION_COUNT', 7.00, 230.00, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '180 days', 'ACTIVE', 'CUSTOMER')
ON CONFLICT (tenant_id, campaign_code, milestone_step) DO NOTHING;
