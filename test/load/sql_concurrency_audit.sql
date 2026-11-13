-- =========================================================================================
-- BỘ TRUY VẤN ĐỐI SOÁT TOÀN VẸN DỮ LIỆU ĐỒNG THỜI SAU KIỂM THỬ TẢI CAO (POST-STRESS AUDIT)
-- Chuẩn Bằng Chứng Thực Chứng & Bẫy Dữ Liệu Đồng Thời (Concurrency Data Integrity Standard)
-- Tương thích 100% với Schema PostgreSQL 15+ (V1..V23)
-- =========================================================================================

-- BẪY 1: Kiểm tra lệch số dư giữa Bảng Tài khoản (loyalty_accounts) và Tổng Sổ Cái (loyalty_point_ledger)
-- YÊU CẦU: Kết quả trả về BẮT BUỘC 0 BẢN GHI (Count = 0). Nếu phát sinh bất kỳ dòng nào => LỖI TRANH CHẤP SỐ DƯ TÀI CHÍNH.
SELECT
    a.id AS account_id,
    a.tenant_id,
    a.external_user_id,
    a.current_points AS account_balance,
    COALESCE(SUM(l.point_change), 0) AS calculated_ledger_sum,
    (a.current_points - COALESCE(SUM(l.point_change), 0)) AS balance_discrepancy
FROM loyalty_accounts a
LEFT JOIN loyalty_point_ledger l ON a.id = l.account_id
GROUP BY a.id, a.tenant_id, a.external_user_id, a.current_points
HAVING a.current_points != COALESCE(SUM(l.point_change), 0);

-- BẪY 2: Kiểm tra trùng lặp mã tham chiếu Idempotency (reference_code) trong sổ cái
-- YÊU CẦU: Kết quả trả về 0 BẢN GHI. Nếu có => LỖI GẠCH NỢ / CỘNG ĐIỂM TRÙNG LẶP.
SELECT
    tenant_id,
    reference_code,
    COUNT(*) AS duplicate_count
FROM loyalty_point_ledger
WHERE reference_code IS NOT NULL
GROUP BY tenant_id, reference_code
HAVING COUNT(*) > 1;

-- BẪY 3: Kiểm tra tài khoản có số dư âm do tranh chấp đồng thời không có khóa
-- YÊU CẦU: Kết quả trả về 0 BẢN GHI.
SELECT
    id AS account_id,
    tenant_id,
    external_user_id,
    current_points,
    tier_points
FROM loyalty_accounts
WHERE current_points < 0
   OR tier_points < 0;

-- BẪY 4: Kiểm tra tính liên tục bất biến của số dư trong chuỗi Sổ cái (balance_before + point_change = balance_after)
--        và đối chiếu dòng sổ cái mới nhất với loyalty_accounts.current_points
-- Lưu ý: Bảng loyalty_point_ledger lưu (point_change, balance_after), nên balance_before được tính bằng hàm cửa sổ LAG().
-- YÊU CẦU: Kết quả trả về 0 BẢN GHI.
WITH ledger_chain AS (
    SELECT
        l.id,
        l.tenant_id,
        l.account_id,
        l.reference_code,
        l.change_type,
        LAG(l.balance_after) OVER (
            PARTITION BY l.account_id
            ORDER BY l.created_at ASC, l.id ASC
        ) AS balance_before,
        l.point_change,
        l.balance_after,
        ROW_NUMBER() OVER (
            PARTITION BY l.account_id
            ORDER BY l.created_at DESC, l.id DESC
        ) AS rn_desc
    FROM loyalty_point_ledger l
)
SELECT
    lc.id AS ledger_id,
    lc.tenant_id,
    lc.account_id,
    lc.reference_code,
    lc.change_type,
    lc.balance_before,
    lc.point_change,
    lc.balance_after,
    a.current_points AS account_current_points,
    CASE
        WHEN lc.balance_before IS NOT NULL AND (lc.balance_before + lc.point_change) != lc.balance_after
            THEN 'CHAIN_MATH_DRIFT'
        ELSE 'LATEST_BALANCE_MISMATCH'
    END AS anomaly_type,
    CASE
        WHEN lc.balance_before IS NOT NULL AND (lc.balance_before + lc.point_change) != lc.balance_after
            THEN (lc.balance_before + lc.point_change - lc.balance_after)
        ELSE (lc.balance_after - a.current_points)
    END AS balance_drift
