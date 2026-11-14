-- =====================================================================================
-- V25: Làm sạch dữ liệu trùng và khởi tạo bộ dữ liệu kiểm thử toàn diện cho Đối tác DELIMART
-- Bao phủ đầy đủ 10 màn hình Partner Portal, các phân hệ CMS và trải nghiệm Webview trên TENANT_DELIMART
-- =====================================================================================

DO $$
DECLARE
    v_partner_id         BIGINT;
    v_natcom_id          BIGINT;
    v_tier_silver_id     BIGINT;
    v_tier_gold_id       BIGINT;
    v_tier_platinum_id   BIGINT;
    v_tier_diamond_id    BIGINT;
    v_br_delmas_id       BIGINT;
    v_br_petion_id       BIGINT;
    v_br_carrefour_id    BIGINT;
    v_pg_grocery_id      BIGINT;
    v_pg_beverage_id     BIGINT;
    v_pg_dairy_id        BIGINT;
    v_pg_appliance_id    BIGINT;
    v_pg_organic_id      BIGINT;
    v_acc_main_id        BIGINT;
    v_acc_diamond_id     BIGINT;
    v_acc_platinum_id    BIGINT;
    v_acc_gold_id        BIGINT;
    v_acc_silver1_id     BIGINT;
    v_acc_silver2_id     BIGINT;
    v_voucher_50k_id     BIGINT;
    v_voucher_20k_id     BIGINT;
    v_voucher_15pct_id   BIGINT;
    v_voucher_ship_id    BIGINT;
    v_voucher_bf100_id   BIGINT;
    v_seg_vip_id         BIGINT;
    v_seg_churn_id       BIGINT;
    v_seg_fresh_id       BIGINT;
    v_course_shopper_id  BIGINT;
    v_course_nutri_id    BIGINT;
    v_super_agent_id     BIGINT;
