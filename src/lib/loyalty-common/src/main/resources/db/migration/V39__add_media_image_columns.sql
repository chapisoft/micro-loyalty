-- V39: Add media image/logo columns for milestones, alliance partners, and GameHub lobby banner
-- Dialect: PostgreSQL 15+

ALTER TABLE loyalty_campaign_milestones
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

ALTER TABLE loyalty_partners
    ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

ALTER TABLE loyalty_game_hub_config
    ADD COLUMN IF NOT EXISTS lobby_banner_url VARCHAR(500);
