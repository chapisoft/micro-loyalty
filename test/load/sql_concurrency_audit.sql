-- =========================================================================================
-- BỘ TRUY VẤN ĐỐI SOÁT TOÀN VẸN DỮ LIỆU ĐỒNG THỜI SAU KIỂM THỬ TẢI CAO (POST-STRESS AUDIT)
-- Chuẩn Bằng Chứng Thực Chứng & Bẫy Dữ Liệu Đồng Thời (Concurrency Data Integrity Standard)
-- =========================================================================================

-- BẪY 1: Kiểm tra lệch số dư giữa Bảng Tài khoản (loyalty_accounts) và Tổng Sổ Cái (loyalty_point_ledger)
-- YÊU CẦU: Kết quả trả về BẮT BUỘC 0 BẢN GHI (Count = 0). Nếu phát sinh bất kỳ dòng nào => LỖI TRANH CHẤP SỐ DƯ TÀI CHÍNH.
SELECT 
    a.id AS account_id,
    a.tenant_id,
    a.external_user_id,
    a.current_points AS account_balance,
    COALESCE(SUM(l.points_delta), 0) AS calculated_ledger_sum,
    (a.current_points - COALESCE(SUM(l.points_delta), 0)) AS balance_discrepancy
FROM loyalty_accounts a
LEFT JOIN loyalty_point_ledger l ON a.id = l.account_id
GROUP BY a.id, a.tenant_id, a.external_user_id, a.current_points
HAVING a.current_points != COALESCE(SUM(l.points_delta), 0);

-- BẪY 2: Kiểm tra trùng lặp mã giao dịch Idempotency-Key trong sổ cái
-- YÊU CẦU: Kết quả trả về 0 BẢN GHI. Nếu có => LỖI GẠCH NỢ / CỘNG ĐIỂM TRÙNG LẶP.
SELECT 
    tenant_id,
    transaction_code,
    COUNT(*) AS duplicate_count
FROM loyalty_point_ledger
WHERE transaction_code IS NOT NULL
GROUP BY tenant_id, transaction_code
HAVING COUNT(*) > 1;

-- BẪY 3: Kiểm tra tài khoản có số dư âm do tranh chấp đồng thời không có khóa
-- YÊU CẦU: Kết quả trả về 0 BẢN GHI.
SELECT 
    id,
    tenant_id,
    external_user_id,
    current_points
FROM loyalty_accounts
WHERE current_points < 0;

-- BẪY 4: Kiểm tra tính liên tục bất biến của số dư trước và sau (Before - Delta = After) trong từng dòng Sổ cái
-- YÊU CẦU: Kết quả trả về 0 BẢN GHI.
SELECT 
    id,
    account_id,
    balance_before,
    points_delta,
    balance_after,
    (balance_before + points_delta - balance_after) AS ledger_math_drift
FROM loyalty_point_ledger
WHERE (balance_before + points_delta) != balance_after;