BEGIN
    -- 1. Xác định ID chính thức của đối tác Delimart trong TENANT_DELIMART
    SELECT id INTO v_partner_id
    FROM loyalty_partners
    WHERE tenant_id = 'TENANT_DELIMART' AND partner_code = 'DELIMART'
    LIMIT 1;

    IF v_partner_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy đối tác DELIMART trong TENANT_DELIMART';
    END IF;

    SELECT id INTO v_natcom_id
    FROM loyalty_partners
    WHERE tenant_id = 'TENANT_DELIMART' AND partner_code = 'NATCOM'
    LIMIT 1;

    -- 2. Làm sạch bản ghi trùng tài khoản owner_delimart ở tenant phụ NATCASH và nhóm TELECOM_DATA sai ngành hàng
    DELETE FROM partner_staff_accounts
    WHERE tenant_id = 'NATCASH' AND username = 'owner_delimart';

    UPDATE loyalty_acceptance_policies
    SET product_group_id = NULL
    WHERE tenant_id = 'TENANT_DELIMART'
      AND partner_id = v_partner_id
      AND product_group_id IN (
          SELECT id FROM partner_product_groups
          WHERE tenant_id = 'TENANT_DELIMART'
            AND partner_id = v_partner_id
            AND group_code = 'TELECOM_DATA'
      );

    UPDATE partner_products
    SET product_group_id = NULL
    WHERE tenant_id = 'TENANT_DELIMART'
      AND partner_id = v_partner_id
      AND product_group_id IN (
          SELECT id FROM partner_product_groups
          WHERE tenant_id = 'TENANT_DELIMART'
            AND partner_id = v_partner_id
            AND group_code = 'TELECOM_DATA'
      );

    DELETE FROM partner_product_groups
    WHERE tenant_id = 'TENANT_DELIMART'
      AND partner_id = v_partner_id
      AND group_code = 'TELECOM_DATA';

    -- 3. Hoàn thiện cấu hình Webhook và IP Whitelist cho Delimart
    UPDATE loyalty_partners
    SET webhook_url = COALESCE(NULLIF(webhook_url, ''), 'https://pos.delimart.ht/webhooks/loyalty'),
        webhook_secret = COALESCE(NULLIF(webhook_secret, ''), 'whsec_delimart_live_2026_9c4a7b2e'),
        ip_whitelist = COALESCE(NULLIF(ip_whitelist, ''), '103.112.45.10/32,192.168.1.0/24,10.228.37.0/24'),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_partner_id;

    -- Tra cứu các hạng thành viên của TENANT_DELIMART
    SELECT id INTO v_tier_silver_id   FROM loyalty_tiers WHERE tenant_id = 'TENANT_DELIMART' AND code = 'SILVER'   LIMIT 1;
    SELECT id INTO v_tier_gold_id     FROM loyalty_tiers WHERE tenant_id = 'TENANT_DELIMART' AND code = 'GOLD'     LIMIT 1;
    SELECT id INTO v_tier_platinum_id FROM loyalty_tiers WHERE tenant_id = 'TENANT_DELIMART' AND code = 'PLATINUM' LIMIT 1;
    SELECT id INTO v_tier_diamond_id  FROM loyalty_tiers WHERE tenant_id = 'TENANT_DELIMART' AND code = 'DIAMOND'  LIMIT 1;

    -- 4. Bổ sung Chi nhánh POS Delimart (nâng tổng lên 5 chi nhánh)
    INSERT INTO partner_branches (tenant_id, partner_id, branch_code, branch_name, payment_point_code, is_natcash_own, province, address, latitude, longitude, phone_number, status)
    VALUES
        ('TENANT_DELIMART', v_partner_id, 'DELI_BR_CARREFOUR', 'Delimart Carrefour Express', 'POS_DELI_CR03', false, 'Ouest', 'Route des Rails, Carrefour, Port-au-Prince', 18.532200, -72.411900, '+50938110003', 'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, 'DELI_BR_CAPHAITIEN', 'Delimart Cap-Haïtien Plaza', 'POS_DELI_CH04', false, 'Nord', 'Boulevard du Quai, Cap-Haïtien', 19.759400, -72.198100, '+50938110004', 'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, 'DELI_BR_TABARRE', 'Delimart Tabarre Flagship', 'POS_DELI_TB05', false, 'Ouest', 'Boulevard 15 Octobre, Tabarre', 18.581100, -72.263400, '+50938110005', 'INACTIVE')
    ON CONFLICT ON CONSTRAINT uq_partner_branch DO NOTHING;

    SELECT id INTO v_br_delmas_id    FROM partner_branches WHERE tenant_id = 'TENANT_DELIMART' AND branch_code = 'DELI_BR_DELMAS'    LIMIT 1;
    SELECT id INTO v_br_petion_id    FROM partner_branches WHERE tenant_id = 'TENANT_DELIMART' AND branch_code = 'DELI_BR_PETION'    LIMIT 1;
    SELECT id INTO v_br_carrefour_id FROM partner_branches WHERE tenant_id = 'TENANT_DELIMART' AND branch_code = 'DELI_BR_CARREFOUR' LIMIT 1;

    -- 5. Nhóm hàng hóa bán lẻ Delimart và danh mục 10 SKU thực tế
    INSERT INTO partner_product_groups (tenant_id, partner_id, group_code, group_name, description, earn_rate_percent, max_burn_percentage, status)
    VALUES
        ('TENANT_DELIMART', v_partner_id, 'GROCERY_FRESH', 'Thực phẩm Tươi sống & Nông sản', 'Rau củ, thịt cá tươi sống trong ngày tại quầy mát', 1.50, 40.00, 'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, 'BEVERAGES_SNACKS', 'Đồ uống & Bánh kẹo Nhập khẩu', 'Nước ép, cà phê, bánh quy nhập khẩu từ Châu Âu', 2.00, 50.00, 'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, 'DAIRY_BABY', 'Sữa, Dinh dưỡng Mẹ & Bé', 'Sữa công thức, tã giấy và đồ dùng trẻ em', 2.50, 30.00, 'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, 'HOME_APPLIANCES', 'Gia dụng & Điện máy nhỏ', 'Máy xay sinh tố, ấm siêu tốc, đồ bếp bảo hành 12 tháng', 1.20, 0.00, 'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, 'ORGANIC_PRODUCE', 'Nông sản Hữu cơ Địa phương', 'Gạo hữu cơ Artibonite, mật ong rừng và cà phê nguyên hạt Haïti', 3.00, 60.00, 'ACTIVE')
    ON CONFLICT ON CONSTRAINT uq_partner_product_group DO NOTHING;

    SELECT id INTO v_pg_grocery_id   FROM partner_product_groups WHERE tenant_id = 'TENANT_DELIMART' AND partner_id = v_partner_id AND group_code = 'GROCERY_FRESH'    LIMIT 1;
    SELECT id INTO v_pg_beverage_id  FROM partner_product_groups WHERE tenant_id = 'TENANT_DELIMART' AND partner_id = v_partner_id AND group_code = 'BEVERAGES_SNACKS' LIMIT 1;
    SELECT id INTO v_pg_dairy_id     FROM partner_product_groups WHERE tenant_id = 'TENANT_DELIMART' AND partner_id = v_partner_id AND group_code = 'DAIRY_BABY'       LIMIT 1;
    SELECT id INTO v_pg_appliance_id FROM partner_product_groups WHERE tenant_id = 'TENANT_DELIMART' AND partner_id = v_partner_id AND group_code = 'HOME_APPLIANCES'  LIMIT 1;
    SELECT id INTO v_pg_organic_id   FROM partner_product_groups WHERE tenant_id = 'TENANT_DELIMART' AND partner_id = v_partner_id AND group_code = 'ORGANIC_PRODUCE'  LIMIT 1;

    INSERT INTO partner_products (tenant_id, partner_id, product_group_id, sku_code, product_name, unit_price, status)
    VALUES
        ('TENANT_DELIMART', v_partner_id, v_pg_organic_id,   'SKU_RICE_5KG',     'Gạo Thơm Artibonite Túi 5Kg',                680.00,  'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, v_pg_dairy_id,     'SKU_MILK_1L',      'Sữa Tươi Tiệt Trùng Delimart 1 Lít',         195.00,  'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, v_pg_organic_id,   'SKU_COFFEE_250G',  'Cà Phê Rang Mộc Kenscoff 250g',              420.00,  'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, v_pg_beverage_id,  'SKU_JUICE_1L',     'Nước Ép Cam Nguyên Chất Tropi 1 Lít',        240.00,  'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, v_pg_appliance_id, 'SKU_BLENDER_01',   'Máy Xay Sinh Tố Đa Năng DeliHome',          3250.00,  'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, v_pg_grocery_id,   'SKU_OLIVE_500ML',  'Dầu Ô-liu Nguyên Chất Mediterranean 500ml',  890.00,  'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, v_pg_dairy_id,     'SKU_BABY_DIAPER',  'Tã Quần Siêu Thấm BabyCare Gói 44 Miếng',  1150.00,  'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, v_pg_organic_id,   'SKU_ORGANIC_HONEY','Mật Ong Hoa Rừng Jacmel Hũ 500ml',           560.00,  'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, v_pg_beverage_id,  'SKU_PASTA_500G',   'Mì Ý Thượng Hạng Spaghetti 500g',            165.00,  'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, v_pg_beverage_id,  'SKU_MINERAL_24PK', 'Thùng 24 Chai Nước Khoáng Delimart 500ml',   480.00,  'ACTIVE')
    ON CONFLICT ON CONSTRAINT uq_partner_product DO NOTHING;

    -- 6. Tài khoản nhân viên đối tác Delimart
    INSERT INTO partner_staff_accounts (tenant_id, partner_id, branch_id, username, full_name, email, phone_number, role_code, status)
    VALUES
        ('TENANT_DELIMART', v_partner_id, v_br_delmas_id,    'mgr_delmas_delimart',        'Michel-Ange Jean (QL Delmas 33)',    'michel.delmas@delimart.ht',     '+50938111001', 'PARTNER_BRANCH_MANAGER', 'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, v_br_petion_id,    'mgr_petion_delimart',        'Nadine Desir (QL Pétion-Ville)',    'nadine.petion@delimart.ht',     '+50938111002', 'PARTNER_BRANCH_MANAGER', 'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, NULL,              'acc_delimart',               'Claudette Pierre (Kế toán trưởng)', 'accounting@delimart.ht',        '+50938111003', 'PARTNER_ACCOUNTANT',     'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, v_br_carrefour_id, 'cashier_carrefour_delimart', 'Stanley Moïse (Thu ngân Quầy 03)',  'cashier.cr03@delimart.ht',      '+50938111004', 'PARTNER_CASHIER',        'ACTIVE')
    ON CONFLICT ON CONSTRAINT uq_partner_staff_username DO NOTHING;

    -- 7. API Keys đủ 3 trạng thái ACTIVE, GRACE_PERIOD, REVOKED
    INSERT INTO partner_api_keys (tenant_id, partner_id, key_name, key_prefix, key_hash, scopes, expires_at, status, created_by)
    SELECT 'TENANT_DELIMART', v_partner_id, 'POS Gateway Production v2', 'pk_deli_pos2', 'a8f5f167f44f4964e6c998dee827110c9c4e72a30e8a109c9b6b5c2241a9e210', 'READ,EARN,REDEEM,SETTLEMENT', CURRENT_TIMESTAMP + INTERVAL '365 days', 'ACTIVE', 'owner_delimart'
    WHERE NOT EXISTS (
        SELECT 1 FROM partner_api_keys WHERE tenant_id = 'TENANT_DELIMART' AND partner_id = v_partner_id AND key_prefix = 'pk_deli_pos2'
    );

    INSERT INTO partner_api_keys (tenant_id, partner_id, key_name, key_prefix, key_hash, scopes, expires_at, grace_expires_at, status, created_by)
    SELECT 'TENANT_DELIMART', v_partner_id, 'Kiosk Self-Checkout Key (Rotating)', 'pk_deli_ksk1', 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35', 'READ,REDEEM', CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP + INTERVAL '48 hours', 'GRACE_PERIOD', 'owner_delimart'
    WHERE NOT EXISTS (
        SELECT 1 FROM partner_api_keys WHERE tenant_id = 'TENANT_DELIMART' AND partner_id = v_partner_id AND key_prefix = 'pk_deli_ksk1'
    );

    INSERT INTO partner_api_keys (tenant_id, partner_id, key_name, key_prefix, key_hash, scopes, revoked_at, status, created_by)
    SELECT 'TENANT_DELIMART', v_partner_id, 'Legacy POS Key 2025', 'pk_deli_old0', '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce', 'READ', CURRENT_TIMESTAMP - INTERVAL '15 days', 'REVOKED', 'owner_delimart'
    WHERE NOT EXISTS (
        SELECT 1 FROM partner_api_keys WHERE tenant_id = 'TENANT_DELIMART' AND partner_id = v_partner_id AND key_prefix = 'pk_deli_old0'
    );

    -- 8. Chính sách tích/tiêu điểm 4 tầng (BRANCH & PRODUCT_GROUP) cho Delimart
    IF v_br_petion_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM loyalty_acceptance_policies
        WHERE tenant_id = 'TENANT_DELIMART' AND partner_id = v_partner_id AND hierarchy_level = 'BRANCH' AND branch_id = v_br_petion_id
    ) THEN
        INSERT INTO loyalty_acceptance_policies (
            tenant_id, partner_id, point_exchange_rate, max_burn_percentage, min_burn_points,
            max_burn_points_per_day, max_burn_points_per_tx, min_tier_id, allowed_point_types,
            commission_rate_percent, fixed_fee_per_tx, settlement_credit_limit, settlement_cycle,
            hierarchy_level, branch_id, status
        ) VALUES (
            'TENANT_DELIMART', v_partner_id, 1.0000, 60.00, 10.00,
            15000.00, 8000.00, v_tier_gold_id, 'ALL',
            1.80, 0.00, 800000.00, 'DAILY',
            'BRANCH', v_br_petion_id, 'ACTIVE'
        );
    END IF;

    IF v_pg_organic_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM loyalty_acceptance_policies
        WHERE tenant_id = 'TENANT_DELIMART' AND partner_id = v_partner_id AND hierarchy_level = 'PRODUCT_GROUP' AND product_group_id = v_pg_organic_id
    ) THEN
        INSERT INTO loyalty_acceptance_policies (
            tenant_id, partner_id, point_exchange_rate, max_burn_percentage, min_burn_points,
            max_burn_points_per_day, max_burn_points_per_tx, min_tier_id, allowed_point_types,
            commission_rate_percent, fixed_fee_per_tx, settlement_credit_limit, settlement_cycle,
            hierarchy_level, product_group_id, status
        ) VALUES (
            'TENANT_DELIMART', v_partner_id, 1.2500, 60.00, 5.00,
            10000.00, 4000.00, v_tier_silver_id, 'ALL',
            1.50, 0.00, 500000.00, 'WEEKLY',
            'PRODUCT_GROUP', v_pg_organic_id, 'ACTIVE'
        );
    END IF;

    IF v_pg_dairy_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM loyalty_acceptance_policies
        WHERE tenant_id = 'TENANT_DELIMART' AND partner_id = v_partner_id AND hierarchy_level = 'PRODUCT_GROUP' AND product_group_id = v_pg_dairy_id
    ) THEN
        INSERT INTO loyalty_acceptance_policies (
            tenant_id, partner_id, point_exchange_rate, max_burn_percentage, min_burn_points,
            max_burn_points_per_day, max_burn_points_per_tx, min_tier_id, allowed_point_types,
            commission_rate_percent, fixed_fee_per_tx, settlement_credit_limit, settlement_cycle,
            hierarchy_level, product_group_id, status
        ) VALUES (
            'TENANT_DELIMART', v_partner_id, 1.0000, 30.00, 20.00,
            6000.00, 2500.00, v_tier_silver_id, 'ALL',
            2.00, 0.00, 400000.00, 'DAILY',
            'PRODUCT_GROUP', v_pg_dairy_id, 'ACTIVE'
        );
    END IF;

    -- 9. Đề xuất chương trình & Maker-Checker của Delimart (approval_requests)
    INSERT INTO approval_requests (request_code, tenant_id, target_type, target_id, action_type, title, payload_after, maker_username, checker_username, status, reason, reject_reason, reviewed_at)
    VALUES
        (
            'PROP-DELI-2026-001', 'TENANT_DELIMART', 'PROGRAM', v_partner_id::text, 'CREATE',
            'Tuần lễ Tích điểm X2 Nông sản Sạch Delimart',
            jsonb_build_object('partnerId', v_partner_id, 'fundingType', 'CO_FUNDED', 'programName', 'Tuần lễ Tích điểm X2 Nông sản Sạch Delimart', 'description', 'Đồng tài trợ 30% từ Natcash cho nhóm Nông sản Hữu cơ toàn hệ thống 5 chi nhánh', 'proposedBudget', 150000, 'natcashCoFundPercent', 30, 'earnRateBoostPercent', 2.0, 'startDate', '2026-11-01', 'endDate', '2026-11-30'),
            'owner_delimart', 'admin', 'APPROVED',
            'Kích cầu tiêu dùng nông sản nội địa Haïti quý 4/2026', NULL, CURRENT_TIMESTAMP - INTERVAL '10 days'
        ),
        (
            'PROP-DELI-2026-002', 'TENANT_DELIMART', 'PROGRAM', v_partner_id::text, 'CREATE',
            'Cuối tuần Vàng Mua sắm Delmas & Pétion-Ville',
            jsonb_build_object('partnerId', v_partner_id, 'fundingType', 'CO_FUNDED', 'programName', 'Cuối tuần Vàng Mua sắm Delmas & Pétion-Ville', 'description', 'Hoàn thêm 2.5% điểm cho đơn hàng cuối tuần thanh toán qua Natcash QR', 'proposedBudget', 85000, 'natcashCoFundPercent', 40, 'earnRateBoostPercent', 2.5, 'startDate', '2026-11-20', 'endDate', '2026-12-10'),
            'owner_delimart', NULL, 'PENDING',
            'Tăng tỷ lệ giao dịch quầy POS thứ Sáu đến Chủ Nhật', NULL, NULL
        ),
        (
            'PROP-DELI-2026-003', 'TENANT_DELIMART', 'POLICY', v_partner_id::text, 'UPDATE',
            'Ưu đãi Thành viên Kim Cương Delimart',
            jsonb_build_object('partnerId', v_partner_id, 'fundingType', 'PARTNER_FUNDED', 'programName', 'Ưu đãi Thành viên Kim Cương Delimart', 'description', 'Nâng trần tiêu điểm lên 75% cho khách hàng hạng Diamond tại Pétion-Ville', 'proposedBudget', 60000, 'natcashCoFundPercent', 0, 'earnRateBoostPercent', 3.0, 'startDate', '2026-11-25', 'endDate', '2026-12-31'),
            'mgr_petion_delimart', NULL, 'PENDING',
            'Giữ chân nhóm khách hàng VIP giỏ hàng trên 3.000 HTG', NULL, NULL
        ),
        (
            'PROP-DELI-2026-004', 'TENANT_DELIMART', 'PROGRAM', v_partner_id::text, 'CREATE',
            'Siêu Hội Mua Sắm Tháng 11 (Vượt trần ngân sách)',
            jsonb_build_object('partnerId', v_partner_id, 'fundingType', 'CO_FUNDED', 'programName', 'Siêu Hội Mua Sắm Tháng 11 (Vượt trần ngân sách)', 'description', 'Đề xuất ngân sách 450.000 HTG đồng tài trợ 50%', 'proposedBudget', 450000, 'natcashCoFundPercent', 50, 'earnRateBoostPercent', 4.0, 'startDate', '2026-11-15', 'endDate', '2026-11-30'),
            'owner_delimart', 'loyalty_admin', 'REJECTED',
            'Chiến dịch kích cầu quy mô lớn toàn hệ thống',
            'Ngân sách đề xuất vượt trần đồng tài trợ tháng 11, đề nghị điều chỉnh tối đa 150.000 HTG.',
            CURRENT_TIMESTAMP - INTERVAL '3 days'
        )
    ON CONFLICT (request_code) DO NOTHING;

    -- 10. Hội viên các hạng (SILVER, GOLD, PLATINUM, DIAMOND) thuộc TENANT_DELIMART
    INSERT INTO loyalty_accounts (tenant_id, external_user_id, phone_number, full_name, tier_id, current_points, tier_points, status)
    VALUES
        ('TENANT_DELIMART', '+50937001001', '+50937001001', 'Jean-Pierre Laurent',   v_tier_diamond_id,  18500.00, 21400.00, 'ACTIVE'),
        ('TENANT_DELIMART', '+50937001002', '+50937001002', 'Marie-Claire Joseph',   v_tier_platinum_id,  7420.00,  8900.00, 'ACTIVE'),
        ('TENANT_DELIMART', '+50937001003', '+50937001003', 'Wilson Jean-Baptiste',  v_tier_gold_id,      2350.00,  2950.00, 'ACTIVE'),
        ('TENANT_DELIMART', '+50937001004', '+50937001004', 'Sophia Pierre-Louis',   v_tier_silver_id,     640.00,   640.00, 'ACTIVE'),
        ('TENANT_DELIMART', '+50937001005', '+50937001005', 'Kervens Augustin',      v_tier_silver_id,     320.00,   320.00, 'ACTIVE')
    ON CONFLICT ON CONSTRAINT uq_loyalty_account DO NOTHING;

    SELECT id INTO v_acc_main_id     FROM loyalty_accounts WHERE tenant_id = 'TENANT_DELIMART' AND external_user_id = '84988888888'  LIMIT 1;
    SELECT id INTO v_acc_diamond_id  FROM loyalty_accounts WHERE tenant_id = 'TENANT_DELIMART' AND external_user_id = '+50937001001' LIMIT 1;
    SELECT id INTO v_acc_platinum_id FROM loyalty_accounts WHERE tenant_id = 'TENANT_DELIMART' AND external_user_id = '+50937001002' LIMIT 1;
    SELECT id INTO v_acc_gold_id     FROM loyalty_accounts WHERE tenant_id = 'TENANT_DELIMART' AND external_user_id = '+50937001003' LIMIT 1;
    SELECT id INTO v_acc_silver1_id  FROM loyalty_accounts WHERE tenant_id = 'TENANT_DELIMART' AND external_user_id = '+50937001004' LIMIT 1;
    SELECT id INTO v_acc_silver2_id  FROM loyalty_accounts WHERE tenant_id = 'TENANT_DELIMART' AND external_user_id = '+50937001005' LIMIT 1;

    -- Ví điểm FIFO cho tài khoản test chính (84988888888) và nhóm hội viên VIP
    IF v_acc_main_id IS NOT NULL THEN
        INSERT INTO point_expiration_buckets (tenant_id, account_id, asset_type, initial_points, remaining_points, earned_at, expired_at, source_ref, status)
        SELECT 'TENANT_DELIMART', v_acc_main_id, 'LOYALTY_COIN', 250.00, 250.00, CURRENT_TIMESTAMP - INTERVAL '320 days', CURRENT_TIMESTAMP + INTERVAL '14 days', 'FIFO_DELI_MAIN_EXP14D', 'ACTIVE'
        WHERE NOT EXISTS (SELECT 1 FROM point_expiration_buckets WHERE tenant_id = 'TENANT_DELIMART' AND source_ref = 'FIFO_DELI_MAIN_EXP14D');

        INSERT INTO point_expiration_buckets (tenant_id, account_id, asset_type, initial_points, remaining_points, earned_at, expired_at, source_ref, status)
        SELECT 'TENANT_DELIMART', v_acc_main_id, 'LOYALTY_COIN', 1000.00, 1000.00, CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP + INTERVAL '340 days', 'FIFO_DELI_MAIN_1000', 'ACTIVE'
        WHERE NOT EXISTS (SELECT 1 FROM point_expiration_buckets WHERE tenant_id = 'TENANT_DELIMART' AND source_ref = 'FIFO_DELI_MAIN_1000');
    END IF;

    IF v_acc_diamond_id IS NOT NULL THEN
        INSERT INTO point_expiration_buckets (tenant_id, account_id, asset_type, initial_points, remaining_points, earned_at, expired_at, source_ref, status)
        SELECT 'TENANT_DELIMART', v_acc_diamond_id, 'LOYALTY_COIN', 18500.00, 18500.00, CURRENT_TIMESTAMP - INTERVAL '18 days', CURRENT_TIMESTAMP + INTERVAL '347 days', 'FIFO_DELI_VIP_DIAMOND', 'ACTIVE'
        WHERE NOT EXISTS (SELECT 1 FROM point_expiration_buckets WHERE tenant_id = 'TENANT_DELIMART' AND source_ref = 'FIFO_DELI_VIP_DIAMOND');
    END IF;

    -- 11. Voucher Delimart & Lượt đổi sẵn sàng gạch nợ tại quầy
    INSERT INTO loyalty_vouchers (tenant_id, partner_id, voucher_code, title, description, discount_type, discount_value, min_bill_amount, max_discount_amount, total_quantity, available_quantity, point_cost, start_date, end_date, status)
    VALUES
        ('TENANT_DELIMART', v_partner_id, 'DELIMART-15PCT-WKND', 'Giảm 15% Cuối Tuần Tại Delimart', 'Áp dụng cho hóa đơn từ 500 HTG trở lên, giảm tối đa 150 HTG tại 5 chi nhánh Delimart', 'PERCENTAGE', 15.00, 500.00, 150.00, 500, 412, 300.00, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '60 days', 'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, 'DELIMART-FREESHIP-35', 'Miễn Phí Giao Hàng Delimart 35 HTG', 'Giảm trực tiếp 35 HTG phí giao hàng nội thành Port-au-Prince', 'FIXED_AMOUNT', 35.00, 300.00, 35.00, 1000, 845, 150.00, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '90 days', 'ACTIVE'),
        ('TENANT_DELIMART', v_partner_id, 'DELIMART-VIP-100HTG', 'Phiếu Mua Hàng VIP 100 HTG Delimart', 'Đặc quyền hạng Vàng/Kim Cương áp dụng toàn siêu thị Delimart', 'FIXED_AMOUNT', 100.00, 800.00, 100.00, 200, 168, 500.00, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP + INTERVAL '45 days', 'ACTIVE')
    ON CONFLICT ON CONSTRAINT uq_loyalty_voucher DO NOTHING;

    SELECT id INTO v_voucher_50k_id   FROM loyalty_vouchers WHERE tenant_id = 'TENANT_DELIMART' AND voucher_code = 'DELIMART-50K-9X8Z'    LIMIT 1;
    SELECT id INTO v_voucher_20k_id   FROM loyalty_vouchers WHERE tenant_id = 'TENANT_DELIMART' AND voucher_code = 'DELIMART-20K-1A4F'    LIMIT 1;
    SELECT id INTO v_voucher_15pct_id FROM loyalty_vouchers WHERE tenant_id = 'TENANT_DELIMART' AND voucher_code = 'DELIMART-15PCT-WKND'  LIMIT 1;
    SELECT id INTO v_voucher_ship_id  FROM loyalty_vouchers WHERE tenant_id = 'TENANT_DELIMART' AND voucher_code = 'DELIMART-FREESHIP-35' LIMIT 1;
    SELECT id INTO v_voucher_bf100_id FROM loyalty_vouchers WHERE tenant_id = 'TENANT_DELIMART' AND voucher_code = 'DELIMART-VIP-100HTG'  LIMIT 1;

    IF v_acc_main_id IS NOT NULL AND v_voucher_50k_id IS NOT NULL THEN
        INSERT INTO loyalty_voucher_redemptions (tenant_id, account_id, voucher_id, redemption_code, points_used, status, expires_at)
        VALUES
            ('TENANT_DELIMART', v_acc_main_id, v_voucher_50k_id, 'RED-DELI-POS-001', 200.00, 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '30 days'),
            ('TENANT_DELIMART', v_acc_main_id, v_voucher_20k_id, 'RED-DELI-POS-002',  80.00, 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '30 days'),
            ('TENANT_DELIMART', COALESCE(v_acc_diamond_id, v_acc_main_id), v_voucher_bf100_id, 'RED-DELI-POS-003', 500.00, 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '45 days'),
            ('TENANT_DELIMART', COALESCE(v_acc_platinum_id, v_acc_main_id), v_voucher_15pct_id, 'RED-DELI-POS-004', 300.00, 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '25 days')
        ON CONFLICT (redemption_code) DO NOTHING;

        INSERT INTO loyalty_voucher_redemptions (tenant_id, account_id, voucher_id, redemption_code, points_used, status, used_at, used_partner_id, expires_at)
        VALUES
            ('TENANT_DELIMART', COALESCE(v_acc_gold_id, v_acc_main_id), v_voucher_50k_id, 'RED-DELI-USED-001', 200.00, 'USED', CURRENT_TIMESTAMP - INTERVAL '2 days', v_partner_id, CURRENT_TIMESTAMP + INTERVAL '20 days'),
            ('TENANT_DELIMART', COALESCE(v_acc_silver1_id, v_acc_main_id), v_voucher_ship_id, 'RED-DELI-USED-002', 150.00, 'USED', CURRENT_TIMESTAMP - INTERVAL '4 days', v_partner_id, CURRENT_TIMESTAMP + INTERVAL '20 days')
        ON CONFLICT (redemption_code) DO NOTHING;
    END IF;

    -- 12. Giao dịch Bù trừ (clearing_transactions) & Sổ cái điểm (loyalty_point_ledger) cho Delimart
    INSERT INTO clearing_transactions (
        tenant_id, transaction_code, issuer_partner_id, redeemer_partner_id, external_user_id,
        points_redeemed, fiat_amount, exchange_rate, status, settled_at, created_at,
        partner_order_id, commission_amount, net_payout_amount, reconciliation_batch_code, reconciliation_status
    ) VALUES
        ('TENANT_DELIMART', 'CLR-DELI-2611-001', COALESCE(v_natcom_id, v_partner_id), v_partner_id, '+50937001001', 1200.00, 1200.00, 1.0000, 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '1 day',  CURRENT_TIMESTAMP - INTERVAL '1 day',  'ORD-DELMAS-8801', 24.00, 1176.00, 'PAY-202611-69', 'MATCHED'),
        ('TENANT_DELIMART', 'CLR-DELI-2611-002', COALESCE(v_natcom_id, v_partner_id), v_partner_id, '84988888888',  450.00,  450.00,  1.0000, 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days', 'ORD-PETION-8802',  9.00,  441.00, 'PAY-202611-69', 'MATCHED'),
        ('TENANT_DELIMART', 'CLR-DELI-2611-003', v_partner_id, v_partner_id, '+50937001002', 850.00,  850.00,  1.0000, 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 'ORD-DELMAS-8803', 17.00,  833.00, 'PAY-202611-69', 'MATCHED'),
        ('TENANT_DELIMART', 'CLR-DELI-2611-004', COALESCE(v_natcom_id, v_partner_id), v_partner_id, '+50937001003', 320.00,  320.00,  1.0000, 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 'ORD-CARREF-8804',  6.40,  313.60, 'PAY-202611-69', 'MATCHED'),
        ('TENANT_DELIMART', 'CLR-DELI-2611-005', v_partner_id, v_partner_id, '+50937001004', 180.00,  180.00,  1.0000, 'PENDING', NULL,                                 CURRENT_TIMESTAMP - INTERVAL '6 hours','ORD-CAPHAI-8805',  3.60,  176.40, NULL,            'UNMATCHED'),
        ('TENANT_DELIMART', 'CLR-DELI-2610-006', COALESCE(v_natcom_id, v_partner_id), v_partner_id, '+50937001001', 2400.00, 2400.00, 1.0000, 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '18 days',CURRENT_TIMESTAMP - INTERVAL '18 days','ORD-PETION-7701', 48.00, 2352.00, 'PAY-202610-69', 'MATCHED')
    ON CONFLICT (transaction_code) DO NOTHING;

    IF v_acc_main_id IS NOT NULL THEN
        INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, partner_id, description, created_at)
        SELECT 'TENANT_DELIMART', v_acc_main_id, 180.00, 1250.00, 'EARN', 'DELI-POS-EARN-1001', v_partner_id, 'Tích điểm hóa đơn siêu thị Delmas #POS1001', CURRENT_TIMESTAMP - INTERVAL '4 hours'
        WHERE NOT EXISTS (SELECT 1 FROM loyalty_point_ledger WHERE tenant_id = 'TENANT_DELIMART' AND reference_code = 'DELI-POS-EARN-1001');

        INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, partner_id, description, created_at)
        SELECT 'TENANT_DELIMART', v_acc_main_id, 95.00, 1070.00, 'CASHBACK', 'DELI-CB-1002', v_partner_id, 'Hoàn điểm X2 nhóm Nông sản Hữu cơ Artibonite', CURRENT_TIMESTAMP - INTERVAL '1 day'
        WHERE NOT EXISTS (SELECT 1 FROM loyalty_point_ledger WHERE tenant_id = 'TENANT_DELIMART' AND reference_code = 'DELI-CB-1002');
    END IF;

    IF v_acc_diamond_id IS NOT NULL THEN
        INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, partner_id, description, created_at)
        SELECT 'TENANT_DELIMART', v_acc_diamond_id, 420.00, 18500.00, 'EARN', 'DELI-POS-EARN-1003', v_partner_id, 'Tích điểm hóa đơn Pétion-Ville #PV2044', CURRENT_TIMESTAMP - INTERVAL '8 hours'
        WHERE NOT EXISTS (SELECT 1 FROM loyalty_point_ledger WHERE tenant_id = 'TENANT_DELIMART' AND reference_code = 'DELI-POS-EARN-1003');

        INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, partner_id, description, created_at)
        SELECT 'TENANT_DELIMART', v_acc_diamond_id, -600.00, 18080.00, 'BURN', 'DELI-POS-BURN-1004', v_partner_id, 'Thanh toán bằng điểm tại quầy Delimart Pétion-Ville', CURRENT_TIMESTAMP - INTERVAL '3 days'
        WHERE NOT EXISTS (SELECT 1 FROM loyalty_point_ledger WHERE tenant_id = 'TENANT_DELIMART' AND reference_code = 'DELI-POS-BURN-1004');
    END IF;

    IF v_acc_platinum_id IS NOT NULL THEN
        INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, partner_id, description, created_at)
        SELECT 'TENANT_DELIMART', v_acc_platinum_id, 260.00, 7420.00, 'EARN', 'DELI-POS-EARN-1005', v_partner_id, 'Tích điểm mua Sữa & Mẹ Bé tại Delmas 33', CURRENT_TIMESTAMP - INTERVAL '2 days'
        WHERE NOT EXISTS (SELECT 1 FROM loyalty_point_ledger WHERE tenant_id = 'TENANT_DELIMART' AND reference_code = 'DELI-POS-EARN-1005');
    END IF;

    IF v_acc_gold_id IS NOT NULL THEN
        INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, partner_id, description, created_at)
        SELECT 'TENANT_DELIMART', v_acc_gold_id, 145.00, 2350.00, 'EARN', 'DELI-POS-EARN-1006', v_partner_id, 'Tích điểm cuối tuần Carrefour Express #CR309', CURRENT_TIMESTAMP - INTERVAL '4 days'
        WHERE NOT EXISTS (SELECT 1 FROM loyalty_point_ledger WHERE tenant_id = 'TENANT_DELIMART' AND reference_code = 'DELI-POS-EARN-1006');
    END IF;

    IF v_acc_silver1_id IS NOT NULL THEN
        INSERT INTO loyalty_point_ledger (tenant_id, account_id, point_change, balance_after, change_type, reference_code, partner_id, description, created_at)
        SELECT 'TENANT_DELIMART', v_acc_silver1_id, 90.00, 640.00, 'EARN', 'DELI-POS-EARN-1007', v_partner_id, 'Tích điểm đơn đầu tiên Cap-Haïtien Plaza', CURRENT_TIMESTAMP - INTERVAL '5 days'
        WHERE NOT EXISTS (SELECT 1 FROM loyalty_point_ledger WHERE tenant_id = 'TENANT_DELIMART' AND reference_code = 'DELI-POS-EARN-1007');
    END IF;

    -- 13. Bảng kê đối soát thanh toán, Khiếu nại & Clearinghouse Delimart
    INSERT INTO clearing_payment_batches (
        tenant_id, batch_code, partner_id, period, gross_amount, discount_amount,
        mdr_fee_amount, net_payable_amount, tx_count, confirm_deadline_at,
        confirmed_at, confirmed_by, paid_at, bank_ref_code, status
    ) VALUES
        ('TENANT_DELIMART', 'PAY-202610-69', v_partner_id, '2026-10', 185000.00, 1500.00, 3670.00, 179830.00, 312, CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP - INTERVAL '26 days', 'owner_delimart', CURRENT_TIMESTAMP - INTERVAL '24 days', 'FT26305DELI001', 'PAID'),
        ('TENANT_DELIMART', 'PAY-202609-69', v_partner_id, '2026-09', 142000.00,  800.00, 2824.00, 138376.00, 248, CURRENT_TIMESTAMP - INTERVAL '55 days', CURRENT_TIMESTAMP - INTERVAL '56 days', 'acc_delimart',   CURRENT_TIMESTAMP - INTERVAL '53 days', 'FT26275DELI002', 'PAID'),
        ('TENANT_DELIMART', 'PAY-202610-W4-69', v_partner_id, '2026-10-W4', 24500.00, 0.00, 490.00, 24010.00, 41, CURRENT_TIMESTAMP - INTERVAL '10 days', NULL, NULL, NULL, NULL, 'DISPUTED')
    ON CONFLICT (batch_code) DO NOTHING;

    INSERT INTO loyalty_clearing_disputes (
        tenant_id, dispute_code, batch_code, partner_id, dispute_type,
        partner_amount, loyalty_amount, resolved_amount, status, resolution_note, resolved_at
    ) VALUES
        ('TENANT_DELIMART', 'KN-DELI-001', 'PAY-202610-W4-69', v_partner_id, 'AMOUNT_MISMATCH', 24500.00, 23200.00, 0.00, 'OPEN', 'Đối chiếu chênh lệch 1.300 HTG ở 3 hóa đơn quầy Delmas ngày 28/10 do timeout kết nối mạng POS', NULL),
        ('TENANT_DELIMART', 'KN-DELI-002', 'PAY-202610-69',    v_partner_id, 'DUPLICATE_HOLD',  1200.00,  1200.00, 1200.00, 'RESOLVED', 'Đã xác nhận khớp lệnh bù trừ, hoàn trả đủ vào kỳ quyết toán PAY-202610-69', CURRENT_TIMESTAMP - INTERVAL '25 days')
    ON CONFLICT (dispute_code) DO NOTHING;

    INSERT INTO loyalty_clearinghouse_settlements (
        tenant_id, partner_id, period, total_points_issued, total_points_redeemed,
        net_points, net_settlement_amount, status, settled_at
    ) VALUES
        ('TENANT_DELIMART', v_partner_id, '2026-10', 92500.00, 185000.00, -92500.00, 179830.00, 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '24 days'),
        ('TENANT_DELIMART', v_partner_id, '2026-11', 64200.00, 128400.00, -64200.00, 125832.00, 'PENDING', NULL)
    ON CONFLICT ON CONSTRAINT uq_clearinghouse_period DO NOTHING;

    -- 14. Thông báo đối tác Delimart
    INSERT INTO partner_notifications (tenant_id, partner_id, notif_type, title, message, action_url, is_read, read_at, created_at)
    SELECT 'TENANT_DELIMART', v_partner_id, 'SETTLEMENT', 'Kỳ đối soát tháng 11/2026 (PAY-202611-69) đang chờ xác nhận', 'Bảng kê công nợ chu kỳ tháng 11 tổng giá trị ròng đang chờ Kế toán trưởng hoặc Chủ sở hữu Delimart xác nhận trước hạn.', '/settlements', false, NULL, CURRENT_TIMESTAMP - INTERVAL '3 hours'
    WHERE NOT EXISTS (SELECT 1 FROM partner_notifications WHERE tenant_id = 'TENANT_DELIMART' AND partner_id = v_partner_id AND title = 'Kỳ đối soát tháng 11/2026 (PAY-202611-69) đang chờ xác nhận');

    INSERT INTO partner_notifications (tenant_id, partner_id, notif_type, title, message, action_url, is_read, read_at, created_at)
    SELECT 'TENANT_DELIMART', v_partner_id, 'APPROVAL', 'Đề xuất PROP-DELI-2026-001 đã được phê duyệt', 'Chiến dịch Tuần lễ Tích điểm X2 Nông sản Sạch Delimart (đồng tài trợ 30% từ Natcash) đã có hiệu lực.', '/proposals', false, NULL, CURRENT_TIMESTAMP - INTERVAL '1 day'
    WHERE NOT EXISTS (SELECT 1 FROM partner_notifications WHERE tenant_id = 'TENANT_DELIMART' AND partner_id = v_partner_id AND title = 'Đề xuất PROP-DELI-2026-001 đã được phê duyệt');

    INSERT INTO partner_notifications (tenant_id, partner_id, notif_type, title, message, action_url, is_read, read_at, created_at)
    SELECT 'TENANT_DELIMART', v_partner_id, 'SECURITY', 'Nhắc nhở xoay vòng khóa Kiosk Self-Checkout', 'Khóa pk_deli_ksk1 đang ở trạng thái ân hạn (Grace Period), vui lòng hoàn tất chuyển đổi trong 48 giờ.', '/api-keys', true, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '3 days'
    WHERE NOT EXISTS (SELECT 1 FROM partner_notifications WHERE tenant_id = 'TENANT_DELIMART' AND partner_id = v_partner_id AND title = 'Nhắc nhở xoay vòng khóa Kiosk Self-Checkout');

    -- 15. Dữ liệu CMS & Webview bổ sung cho TENANT_DELIMART
    INSERT INTO loyalty_monthly_budgets (tenant_id, budget_month, sponsor_type, partner_id, budget_name, budget_cap, consumed_amount, status)
    VALUES
        ('TENANT_DELIMART', '2026-11', 'PARTNER_CO_FUND', v_partner_id, 'Ngân sách Đồng tài trợ Natcash x Delimart T11/2026', 200000.00, 68500.00, 'ACTIVE'),
        ('TENANT_DELIMART', '2026-11', 'PARTNER_SELF',    v_partner_id, 'Ngân sách Tự chi Delimart VIP Loyalty T11/2026',    120000.00, 34200.00, 'ACTIVE'),
        ('TENANT_DELIMART', '2026-10', 'NATCASH',         NULL,         'Ngân sách Liên minh Delimart T10/2026',             300000.00, 278400.00, 'INACTIVE')
    ON CONFLICT ON CONSTRAINT uq_monthly_budget DO NOTHING;

    INSERT INTO loyalty_campaign_milestones (tenant_id, campaign_code, campaign_name, milestone_step, target_metric, target_value, reward_points, reward_voucher_id, reward_game_turns, start_date, end_date, status, partner_id)
    VALUES
        ('TENANT_DELIMART', 'CAMP_DELI_HARVEST', 'Chinh Phục Mùa Gặt Delimart', 1, 'TRANSACTION_COUNT', 3.00,    100.00, v_voucher_ship_id,  2, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '50 days', 'ACTIVE', v_partner_id),
        ('TENANT_DELIMART', 'CAMP_DELI_HARVEST', 'Chinh Phục Mùa Gặt Delimart', 2, 'BILL_AMOUNT',       2500.00, 300.00, v_voucher_50k_id,   3, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '50 days', 'ACTIVE', v_partner_id),
        ('TENANT_DELIMART', 'CAMP_DELI_HARVEST', 'Chinh Phục Mùa Gặt Delimart', 3, 'BILL_AMOUNT',       6000.00, 800.00, v_voucher_bf100_id, 5, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '50 days', 'ACTIVE', v_partner_id)
    ON CONFLICT ON CONSTRAINT uq_loyalty_milestone DO NOTHING;

    INSERT INTO campaign_rule_conditions (tenant_id, campaign_code, campaign_name, mission_category, when_event, if_conditions, then_rewards, limits_config, sponsor_type, partner_id, start_date, end_date, status)
    VALUES
        ('TENANT_DELIMART', 'RULE_DELI_WEEKEND_X2', 'Tích điểm X2 Nông sản Sạch cuối tuần', 'SPEND_TIERED', '{"event":"POS_PURCHASE"}'::jsonb, '{"minAmount":300,"days":["FRI","SAT","SUN"]}'::jsonb, '{"multiplier":2.0,"bonusPoints":50}'::jsonb, '{"maxPerUserPerDay":500}'::jsonb, 'PARTNER_CO_FUND', v_partner_id, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP + INTERVAL '53 days', 'ACTIVE'),
        ('TENANT_DELIMART', 'RULE_DELI_FIRST_QR_POS', 'Thưởng khách hàng mới quét QR lần đầu tại Delimart', 'TX_COUNT', '{"event":"POS_QR_BURN"}'::jsonb, '{"firstTimeOnly":true}'::jsonb, '{"bonusPoints":120,"gameTurns":2}'::jsonb, '{"maxPerUserLifetime":1}'::jsonb, 'PARTNER_SELF', v_partner_id, CURRENT_TIMESTAMP - INTERVAL '14 days', CURRENT_TIMESTAMP + INTERVAL '90 days', 'ACTIVE')
    ON CONFLICT ON CONSTRAINT uq_campaign_rule_code DO NOTHING;

    INSERT INTO customer_segments (tenant_id, segment_code, segment_name, description, criteria_json, member_count, status)
    VALUES
        ('TENANT_DELIMART', 'HIGH_VALUE',      'Khách hàng Thân thiết Giỏ Hàng Cao',   'Thành viên hạng Platinum/Diamond chi tiêu trên 5.000 HTG/tháng',                   '{"minMonthlySpend":5000}'::jsonb,                     2, 'ACTIVE'),
        ('TENANT_DELIMART', 'PARTNER_SHOPPER', 'Nhóm Yêu Thích Thực Phẩm Sạch',        'Khách hàng mua nhóm GROCERY_FRESH và ORGANIC_PRODUCE trên 3 lần/tháng',             '{"productGroups":["GROCERY_FRESH","ORGANIC_PRODUCE"]}'::jsonb, 3, 'ACTIVE'),
        ('TENANT_DELIMART', 'WIN_BACK',        'Nhóm Cảnh Báo Giảm Tần Suất Mua',       'Thành viên không phát sinh giao dịch quá 21 ngày nhưng còn điểm sắp hết hạn',       '{"inactiveDays":21}'::jsonb,                          2, 'ACTIVE')
    ON CONFLICT ON CONSTRAINT uq_customer_segment DO NOTHING;

    SELECT id INTO v_seg_vip_id   FROM customer_segments WHERE tenant_id = 'TENANT_DELIMART' AND segment_code = 'HIGH_VALUE'      LIMIT 1;
    SELECT id INTO v_seg_fresh_id FROM customer_segments WHERE tenant_id = 'TENANT_DELIMART' AND segment_code = 'PARTNER_SHOPPER' LIMIT 1;
    SELECT id INTO v_seg_churn_id FROM customer_segments WHERE tenant_id = 'TENANT_DELIMART' AND segment_code = 'WIN_BACK'        LIMIT 1;

    IF v_seg_vip_id IS NOT NULL THEN
        INSERT INTO customer_segment_members (tenant_id, segment_id, segment_code, external_user_id, score)
        VALUES
            ('TENANT_DELIMART', v_seg_vip_id, 'HIGH_VALUE', '+50937001001', 96.50),
            ('TENANT_DELIMART', v_seg_vip_id, 'HIGH_VALUE', '+50937001002', 88.20)
        ON CONFLICT ON CONSTRAINT uq_segment_member DO NOTHING;
    END IF;

    IF v_seg_fresh_id IS NOT NULL THEN
        INSERT INTO customer_segment_members (tenant_id, segment_id, segment_code, external_user_id, score)
        VALUES
            ('TENANT_DELIMART', v_seg_fresh_id, 'PARTNER_SHOPPER', '84988888888',  91.00),
            ('TENANT_DELIMART', v_seg_fresh_id, 'PARTNER_SHOPPER', '+50937001001', 89.40),
            ('TENANT_DELIMART', v_seg_fresh_id, 'PARTNER_SHOPPER', '+50937001003', 82.10)
        ON CONFLICT ON CONSTRAINT uq_segment_member DO NOTHING;
    END IF;

    IF v_seg_churn_id IS NOT NULL THEN
        INSERT INTO customer_segment_members (tenant_id, segment_id, segment_code, external_user_id, score)
        VALUES
            ('TENANT_DELIMART', v_seg_churn_id, 'WIN_BACK', '+50937001004', 65.00),
            ('TENANT_DELIMART', v_seg_churn_id, 'WIN_BACK', '+50937001005', 70.00)
        ON CONFLICT ON CONSTRAINT uq_segment_member DO NOTHING;
    END IF;

    INSERT INTO reminder_scenarios (
        tenant_id, scenario_code, scenario_name, target_segment, channel, trigger_event,
        title_vi, title_en, title_fr, title_ht,
        body_vi, body_en, body_fr, body_ht,
        deep_link, cooldown_hours, is_marketing, status
    ) VALUES
        (
            'TENANT_DELIMART', 'REM_DELI_EXPIRING_PTS', 'Nhắc nhở Điểm sắp hết hạn tại Delimart', 'WIN_BACK', 'PUSH_NOTIFICATION', 'POINTS_EXPIRING_14D',
            'Bạn có 250 điểm Delimart sắp hết hạn!', '250 Delimart points expiring soon!', '250 points Delimart bientôt expirés !', '250 pwen Delimart ap ekspire byento!',
            'Ghé ngay chi nhánh Delimart gần nhất để đổi voucher giảm tới 50 HTG trước khi điểm hết hạn.', 'Visit your nearest Delimart store to redeem vouchers worth up to 50 HTG before expiry.', 'Visitez votre magasin Delimart pour échanger vos points contre des bons de 50 HTG.', 'Vizite magazen Delimart ki pi pre w la pou itilize pwen w yo anvan yo ekspire.',
            '/vouchers', 48, true, 'ACTIVE'
        ),
        (
            'TENANT_DELIMART', 'REM_DELI_VOUCHER_READY', 'Nhắc dùng Voucher Delimart tại quầy POS', 'GENERAL', 'IN_APP', 'VOUCHER_CLAIMED_UNUSED',
            'Phiếu giảm giá Delimart đang chờ tại quầy thu ngân', 'Your Delimart voucher is ready at checkout', 'Votre bon Delimart est prêt en caisse', 'Koupon Delimart ou a pare nan kesye a',
            'Đưa mã QR Ví Phần Thưởng cho thu ngân Delimart để áp dụng ngay hóa đơn hôm nay.', 'Show your Reward Wallet QR code to the Delimart cashier on your next purchase.', 'Présentez votre QR code Reward Wallet à la caisse Delimart.', 'Montre kòd QR Reward Wallet ou a bay kesye Delimart la lè w ap peye.',
            '/wallet', 24, false, 'ACTIVE'
        )
    ON CONFLICT ON CONSTRAINT uq_reminder_scenario DO NOTHING;

    INSERT INTO user_referrals (tenant_id, referrer_user_id, referee_user_id, referee_phone, referral_code, ekyc_verified, first_tx_completed, reward_points, status, rewarded_at)
    SELECT 'TENANT_DELIMART', '84988888888', '+50937001003', '+50937001003', 'REF-DELI-8881', true, true, 150.00, 'REWARDED', CURRENT_TIMESTAMP - INTERVAL '6 days'
    WHERE NOT EXISTS (SELECT 1 FROM user_referrals WHERE tenant_id = 'TENANT_DELIMART' AND referral_code = 'REF-DELI-8881');

    INSERT INTO user_referrals (tenant_id, referrer_user_id, referee_user_id, referee_phone, referral_code, ekyc_verified, first_tx_completed, reward_points, status, rewarded_at)
    SELECT 'TENANT_DELIMART', '84988888888', '+50937001004', '+50937001004', 'REF-DELI-8882', true, false, 0.00, 'PENDING', NULL
    WHERE NOT EXISTS (SELECT 1 FROM user_referrals WHERE tenant_id = 'TENANT_DELIMART' AND referral_code = 'REF-DELI-8882');

    INSERT INTO learning_courses (tenant_id, course_code, title_vi, title_en, title_fr, title_ht, description_vi, description_en, game_category, level, total_questions, reward_tier1_points, reward_tier2_points, reward_tier3_points, status)
    VALUES
        ('TENANT_DELIMART', 'COURSE_DELI_SMART_SHOPPER', 'Bí Quyết Mua Sắm Thông Minh Tại Delimart', 'Smart Shopping at Delimart', 'Achats Malin chez Delimart', 'Achte Entèlijan nan Delimart', 'Cách tối ưu tích điểm và tiêu điểm theo nhóm hàng tại hệ thống siêu thị Delimart', 'Learn how to maximize earn and burn rewards across Delimart aisles', 'LEARNING_EDTECH', 'BEGINNER', 2, 20.00, 50.00, 100.00, 'ACTIVE'),
        ('TENANT_DELIMART', 'COURSE_DELI_ORGANIC_FOOD', 'Cẩm Nang Dinh Dưỡng & Nông Sản Sạch Haïti', 'Haïti Organic Nutrition Guide', 'Guide Nutrition Bio Haïti', 'Gid Nitrisyon Bio Ayiti', 'Nhận biết thực phẩm hữu cơ Artibonite và quy tắc bảo quản tươi ngon', 'Discover local Artibonite organic produce and freshness tips', 'LEARNING_EDTECH', 'INTERMEDIATE', 2, 30.00, 75.00, 150.00, 'ACTIVE')
    ON CONFLICT ON CONSTRAINT uq_learning_course DO NOTHING;

    SELECT id INTO v_course_shopper_id FROM learning_courses WHERE tenant_id = 'TENANT_DELIMART' AND course_code = 'COURSE_DELI_SMART_SHOPPER' LIMIT 1;
    SELECT id INTO v_course_nutri_id   FROM learning_courses WHERE tenant_id = 'TENANT_DELIMART' AND course_code = 'COURSE_DELI_ORGANIC_FOOD'  LIMIT 1;

    IF v_course_shopper_id IS NOT NULL THEN
        INSERT INTO learning_questions (tenant_id, course_id, question_text, options, correct_option_index, explanation, difficulty, display_order, status)
        SELECT 'TENANT_DELIMART', v_course_shopper_id,
               '{"vi":"Nhóm hàng nào tại Delimart đang áp dụng tỷ lệ tích điểm cao nhất 3%/hóa đơn?","en":"Which Delimart category earns the highest 3% loyalty rate?","fr":"Quelle catégorie Delimart rapporte 3% de points ?","ht":"Ki kategori Delimart ki bay pi gwo pousantaj 3% pwen?"}'::jsonb,
               '{"vi":["Gia dụng điện máy","Nông sản hữu cơ địa phương","Đồ uống đóng chai","Văn phòng phẩm"],"en":["Appliances","Local Organic Produce","Beverages","Stationery"]}'::jsonb,
               1,
               '{"vi":"Nhóm Nông sản Hữu cơ Địa phương được ưu tiên hệ số tích điểm 3.00% và cho phép tiêu điểm tới 60%.","en":"Local Organic Produce earns 3.00% and allows up to 60% burn."}'::jsonb,
               'EASY', 1, 'ACTIVE'
        WHERE NOT EXISTS (SELECT 1 FROM learning_questions WHERE tenant_id = 'TENANT_DELIMART' AND course_id = v_course_shopper_id AND display_order = 1);

        INSERT INTO learning_questions (tenant_id, course_id, question_text, options, correct_option_index, explanation, difficulty, display_order, status)
        SELECT 'TENANT_DELIMART', v_course_shopper_id,
               '{"vi":"Mã QR Ví Phần Thưởng khi đưa cho thu ngân Delimart có hiệu lực bảo mật trong bao lâu?","en":"How long is a Reward Wallet dynamic QR code valid at Delimart POS?","fr":"Combien de temps le QR code dynamique est-il valide ?","ht":"Konbyen tan kòd QR dinamik la rete valab nan Delimart?"}'::jsonb,
               '{"vi":["15 giây","60 giây","30 phút","24 giờ"],"en":["15 seconds","60 seconds","30 minutes","24 hours"]}'::jsonb,
               1,
               '{"vi":"Mã QR động tự làm mới sau mỗi 60 giây để bảo vệ số dư điểm của hội viên.","en":"Dynamic QR rotates every 60 seconds for security."}'::jsonb,
               'EASY', 2, 'ACTIVE'
        WHERE NOT EXISTS (SELECT 1 FROM learning_questions WHERE tenant_id = 'TENANT_DELIMART' AND course_id = v_course_shopper_id AND display_order = 2);
    END IF;

    INSERT INTO game_monthly_leaderboards (tenant_id, leaderboard_month, external_user_id, display_name, total_score, games_played, rank_position)
    VALUES
        ('TENANT_DELIMART', '2026-11', '+50937001001', 'Jean-Pierre Laurent',  9850, 42, 1),
        ('TENANT_DELIMART', '2026-11', '84988888888',  'Hội Viên Delimart #1', 8420, 36, 2),
        ('TENANT_DELIMART', '2026-11', '+50937001002', 'Marie-Claire Joseph',  7190, 29, 3),
        ('TENANT_DELIMART', '2026-11', '+50937001003', 'Wilson Jean-Baptiste', 5630, 21, 4),
        ('TENANT_DELIMART', '2026-11', '+50937001004', 'Sophia Pierre-Louis',  4120, 15, 5)
    ON CONFLICT ON CONSTRAINT uq_game_leaderboard DO NOTHING;

    INSERT INTO agent_loyalty_programs (tenant_id, agent_code, external_user_id, full_name, phone_number, agent_role, province, monthly_customer_target, reward_amount_htg, status)
    VALUES ('TENANT_DELIMART', 'AGT_DELI_SUP_01', '+50937009001', 'Tổng Đại Lý Phân Phối Delimart Ouest', '+50937009001', 'SUPER_AGENT', 'Ouest', 300, 15000.00, 'ACTIVE')
    ON CONFLICT ON CONSTRAINT uq_agent_code DO NOTHING;

    SELECT id INTO v_super_agent_id FROM agent_loyalty_programs WHERE tenant_id = 'TENANT_DELIMART' AND agent_code = 'AGT_DELI_SUP_01' LIMIT 1;

    INSERT INTO agent_loyalty_programs (tenant_id, agent_code, external_user_id, full_name, phone_number, agent_role, super_agent_id, province, monthly_customer_target, reward_amount_htg, status)
    VALUES
        ('TENANT_DELIMART', 'AGT_DELI_01', '+50937009002', 'Điểm Giao Dịch Delimart Delmas 33',  '+50937009002', 'AGENT', v_super_agent_id, 'Ouest', 120, 4000.00, 'ACTIVE'),
        ('TENANT_DELIMART', 'AGT_DELI_02', '+50937009003', 'Điểm Giao Dịch Delimart Cap-Haïtien','+50937009003', 'AGENT', v_super_agent_id, 'Nord',  100, 3500.00, 'ACTIVE')
    ON CONFLICT ON CONSTRAINT uq_agent_code DO NOTHING;

    INSERT INTO ai_campaign_suggestions (tenant_id, objective, target_segment, budget_cap, suggested_config, conflicts_detected, estimated_roi_pct, created_by)
    SELECT 'TENANT_DELIMART', 'Tăng tỷ lệ quay lại nhóm khách hàng mua thực phẩm tươi sống Delimart', 'PARTNER_SHOPPER', 120000.00,
           '{"campaignName":"Deli Fresh Streak 4x","rewardType":"BONUS_POINTS","earnBoost":2.0,"recommendedDurationDays":21}'::jsonb,
           '[]'::jsonb, 148.50, 'ai-copilot'
    WHERE NOT EXISTS (SELECT 1 FROM ai_campaign_suggestions WHERE tenant_id = 'TENANT_DELIMART' AND objective = 'Tăng tỷ lệ quay lại nhóm khách hàng mua thực phẩm tươi sống Delimart');

    INSERT INTO system_alerts (tenant_id, alert_code, alert_type, severity, title, message, source_ref, acknowledged)
    SELECT 'TENANT_DELIMART', 'ALERT_DELI_SETTLEMENT_11', 'BUDGET_80', 'INFO', 'Kỳ quyết toán PAY-202611-69 của Delimart đang chờ xác nhận', 'Kỳ đối soát tháng 11 có giao dịch chờ đối soát cần đối tác xác nhận trên Partner Portal.', 'PAY-202611-69', false
    WHERE NOT EXISTS (SELECT 1 FROM system_alerts WHERE tenant_id = 'TENANT_DELIMART' AND alert_code = 'ALERT_DELI_SETTLEMENT_11');

    INSERT INTO system_alerts (tenant_id, alert_code, alert_type, severity, title, message, source_ref, acknowledged)
    SELECT 'TENANT_DELIMART', 'ALERT_DELI_DISPUTE_01', 'CLEARING_DISPUTE', 'WARNING', 'Khiếu nại KN-DELI-001 đang mở xử lý', 'Khiếu nại chênh lệch 1.300 HTG kỳ PAY-202610-W4-69 đang chờ tổ đối soát xử lý.', 'KN-DELI-001', false
    WHERE NOT EXISTS (SELECT 1 FROM system_alerts WHERE tenant_id = 'TENANT_DELIMART' AND alert_code = 'ALERT_DELI_DISPUTE_01');

    INSERT INTO support_playbooks (tenant_id, playbook_code, title, category, steps_json, locale, status)
    VALUES
        (
            'TENANT_DELIMART', 'PB_DELI_VOUCHER_COUNTER', 'Xử lý Voucher Delimart không gạch được tại quầy POS', 'VOUCHER_POS',
            '[{"step":1,"action":"Kiểm tra mã RED-* thuộc đúng tenant TENANT_DELIMART và chưa quá hạn"},{"step":2,"action":"Đối chiếu trạng thái chi nhánh (không ở trạng thái INACTIVE như Tabarre)"},{"step":3,"action":"Dùng màn hình Gạch nợ Voucher trên Partner Portal hoặc gọi API POS với X-Api-Key hợp lệ"}]'::jsonb,
            'vi', 'ACTIVE'
        ),
        (
            'TENANT_DELIMART', 'PB_DELI_SETTLEMENT_CLAIM', 'Quy trình tiếp nhận khiếu nại chênh lệch quyết toán Delimart', 'SETTLEMENT',
            '[{"step":1,"action":"Kiểm tra mã kỳ đối soát PAY-* và đối chiếu danh sách clearing_transactions"},{"step":2,"action":"Xác minh chứng từ đối soát từ Kế toán Delimart (acc_delimart)"},{"step":3,"action":"Chốt số tiền điều chỉnh và cập nhật trạng thái kỳ đối soát"}]'::jsonb,
            'vi', 'ACTIVE'
        )
    ON CONFLICT ON CONSTRAINT uq_support_playbook DO NOTHING;

    INSERT INTO user_inbox_messages (tenant_id, external_user_id, category, title, body, deep_link, is_read)
    SELECT 'TENANT_DELIMART', '84988888888', 'PROMOTION', 'Ưu đãi X2 điểm Nông sản Sạch tại Delimart', 'Mua sắm nhóm Nông sản Hữu cơ cuối tuần này để nhận gấp đôi điểm thưởng và 2 lượt chơi Nông trại Delimart.', '/campaigns', false
    WHERE NOT EXISTS (SELECT 1 FROM user_inbox_messages WHERE tenant_id = 'TENANT_DELIMART' AND external_user_id = '84988888888' AND title = 'Ưu đãi X2 điểm Nông sản Sạch tại Delimart');

    INSERT INTO user_inbox_messages (tenant_id, external_user_id, category, title, body, deep_link, is_read)
    SELECT 'TENANT_DELIMART', '84988888888', 'WALLET', 'Bạn đang có 2 phiếu giảm giá Delimart sẵn sàng sử dụng', 'Xuất trình mã RED-DELI-POS-001 hoặc QR Ví Phần Thưởng tại 5 chi nhánh Delimart để giảm ngay 50 HTG.', '/vouchers', false
    WHERE NOT EXISTS (SELECT 1 FROM user_inbox_messages WHERE tenant_id = 'TENANT_DELIMART' AND external_user_id = '84988888888' AND title = 'Bạn đang có 2 phiếu giảm giá Delimart sẵn sàng sử dụng');
END $$;
