-- ==============================================================================================
-- FLYWAY MIGRATION V16: ADD PARTNER_ID TO CAMPAIGN MILESTONES & ENHANCE LOOKUP INDEXES
-- Hệ Sinh Thái Loyalty & GameHub Platform (micro-loyalty)
-- ==============================================================================================

-- 1. Bổ sung cột partner_id vào bảng loyalty_campaign_milestones
-- (Giá trị NULL đồng nghĩa với Chiến dịch áp dụng Toàn Liên Minh / All Alliance Partners)
ALTER TABLE loyalty_campaign_milestones
ADD COLUMN IF NOT EXISTS partner_id BIGINT REFERENCES loyalty_partners(id);

-- 2. Đánh chỉ mục tìm kiếm tối ưu theo Đối tác
CREATE INDEX IF NOT EXISTS idx_loyalty_milestones_partner 
ON loyalty_campaign_milestones(partner_id);

-- 3. Đánh chỉ mục tổ hợp tối ưu cho Động cơ quét Cột mốc hoạt động (Milestone Tracking Engine)
CREATE INDEX IF NOT EXISTS idx_loyalty_milestones_active_lookup 
ON loyalty_campaign_milestones(tenant_id, status, start_date, end_date, target_metric);
