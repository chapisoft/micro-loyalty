-- V28: Bổ sung platform, scope cho system_roles và must_change_password cho system_users theo chuẩn IAM doanh nghiệp
ALTER TABLE system_roles
    ADD COLUMN IF NOT EXISTS platform VARCHAR(32) NOT NULL DEFAULT 'WEB_CMS',
    ADD COLUMN IF NOT EXISTS scope VARCHAR(32) NOT NULL DEFAULT 'ALL';

ALTER TABLE system_users
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
