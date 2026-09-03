-- ==============================================================================
-- FLYWAY MIGRATION V14: BACKFILL PARTNER_ID IN POINT LEDGER & ADD PERFORMANCE INDEX
-- Mục tiêu: Chuẩn hóa 100% dữ liệu lịch sử trong loyalty_point_ledger,
-- gán đúng partner_id cho các giao dịch bị NULL từ các bản seed ban đầu.
-- ==============================================================================

-- 1. Cập nhật partner_id cho các giao dịch liên quan đến Viễn thông Natcom (Nạp cước, Data, Topup)
UPDATE loyalty_point_ledger l
SET partner_id = p.id
FROM loyalty_partners p
WHERE l.tenant_id = p.tenant_id
  AND p.partner_code = 'NATCOM_TELCO'
  AND (
    l.reference_code ILIKE '%NATCOM%'
    OR l.reference_code ILIKE '%TOPUP%'
    OR l.description ILIKE '%Natcom%'
    OR l.description ILIKE '%cước%'
    OR l.description ILIKE '%4G%'
  )
  AND l.partner_id IS NULL;

-- 2. Cập nhật partner_id cho các giao dịch thanh toán hóa đơn Điện lực Quốc gia EDH
UPDATE loyalty_point_ledger l
SET partner_id = p.id
FROM loyalty_partners p
WHERE l.tenant_id = p.tenant_id
  AND p.partner_code = 'EDH_POWER'
  AND (
    l.reference_code ILIKE '%EDH%'
    OR l.description ILIKE '%EDH%'
    OR l.description ILIKE '%điện lực%'
  )
  AND l.partner_id IS NULL;

-- 3. Cập nhật partner_id cho các giao dịch thanh toán Cấp nước Quốc gia DINEPA
UPDATE loyalty_point_ledger l
SET partner_id = p.id
FROM loyalty_partners p
WHERE l.tenant_id = p.tenant_id
  AND p.partner_code = 'DINEPA_WATER'
  AND (
    l.reference_code ILIKE '%DINEPA%'
    OR l.description ILIKE '%DINEPA%'
    OR l.description ILIKE '%nước%'
  )
  AND l.partner_id IS NULL;

-- 4. Cập nhật partner_id cho các giao dịch Siêu thị Delimart (Tenant Micro CRM & Natcash)
UPDATE loyalty_point_ledger l
SET partner_id = p.id
FROM loyalty_partners p
WHERE l.tenant_id = p.tenant_id
  AND p.partner_code = 'DELIMART_RETAIL'
  AND (
    l.reference_code ILIKE '%DELIMART%'
    OR l.description ILIKE '%Delimart%'
    OR l.description ILIKE '%siêu thị%'
  )
  AND l.partner_id IS NULL;

-- 5. Cập nhật partner_id cho các giao dịch sách Fahasa
UPDATE loyalty_point_ledger l
SET partner_id = p.id
FROM loyalty_partners p
WHERE l.tenant_id = p.tenant_id
  AND p.partner_code = 'FAHASA_BOOKSTORE'
  AND (
    l.reference_code ILIKE '%FAHASA%'
    OR l.description ILIKE '%Fahasa%'
    OR l.description ILIKE '%nhà sách%'
  )
  AND l.partner_id IS NULL;

-- 6. Cập nhật partner_id cho các giao dịch F&B Highlands Coffee
UPDATE loyalty_point_ledger l
SET partner_id = p.id
FROM loyalty_partners p
WHERE l.tenant_id = p.tenant_id
  AND p.partner_code = 'HIGHLANDS_COFFEE'
  AND (
    l.reference_code ILIKE '%HIGHLANDS%'
    OR l.description ILIKE '%Highlands%'
    OR l.description ILIKE '%cà phê%'
  )
  AND l.partner_id IS NULL;

-- 7. Cập nhật partner_id cho các giao dịch Rạp phim CGV Cinemas
UPDATE loyalty_point_ledger l
SET partner_id = p.id
FROM loyalty_partners p
WHERE l.tenant_id = p.tenant_id
  AND p.partner_code = 'CGV_CINEMAS'
  AND (
    l.reference_code ILIKE '%CGV%'
    OR l.description ILIKE '%CGV%'
    OR l.description ILIKE '%rạp chiếu phim%'
  )
  AND l.partner_id IS NULL;

-- 8. Cập nhật partner_id cho các giao dịch Giải trí Ringme
UPDATE loyalty_point_ledger l
SET partner_id = p.id
FROM loyalty_partners p
WHERE l.tenant_id = p.tenant_id
  AND p.partner_code = 'RINGME'
  AND (
    l.reference_code ILIKE '%RINGME%'
    OR l.description ILIKE '%Ringme%'
  )
  AND l.partner_id IS NULL;

-- 9. Với toàn bộ các giao dịch còn lại thuộc TENANT_NATCASH (thưởng hệ thống, hoàn điểm, minigame):
-- Gán về Đơn vị phát hành chủ quản Ví Natcash (NATCASH_WALLET)
UPDATE loyalty_point_ledger l
SET partner_id = p.id
FROM loyalty_partners p
WHERE l.tenant_id = p.tenant_id
  AND l.tenant_id = 'TENANT_NATCASH'
  AND p.partner_code = 'NATCASH_WALLET'
  AND l.partner_id IS NULL;

-- 10. Với toàn bộ các giao dịch còn lại thuộc TENANT_MICRO_CRM:
-- Gán về Đơn vị liên minh bán lẻ chủ quản Siêu thị Delimart (DELIMART_RETAIL)
UPDATE loyalty_point_ledger l
SET partner_id = p.id
FROM loyalty_partners p
WHERE l.tenant_id = p.tenant_id
  AND l.tenant_id = 'TENANT_MICRO_CRM'
  AND p.partner_code = 'DELIMART_RETAIL'
  AND l.partner_id IS NULL;

-- 11. Bổ sung chỉ mục (Index) tối ưu hiệu năng truy vấn cho bảng Sổ cái điểm theo đối tác
CREATE INDEX IF NOT EXISTS idx_point_ledger_partner_id
ON loyalty_point_ledger (tenant_id, partner_id, created_at DESC);