FROM ledger_chain lc
JOIN loyalty_accounts a ON a.id = lc.account_id
WHERE (lc.balance_before IS NOT NULL AND (lc.balance_before + lc.point_change) != lc.balance_after)
   OR (lc.rn_desc = 1 AND lc.balance_after != a.current_points);

-- BẪY 5 (FIFO Buckets - V18): Kiểm tra toàn vẹn lô điểm hết hạn FIFO (point_expiration_buckets)
-- 5A: Tổng remaining_points của các lô FIFO phải khớp tuyệt đối với loyalty_accounts.current_points
-- YÊU CẦU: Kết quả trả về 0 BẢN GHI.
SELECT
    a.id AS account_id,
    a.tenant_id,
    a.external_user_id,
    a.current_points AS account_balance,
    COALESCE(SUM(b.remaining_points), 0) AS total_fifo_remaining_points,
    (a.current_points - COALESCE(SUM(b.remaining_points), 0)) AS fifo_discrepancy
FROM loyalty_accounts a
LEFT JOIN point_expiration_buckets b ON a.id = b.account_id
GROUP BY a.id, a.tenant_id, a.external_user_id, a.current_points
HAVING a.current_points != COALESCE(SUM(b.remaining_points), 0);

-- 5B: Không được phép tồn tại bất kỳ lô FIFO nào bị trừ âm (remaining_points < 0) hoặc vượt quá số điểm khởi tạo (remaining_points > initial_points)
-- YÊU CẦU: Kết quả trả về 0 BẢN GHI.
SELECT
    tenant_id,
    account_id,
    asset_type,
    source_ref,
    initial_points,
    remaining_points,
    expired_at,
    status
FROM point_expiration_buckets
WHERE remaining_points < 0
   OR remaining_points > initial_points;

-- BẪY 6 (Monthly Budget Cap - V20): Kiểm tra trần ngân sách tháng (loyalty_monthly_budgets)
-- YÊU CẦU: consumed_amount <= budget_cap (không vượt trần 100%) và consumed_amount >= 0. Kết quả trả về 0 BẢN GHI.
SELECT
    tenant_id,
    budget_month,
    sponsor_type,
    budget_cap,
    consumed_amount,
    (consumed_amount - budget_cap) AS budget_overrun_amount
FROM loyalty_monthly_budgets
WHERE consumed_amount > budget_cap
   OR consumed_amount < 0;

-- BẪY 7 (Maker-Checker & Clearing Batch - V18 & V19):
-- 7A: Kiểm tra nguyên tắc duyệt 2 lớp trên approval_requests (không có bản ghi APPROVED nào có maker_username = checker_username hoặc thiếu checker_username)
-- YÊU CẦU: Kết quả trả về 0 BẢN GHI.
SELECT
    tenant_id,
    target_type,
    target_id,
    action_type,
    maker_username,
    checker_username,
    status,
    reviewed_at
FROM approval_requests
WHERE status = 'APPROVED'
  AND (maker_username = checker_username OR checker_username IS NULL);

-- 7B: Kiểm tra công thức tài chính trên lô thanh toán bù trừ (clearing_payment_batches)
-- YÊU CẦU: net_payable_amount = gross_amount - discount_amount - mdr_fee_amount. Kết quả trả về 0 BẢN GHI.
SELECT
    tenant_id,
    gross_amount,
    discount_amount,
    mdr_fee_amount,
    net_payable_amount,
    ((gross_amount - discount_amount - mdr_fee_amount) - net_payable_amount) AS net_amount_discrepancy
FROM clearing_payment_batches
WHERE net_payable_amount != (gross_amount - discount_amount - mdr_fee_amount)
   OR net_payable_amount < 0;
