-- =====================================================================================
-- V31: Decouple general categories from specific tenant (Decouple from NATCASH)
-- Initialize shared Master Data for SYSTEM and DEFAULT tenants to ensure standalone
-- platform deployment for any enterprise or partner without tenant lock-in.
-- =====================================================================================

-- 1. Update default value of tenant_id column to 'DEFAULT'
ALTER TABLE cfg_general_categories ALTER COLUMN tenant_id SET DEFAULT 'DEFAULT';

-- 2. Seed shared master data categories for 'SYSTEM' tenant (if not exists)
INSERT INTO cfg_general_categories (tenant_id, category_type, code, name, parent_code, display_order, status, description, metadata, created_at, updated_at)
SELECT 
    'SYSTEM' AS tenant_id,
    category_type,
    code,
    name,
    parent_code,
    display_order,
    status,
    description,
    metadata,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM cfg_general_categories
WHERE tenant_id IN ('NATCASH', 'TENANT_NATCASH')
ON CONFLICT (tenant_id, category_type, code) DO NOTHING;

-- 3. Seed shared master data categories for 'DEFAULT' tenant (if not exists)
INSERT INTO cfg_general_categories (tenant_id, category_type, code, name, parent_code, display_order, status, description, metadata, created_at, updated_at)
SELECT 
    'DEFAULT' AS tenant_id,
    category_type,
    code,
    name,
    parent_code,
    display_order,
    status,
    description,
    metadata,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM cfg_general_categories
WHERE tenant_id = 'SYSTEM'
ON CONFLICT (tenant_id, category_type, code) DO NOTHING;
